
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prisma = new PrismaClient();
const BATCH_SIZE = 500;
const BATCH_DELAY_MS = 60 * 1000;
const MAX_CASE_IDS_TO_PROCESS = 1000; // Stop after processing 1000 case IDs
const RECORDS_PER_SESSION = 1000; // Process 1000 records per session
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 5000;


// Visual indicators
const SUCCESS = chalk.green('✅');
const FAILURE = chalk.red('❌');
const WARNING = chalk.yellow('⚠️');
const INFO = chalk.blue('ℹ️');

class PDFExtractor {
 

   constructor() {
    this.successfulProcesses = [];
    this.failedProcesses = [];
    this.processedUrls = new Set();
    this.processedCaseIds = new Set();
    this.batchCounter = 0;
    this.totalPdfsExtracted = 0;
    this.totalCaseIdsProcessed = 0;
    this.resumeFrom = 0;
    this.newCaseIdsProcessed = 0;
    this.sessionStartTime = Date.now();
    this.duplicateUrlSkips = 0;
    this.duplicateCaseSkips = 0;
    this.supremeCourtCasesProcessed = 0;
  }

  // Update the extractPdf method with better error handling and retry logic
async extractPdf(caseId, pdfUrl, attempt = 1) {
    try {

       // First verify this is a Supreme Court case (redundant check for safety)
      const caseInfo = await prisma.caseManagement.findUnique({
        where: { id: caseId },
        select: { court: true }
      });

      if (!caseInfo || caseInfo.court !== "Supreme Court") {
        const message = `${WARNING} Case ${caseId} is not a Supreme Court case - skipping`;
        this.failedProcesses.push({ caseId, pdfUrl, reason: 'Not Supreme Court', message });
        console.log(message);
        return { success: false, handled: true };
      }
        // Skip if case ID already processed in this run
        if (this.processedCaseIds.has(caseId)) {
            const message = `${WARNING} Case already processed in this batch (ID: ${caseId})`;
            this.failedProcesses.push({ caseId, pdfUrl, reason: 'Duplicate case ID in batch', message });
            console.log(message);
            return { success: false, caseId, handled: true };
        }

        // Skip if URL already processed in this run
        if (this.processedUrls.has(pdfUrl)) {
            const message = `${WARNING} PDF already processed in this batch (URL: ${pdfUrl}) for case ${caseId}`;
            this.failedProcesses.push({ caseId, pdfUrl, reason: 'Duplicate URL in batch', message });
            console.log(message);
            return { success: false, caseId, handled: true };
        }

        // Check if case ID or URL exists in database
        const existingJudgment = await prisma.extractedJudgments.findFirst({
            where: { 
                OR: [
                    { caseId: caseId },
                    { judgmentUrl: pdfUrl }
                ]
            },
            select: {
                caseId: true,
                judgmentUrl: true
            }
        });

        if (existingJudgment) {
            let reason, message;
            if (existingJudgment.caseId === caseId) {
                reason = 'Case already exists in extractedJudgments';
                message = `${WARNING} Case ${caseId} already exists in extractedJudgments table - skipping`;
            } else {
                reason = 'URL already exists in extractedJudgments';
                message = `${WARNING} PDF URL already exists in database (URL: ${pdfUrl}) for different case`;
            }
            
            this.failedProcesses.push({ caseId, pdfUrl, reason, message });
            console.log(message);
            return { success: false, caseId, handled: true };
        }

        console.log(chalk.blue(`[${caseId}] Downloading PDF (attempt ${attempt}): ${pdfUrl}`));
        
        // Download PDF with timeout
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.data || response.data.length === 0) {
            throw new Error('Empty PDF file received');
        }

        // Parse PDF with error handling
        let data;
        try {
            data = await pdf(response.data, {
                max: 1024 * 1024 * 50,
                pagerender: pageRenderer
            });
        } catch (err) {
            // Special handling for PDF parse errors
            if (err.message.includes('Invalid') || err.message.includes('hex string')) {
                console.log(chalk.yellow(`  ↳ PDF parsing error (attempt ${attempt}): ${err.message}`));
                if (attempt < MAX_RETRIES) {
                    console.log(chalk.yellow(`  ↳ Retrying (${attempt + 1}/${MAX_RETRIES}) after ${RETRY_DELAY_MS/1000}s...`));
                    await delay(RETRY_DELAY_MS);
                    return this.extractPdf(caseId, pdfUrl, attempt + 1);
                } else {
                    throw new Error(`PDF parse failed after ${MAX_RETRIES} attempts: ${err.message}`);
                }
            }
            throw err;
        }

        const extractedText = data.text.trim();
        
        // Validate extracted text
        if (extractedText.length > 10000000) {
            throw new Error(`Extracted text too large (${extractedText.length} chars)`);
        }

        if (extractedText.length < 50) {
            throw new Error('PDF text extraction too short - likely invalid PDF');
        }

        // Save to database
        await prisma.extractedJudgments.create({
            data: {
                caseId,
                judgmentUrl: pdfUrl,
                extractedText: extractedText.substring(0, 10000000),
                language: 'en',
                isSynced: false,
                createdAt: new Date()
            }
        });

        // Mark as processed
        this.processedUrls.add(pdfUrl);
        this.processedCaseIds.add(caseId);
        this.totalPdfsExtracted++;
        this.totalCaseIdsProcessed++;
        this.newCaseIdsProcessed++;

        const successMessage = `${SUCCESS} [${this.totalPdfsExtracted}] Successfully processed PDF for case ${caseId} (${extractedText.length} chars)`;
        this.successfulProcesses.push({ caseId, pdfUrl, message: successMessage });
        console.log(successMessage);

        this.supremeCourtCasesProcessed++; // Increment Supreme Court cases processed counter
        console.log(chalk.bold.green(`\nTotal Supreme Court cases processed: ${this.supremeCourtCasesProcessed}`));
        return { success: true, caseId };

    } catch (error) {
        // Special handling for PDF parse errors after max retries
        if (error.message.includes('PDF parse failed') || error.message.includes('Invalid PDF structure')) {
            const skipMessage = `${WARNING} [${caseId}] Skipping problematic PDF after ${MAX_RETRIES} attempts: ${pdfUrl}`;
            this.failedProcesses.push({ 
                caseId, 
                pdfUrl, 
                reason: 'Skipped problematic PDF', 
                message: skipMessage,
                error: error.message 
            });
            console.log(skipMessage);
            return { success: false, caseId, handled: true, skip: true };
        }

        // Regular error handling
        const errorMessage = `${FAILURE} Error processing case ${caseId} (URL: ${pdfUrl}): ${error.message}`;
        this.failedProcesses.push({ 
            caseId, 
            pdfUrl, 
            reason: 'Processing error', 
            message: errorMessage,
            error: error.stack 
        });
        console.error(errorMessage);
        
        if (error.message.includes('PDF parse error')) {
            console.log(chalk.yellow('  ↳ This PDF might be corrupted or have an unusual structure'));
        }
        return { success: false, caseId, error: error.message };
    }
}

