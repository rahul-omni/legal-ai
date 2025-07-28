
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

const prisma = new PrismaClient();

async function processJsonFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const casesArray = JSON.parse(data);

    if (!Array.isArray(casesArray)) throw new Error('JSON data is not an array');
    console.log(`Found ${casesArray.length} cases in JSON file to process.`);

    return casesArray.map(caseData => {
      if (!caseData["Bench"]) {
        console.warn('⚠️ Missing bench for case:', caseData["Case Number"] || 'Unknown Case');
      }

      return {
        serialNumber: caseData["Serial Number"] || '',
        diaryNumber: caseData["Diary Number"] || '',
        caseNumber: caseData["Case Number"] || '',
        parties: caseData["Petitioner / Respondent"] || '',
        advocates: caseData["Petitioner/Respondent Advocate"] || '',
        bench: caseData["Bench"] || 'UNSPECIFIED BENCH',
        judgmentBy: caseData["Judgment By"] || '',
        judgmentDate: caseData["Judgment"]?.split(" ")[0] || '',
        judgmentText: caseData["Judgment"]?.split(" ")[1] || '',
        judgmentUrl: caseData.judgmentLinks?.[0]?.url || '',
        court: "Supreme Court"
      };
    });
  } catch (error) {
    console.error('❌ Error processing JSON file:', error);
    throw error;
  }
}

async function processCsvFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`Found ${results.length} cases in CSV file to process.`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('❌ Error processing CSV file:', error);
        reject(error);
      });
  });
}

async function transformCsvData(csvData: any[]) {
  return csvData.map((caseData, index) => {
    // Transform diary number format from 8899-2008 to 8899/2008
    const diaryNumber = caseData.diary_no 
      ? caseData.diary_no.replace(/-/g, '/') 
      : '';

    // Split parties if they are combined in pet/res format
    let parties = caseData.pet;
    if (caseData.res) {
      parties += " / " + caseData.res;
    }

    // Combine advocates if they are separate
    let advocates = caseData.pet_adv;
    if (caseData.res_adv) {
      advocates += " / " + caseData.res_adv;
    }
    
    // Prepend base URL to judgment link if it exists
    const judgmentUrl = caseData.temp_link 
      ? `https://api.sci.gov.in/${caseData.temp_link}`
      : '';


    return {
      serialNumber: '', // Empty string as default since CSV doesn't have this field
      diaryNumber: diaryNumber,
      caseNumber: caseData.case_no || '',
      parties: parties || '',
      advocates: advocates || '',
      bench: caseData.bench || 'UNSPECIFIED BENCH',
      judgmentBy: caseData.judgment_by || '',
      judgmentDate: caseData.judgment_dates || '',
      judgmentText: caseData.Judgment_type || '',
      judgmentUrl: judgmentUrl,
      court: "Supreme Court",
     // language: caseData.language || 'English'
    };
  });
}

async function bulkInsertCases() {
  try {
    // Process JSON file
    const jsonCases = await processJsonFile('D:/ziplegfalcode/legal-ai/legal-ai/prisma/scripts/case.json');
    
    // Process CSV file
    const csvData = await processCsvFile('D:/ziplegfalcode/legal-ai/legal-ai/prisma/scripts/judgments.csv');
    const csvCases = await transformCsvData(csvData);

    // Combine both datasets
    const allCases = [...jsonCases, ...csvCases];
    console.log(`Total cases to insert: ${allCases.length}`);

    // Insert all cases
    const result = await prisma.$transaction([
      prisma.caseManagement.createMany({
        data: allCases,
        skipDuplicates: true,
      }),
      prisma.caseManagement.count()
    ]);

    console.log(`✅ Inserted ${result[0].count} cases. Total in DB: ${result[1]}`);

  } catch (error) {
    console.error('❌ Error in bulk insert:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bulkInsertCases();