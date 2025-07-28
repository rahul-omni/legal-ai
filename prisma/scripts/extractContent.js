
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


// Visual indicators
const SUCCESS = chalk.green('✅');
const FAILURE = chalk.red('❌');
const WARNING = chalk.yellow('⚠️');

class PDFExtractor {
  constructor() {
    this.successfulProcesses = [];
    this.failedProcesses = [];
    this.processedUrls = new Set();
    this.processedCaseIds = new Set();
    this.batchCounter = 0;
    this.totalPdfsExtracted = 0; // Counter for successfully extracted PDFs
    this.totalCaseIdsProcessed = 0; // Counter for processed case IDs
    this.resumeFrom = 0; // Add this to track where to resume from
     this.newCaseIdsProcessed = 0; // Track only newly processed cases
  
  }

 
  async extractPdf(caseId, pdfUrl) {
    try {
      // Skip if case ID already processed in this run
      if (this.processedCaseIds.has(caseId)) {
        const message = `${WARNING} Case already processed in this batch (ID: ${caseId})`;
        this.failedProcesses.push({ caseId, pdfUrl, reason: 'Duplicate case ID in batch', message });
        console.log(message);
        return { success: false, caseId };
      }

      // Skip if URL already processed in this run
      if (this.processedUrls.has(pdfUrl)) {
        const message = `${WARNING} PDF already processed in this batch (URL: ${pdfUrl}) for case ${caseId}`;
        this.failedProcesses.push({ caseId, pdfUrl, reason: 'Duplicate URL in batch', message });
        console.log(message);
        return { success: false, caseId };
      }

      // Check if case ID exists in database in extractedJudgments table
      const existingJudgment = await prisma.extractedJudgments.findFirst({
        where: { 
          caseId: caseId
        }
      });

      if (existingJudgment) {
        const message = `${WARNING} Case ${caseId} already exists in extractedJudgments table - skipping`;
        this.failedProcesses.push({ caseId, pdfUrl, reason: 'Case already exists in extractedJudgments', message });
        console.log(message);
        return { success: false, caseId };
      }

      // Check if URL exists in database (additional check)
      const existingUrl = await prisma.extractedJudgments.findFirst({
        where: { 
          judgmentUrl: pdfUrl
        }
      });

      if (existingUrl) {
        const message = `${WARNING} PDF URL already exists in database (URL: ${pdfUrl})`;
        this.failedProcesses.push({ caseId, pdfUrl, reason: 'URL already exists in extractedJudgments', message });
        console.log(message);
        return { success: false, caseId };
      }

      console.log(chalk.blue(`[${caseId}] Downloading PDF from: ${pdfUrl}`));
      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Empty PDF file received');
      }

      const data = await pdf(response.data, {
        max: 1024 * 1024 * 50,
        pagerender: pageRenderer
      }).catch(err => {
        throw new Error(`PDF parse error: ${err.message}`);
      });

      const extractedText = data.text.trim();
      
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
          isSynced: false
        }
      });

      // Mark as processed
      this.processedUrls.add(pdfUrl);
      this.processedCaseIds.add(caseId);
      this.totalPdfsExtracted++; // Increment successful PDF extraction counter
      this.totalCaseIdsProcessed++; // Increment processed case ID counter
      this.newCaseIdsProcessed++; // Increment newly processed case ID counter

      const successMessage = `${SUCCESS} [${this.totalPdfsExtracted}] Successfully processed PDF for case ${caseId} (${extractedText.length} chars)`;
      this.successfulProcesses.push({ caseId, pdfUrl, message: successMessage });
      console.log(successMessage);

      return { success: true, caseId };

    } catch (error) {
      const errorMessage = `${FAILURE} Error processing case ${caseId} (URL: ${pdfUrl}): ${error.message}`;
      this.failedProcesses.push({ caseId, pdfUrl, reason: 'Processing error', message: errorMessage });
      console.error(errorMessage);
      
      if (error.message.includes('PDF parse error')) {
        console.log(chalk.yellow('  ↳ This PDF might be corrupted or have an unusual structure'));
      }
      return { success: false, caseId, error: error.message };
    }
  }

  async processBatch(cases) {
    this.batchCounter++;
    console.log(chalk.bold(`\nStarting Batch ${this.batchCounter} with ${cases.length} cases`));
    
    const batchStartTime = Date.now();
    const results = [];
    let newRecordsInserted = false;
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // First, get all case IDs that already exist in extractedJudgments
    const existingCaseIds = await prisma.extractedJudgments.findMany({
      where: {
        caseId: {
          in: cases.map(c => c.id)
        }
      },
      select: {
        caseId: true
      }
    });

    const existingIdsSet = new Set(existingCaseIds.map(item => item.caseId));

    for (let i = 0; i < cases.length; i++) {
      const caseRecord = cases[i];
      const counter = i + 1;
      
      // Check if we've reached the maximum number of case IDs to process
      if (this.newCaseIdsProcessed >=  RECORDS_PER_SESSION) {
        console.log(chalk.bold.yellow(`\nReached maximum of ${RECORDS_PER_SESSION} case IDs to process. Stopping...`));
        return {
          results: results.filter(Boolean),
          newRecordsInserted,
          stats: {
            inserted: insertedCount,
            skipped: skippedCount,
            errors: errorCount
          },
          reachedLimit: true
        };
      }

      // Skip if case already exists in extractedJudgments
      if (existingIdsSet.has(caseRecord.id)) {
        const message = `${counter}. ${WARNING} Case ${caseRecord.id} already exists in extractedJudgments - skipping`;
        this.failedProcesses.push({ 
          caseId: caseRecord.id, 
          pdfUrl: caseRecord.judgmentUrl?.[0] || 'N/A', 
          reason: 'Case already exists in extractedJudgments', 
          message 
        });
        console.log(message);
        skippedCount++;
        continue;
      }

      if (caseRecord.judgmentUrl?.length) {
        const firstPdfUrl = caseRecord.judgmentUrl[0];
        if (!this.processedUrls.has(firstPdfUrl)) {
          try {
            const result = await this.extractPdf(caseRecord.id, firstPdfUrl);
            if (result) {
              results.push(result);
              if (result.success) {
                newRecordsInserted = true;
                insertedCount++;
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
              message: errorMessage
            });
            console.error(errorMessage);
          }
        }
      }
    }
    
    const batchEndTime = Date.now();
    const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(2);
    
    console.log(chalk.bold(`\nBatch ${this.batchCounter} completed in ${batchDuration} seconds`));
    console.log(chalk.bold.green(`Successfully inserted: ${insertedCount} cases`));
    console.log(chalk.bold.yellow(`Skipped (existing): ${skippedCount} cases`));
    console.log(chalk.bold.red(`Failed to process: ${errorCount} cases`));
    console.log(chalk.bold.blue(`Total PDFs extracted so far: ${this.totalPdfsExtracted}`));
    console.log(chalk.bold.blue(`Total case IDs processed so far: ${this.totalCaseIdsProcessed}`));
    
    this.printBatchSummary(results.filter(Boolean));
    
    return { 
      results: results.filter(Boolean), 
      newRecordsInserted,
      stats: {
        inserted: insertedCount,
        skipped: skippedCount,
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
  console.log(chalk.bold.cyan('\nStarting PDF extraction process...\n'));
  
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
      console.log(chalk.bold.yellow(`\nResuming from record ${extractor.resumeFrom}...`));
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
          judgmentUrl: { isEmpty: false }
        },
        skip: skip,
        take: CHUNK_SIZE,
        select: {
          id: true,
          judgmentUrl: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (chunkCases.length === 0) {
        hasMoreCases = false;
        console.log(chalk.bold('\nNo more cases to process.'));
        break;
      }

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
        // Check if we've processed enough records for this session
        // if (extractor.totalCaseIdsProcessed >= extractor.resumeFrom + RECORDS_PER_SESSION) {
        //   console.log(chalk.bold.green(`\nCompleted ${RECORDS_PER_SESSION} records in this session.`));
        //   console.log(chalk.bold.yellow('You can run the script again to process the next batch.'));
        //   hasMoreCases = false;
        //   break;
        // }
        
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