// Update the processBatch method to handle skipped PDFs
async processBatch(cases) {
    this.batchCounter++;
    console.log(chalk.bold(`\nStarting Batch ${this.batchCounter} with ${cases.length} cases`));
    
    const batchStartTime = Date.now();
    const results = [];
    let newRecordsInserted = false;
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let skipPdfCount = 0; // Count of PDFs skipped due to errors
    const batchProcessedUrls = new Set();
    
    // Get all existing records that might conflict
    const existingRecords = await prisma.extractedJudgments.findMany({
        where: {
            OR: [
                { caseId: { in: cases.map(c => c.id) } },
                { judgmentUrl: { in: cases.flatMap(c => c.judgmentUrl || []) } }
            ]
        },
        select: {
            caseId: true,
            judgmentUrl: true
        }
    });

    const existingIdsSet = new Set(existingRecords.map(r => r.caseId));
    const existingUrlsSet = new Set(existingRecords.map(r => r.judgmentUrl).filter(Boolean));

    for (let i = 0; i < cases.length; i++) {
        const caseRecord = cases[i];
        const counter = i + 1;
        
        // Check session limit
        if (this.newCaseIdsProcessed >= RECORDS_PER_SESSION) {
            console.log(chalk.bold.yellow(`\nReached maximum of ${RECORDS_PER_SESSION} case IDs to process. Stopping...`));
            return {
                results: results.filter(Boolean),
                newRecordsInserted,
                stats: {
                    inserted: insertedCount,
                    skipped: skippedCount,
                    skippedPdfs: skipPdfCount,
                    duplicateCases: this.duplicateCaseSkips,
                    duplicateUrls: this.duplicateUrlSkips,
                    errors: errorCount
                },
                reachedLimit: true
            };
        }

        // Skip if case already exists
        if (existingIdsSet.has(caseRecord.id)) {
            this.duplicateCaseSkips++;
            const message = `${counter}. ${WARNING} Case ${caseRecord.id} already exists - skipping`;
            this.failedProcesses.push({ 
                caseId: caseRecord.id, 
                pdfUrl: caseRecord.judgmentUrl?.[0] || 'N/A', 
                reason: 'Duplicate case', 
                message 
            });
            console.log(message);
            skippedCount++;
            continue;
        }

        if (caseRecord.judgmentUrl?.length) {
            const firstPdfUrl = caseRecord.judgmentUrl[0];
            
            // Skip if URL exists in DB or current batch
            if (existingUrlsSet.has(firstPdfUrl) || batchProcessedUrls.has(firstPdfUrl)) {
                this.duplicateUrlSkips++;
                const message = `${counter}. ${WARNING} PDF URL already processed - skipping case ${caseRecord.id}`;
                this.failedProcesses.push({
                    caseId: caseRecord.id,
                    pdfUrl: firstPdfUrl,
                    reason: 'Duplicate URL',
                    message
                });
                console.log(message);
                skippedCount++;
                continue;
            }

            batchProcessedUrls.add(firstPdfUrl);
            
            try {
                const result = await this.extractPdf(caseRecord.id, firstPdfUrl);
                if (result) {
                    results.push(result);
                    if (result.success) {
                        newRecordsInserted = true;
                        insertedCount++;
                    } else if (result.skip) {
                        // Count as skipped PDF rather than error
                        skipPdfCount++;
                        skippedCount++;
                    } else {
                        errorCount++;
                    }
                }
            } catch (error) {
                errorCount++;
                const errorMessage = `${counter}. ${FAILURE} Error processing case ${caseRecord.id}: ${error.message}`;
                this.failedProcesses.push({
                    caseId: caseRecord.id,
                    pdfUrl: firstPdfUrl,
                    reason: 'PDF processing error',
                    message: errorMessage,
                    error: error.stack
                });
                console.error(errorMessage);
            }
        } else {
            skippedCount++;
            console.log(`${counter}. ${INFO} Case ${caseRecord.id} has no PDF URL - skipping`);
        }
    }
    
    const batchEndTime = Date.now();
    const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(2);
    const sessionDuration = ((batchEndTime - this.sessionStartTime) / 1000 / 60).toFixed(2);
    
    console.log(chalk.bold(`\nBatch ${this.batchCounter} completed in ${batchDuration} seconds`));
    console.log(chalk.bold.green(`✓ Successfully inserted: ${insertedCount} cases`));
    console.log(chalk.bold.yellow(`↻ Skipped: ${skippedCount} cases (${this.duplicateCaseSkips} duplicate cases, ${this.duplicateUrlSkips} duplicate URLs, ${skipPdfCount} problematic PDFs)`));
    console.log(chalk.bold.red(`✗ Failed: ${errorCount} cases`));
    console.log(chalk.bold.blue(`Total PDFs extracted: ${this.totalPdfsExtracted}`));
    console.log(chalk.bold.blue(`Total case IDs processed: ${this.totalCaseIdsProcessed}`));
    console.log(chalk.bold.magenta(`Session running for: ${sessionDuration} minutes`));
    
    this.printBatchSummary(results.filter(Boolean));
    
    return { 
        results: results.filter(Boolean), 
        newRecordsInserted,
        stats: {
            inserted: insertedCount,
            skipped: skippedCount,
            skippedPdfs: skipPdfCount,
            duplicateCases: this.duplicateCaseSkips,
            duplicateUrls: this.duplicateUrlSkips,
            errors: errorCount
        },
        reachedLimit: false
    };
}
  printBatchSummary(results) {
    const failedCases = results.filter(r => !r.success);
    
    if (failedCases.length > 0) {
      console.log(chalk.bold.red(`\nFailed cases in Batch ${this.batchCounter} (${failedCases.length}):`));
      failedCases.forEach((fail, index) => {
        console.log(`${index + 1}. Case ID: ${fail.caseId}`);
        if (fail.error) {
          console.log(`   Error: ${chalk.yellow(fail.error)}`);
        }
      });
      
      this.writeFailureReport(failedCases, this.batchCounter);
    } else {
      console.log(chalk.bold.green(`\nAll cases in Batch ${this.batchCounter} processed successfully!`));
    }
  }

  writeFailureReport(failedCases, batchNumber) {
    const reportDir = path.join(__dirname, 'failure_reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
      console.log(chalk.yellow(`Created directory: ${reportDir}`));
    }
    
    const reportPath = path.join(reportDir, `batch_${batchNumber}_failures.json`);
    const reportData = {
      batchNumber,
      timestamp: new Date().toISOString(),
      totalCases: failedCases.length + this.successfulProcesses.length,
      failedCases: failedCases.length,
      failedCaseDetails: failedCases.map(fail => ({
        caseId: fail.caseId,
        error: fail.error || 'Unknown error'
      }))
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(chalk.yellow(`\nDetailed failure report saved to: ${reportPath}`));
  }

  async disconnect() {
    await prisma.$disconnect();
  }

  getReport() {
    return {
      successful: this.successfulProcesses,
      failed: this.failedProcesses,
      summary: {
        totalProcessed: this.successfulProcesses.length + this.failedProcesses.length,
        successCount: this.successfulProcesses.length,
        failureCount: this.failedProcesses.length,
        uniqueCasesProcessed: new Set([...this.successfulProcesses, ...this.failedProcesses].map(p => p.caseId)).size,
        batchesProcessed: this.batchCounter,
        totalPdfsExtracted: this.totalPdfsExtracted,
        totalCaseIdsProcessed: this.totalCaseIdsProcessed
      }
    };
  }
}

async function pageRenderer(pageData) {
  const renderOptions = {
    normalizeWhitespace: true,
    disableCombineTextItems: false
  };
  
  try {
    const textContent = await pageData.getTextContent(renderOptions);
    let text = '';
    let lastY;
    
    for (const item of textContent.items) {
      text += (lastY === item.transform[5] ? ' ' : '\n') + item.str;
      lastY = item.transform[5];
    }
    return text;
  } catch (err) {
    console.error(chalk.yellow('Page render error:'), err);
    return '[PAGE RENDER ERROR]';
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
 

async function main() {
  console.log(chalk.bold.cyan('\nStarting Supreme court PDF extraction process...\n'));
  
  const extractor = new PDFExtractor();
  const CHUNK_SIZE = 1000;
  const BATCHES_PER_CHUNK = CHUNK_SIZE / BATCH_SIZE;
  
  try {
    // Check if we have a resume point from previous session
    const stateFile = path.join(__dirname, 'extraction_state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      extractor.resumeFrom = state.resumeFrom || 0;
      extractor.totalPdfsExtracted = state.totalPdfsExtracted || 0;
      // extractor.totalCaseIdsProcessed = state.totalCaseIdsProcessed || 0;
       console.log(chalk.bold.yellow(`\nResuming from record ${extractor.resumeFrom} with ${extractor.totalPdfsExtracted} PDFs already extracted`));
    }

    let skip = extractor.resumeFrom;
    let hasMoreCases = true;
    let chunkNumber = Math.floor(skip / CHUNK_SIZE) + 1;
    const INSERT_DELAY_MS = 60 * 1000;
    const CHECK_DELAY_MS = 10 * 1000;

    while (hasMoreCases) {
      console.log(chalk.bold.magenta(`\n=== Processing Chunk ${chunkNumber} (Records ${skip}-${skip + CHUNK_SIZE - 1}) ===`));
      
      const chunkCases = await prisma.caseManagement.findMany({
       where: {
          AND: [
            { judgmentUrl: { isEmpty: false } },
            { court: "Supreme Court" } // Exact match
          ]
        },
        skip: skip,
        take: CHUNK_SIZE,
        select: {
          id: true,
          judgmentUrl: true,
          createdAt: true,
          court: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (chunkCases.length === 0) {
        hasMoreCases = false;
       console.log(chalk.bold('\nNo more Supreme Court cases to process.'));
        break;
      }

        console.log(chalk.blue(`Found ${chunkCases.length} Supreme Court cases with PDFs`));

        

      let chunkInsertedCount = 0;
      let chunkSkippedCount = 0;
      let chunkErrorCount = 0;
      let sessionRecordsProcessed = 0;
      
      for (let batchInChunk = 0; batchInChunk < BATCHES_PER_CHUNK; batchInChunk++) {
        const batchStart = batchInChunk * BATCH_SIZE;
        const batchEnd = Math.min((batchInChunk + 1) * BATCH_SIZE, chunkCases.length);
        const batchCases = chunkCases.slice(batchStart, batchEnd);
        
        if (batchCases.length === 0) break;
        
        console.log(chalk.bold.blue(`\nProcessing Batch ${batchInChunk + 1} of Chunk ${chunkNumber} (Records ${skip + batchStart}-${skip + batchEnd - 1})`));
        
        const { results, newRecordsInserted, stats } = await extractor.processBatch(batchCases);
        
        chunkInsertedCount += stats.inserted;
        chunkSkippedCount += stats.skipped;
        chunkErrorCount += stats.errors;
        sessionRecordsProcessed += stats.inserted + stats.skipped + stats.errors;
        
        // Save progress after each batch
        fs.writeFileSync(stateFile, JSON.stringify({
          resumeFrom: skip + batchEnd,
          totalPdfsExtracted: extractor.totalPdfsExtracted,
          
        }, null, 2));
        
         // Check if we've processed enough NEW records for this session
      if (extractor.newCaseIdsProcessed >= RECORDS_PER_SESSION) {
        console.log(chalk.bold.green(`\nCompleted ${RECORDS_PER_SESSION} new records in this session.`));
        console.log(chalk.bold.yellow('You can run the script again to process the next batch.'));
        hasMoreCases = false;
        break;
      }
        
        if (batchEnd < chunkCases.length) {
          const delayTime = newRecordsInserted ? INSERT_DELAY_MS : CHECK_DELAY_MS;
          
          console.log(chalk.bold.yellow(
            `\n${newRecordsInserted ? 'Inserted new records' : 'Only checked existing records'}. ` +
            `Waiting ${delayTime/1000} seconds before next batch...`
          ));
          await delay(delayTime);
        }
      }
      
      if (!hasMoreCases) break;
      
      console.log(chalk.bold.magenta(`\nChunk ${chunkNumber} Completed:`));
      console.log(chalk.green(`✓ Successfully processed: ${chunkInsertedCount}`));
      console.log(chalk.yellow(`↻ Skipped (existing): ${chunkSkippedCount}`));
      console.log(chalk.red(`✗ Failed: ${chunkErrorCount}`));
      
      const remainingCases = await prisma.caseManagement.count({
        where: {
          judgmentUrl: { isEmpty: false }
        },
        skip: skip + CHUNK_SIZE
      });

      if (remainingCases > 0) {
        console.log(chalk.bold.yellow(`\n${remainingCases} cases remaining. Preparing next chunk...`));
        await delay(5000);
      }
      
      skip += CHUNK_SIZE;
      chunkNumber++;
    }

    // Generate final report
    const report = extractor.getReport();
    console.log(chalk.bold('\n=== Final Processing Report ==='));
    console.log(chalk.bold(`Total chunks processed: ${chunkNumber - 1}`));
    console.log(chalk.bold(`Total batches processed: ${report.summary.batchesProcessed}`));
    console.log(chalk.bold(`Unique cases processed: ${report.summary.uniqueCasesProcessed}`));
    console.log(chalk.bold(`Total PDFs attempted: ${report.summary.totalProcessed}`));
    console.log(chalk.green(`Successful PDFs extracted: ${report.summary.totalPdfsExtracted}`));
    console.log(chalk.green(`Total case IDs processed: ${report.summary.totalCaseIdsProcessed}`));
    console.log(chalk.red(`Failed: ${report.summary.failureCount}`));

    if (report.failed.length > 0) {
      console.log(chalk.bold.red('\n=== Failed PDFs Summary ==='));
      console.log(chalk.bold(`Total failed cases: ${report.failed.length}`));
      
      const failureReasons = report.failed.reduce((acc, fail) => {
        acc[fail.reason] = (acc[fail.reason] || 0) + 1;
        return acc;
      }, {});

      console.log(chalk.bold('\nFailure Reasons:'));
      for (const [reason, count] of Object.entries(failureReasons)) {
        console.log(`- ${reason}: ${count} cases`);
      }

      console.log(chalk.yellow('\nDetailed failure reports saved in the failure_reports directory'));
    }

    // Clean up state file if we processed everything
    if (!hasMoreCases) {
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
    }

    console.log(chalk.bold.green('\nProcessing complete!'));

  } catch (error) {
    console.error(chalk.bold.red('\nFatal error:'), error);
  } finally {
    await extractor.disconnect();
  }
}


main().catch(error => {
  console.error(chalk.bold.red('Unhandled error:'), error);
  process.exit(1);
});