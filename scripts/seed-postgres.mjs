import { createReadStream, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;

// Load environment variables from .env file
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// --- Argument Parsing ---
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value === undefined ? true : value;
  return acc;
}, {});

const shouldInit = 'init' in args;
const targetFile = args.file;
const offset = parseInt(args.offset || '0', 10);

// --- Database Client Setup ---
const client = new Client({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// Helper function for batch inserting records using direct DB connection
const batchInsert = async (table, records, columns) => {
  if (records.length === 0) return;

  const values = [];
  const placeholders = [];
  
  for (const record of records) {
    const recordValues = columns.map(col => record[col]);
    values.push(...recordValues);
    placeholders.push(`(${columns.map((_, i) => `$${placeholders.length * columns.length + i + 1}`).join(', ')})`);
  }

  const query = `
    INSERT INTO public."${table}" ("${columns.join('", "')}") 
    VALUES ${placeholders.join(', ')}
    ON CONFLICT DO NOTHING
  `;

  // --- Improved Logging ---
  const querySummary = `INSERT INTO "${table}" (${records.length} records)`;
  console.log(`  [DB] Executing: ${querySummary}`);

  try {
    await client.query(query, values);
  } catch (e) {
    console.error(`\n--- FAILED to insert a batch into ${table}. ---`);
    console.error(`Query Summary: ${querySummary}`);
    console.error(`Total values to bind: ${values.length}`);
    console.error("Error Details:", e); // Complete the console.error call
    throw e;
  }
};

async function initializeDatabase() {
  console.log('Initializing database...');
  console.log('Seeding ministries and bid_methods tables...');
  
  const ministriesPath = join(projectRoot, '..', 'ministries_code.csv');
  const bidMethodsPath = join(projectRoot, '..', 'bid_method.csv');

  const processMappingFile = async (filePath, tableName) => {
    const records = [];
    const parser = createReadStream(filePath, { encoding: 'utf8' }).pipe(parse({ from_line: 2, relax_column_count: true, bom: true }));
    for await (const record of parser) {
      if (record[1] && record[2]) {
        records.push({ "コード": record[1], "名称": record[2] });
      }
    }
    if (records.length > 0) {
      await batchInsert(tableName, records, ["コード", "名称"]);
    }
    console.log(`Seeded ${tableName} with ${records.length} records.`);
  };

  await processMappingFile(ministriesPath, 'ministries');
  await processMappingFile(bidMethodsPath, 'bid_methods');
  console.log('Database initialization complete.');
}

async function seedData() {
  const dataDir = join(projectRoot, '..', 'successful-bid-data');
  const allCsvFiles = [
    'successful_bid_record_info_all_2013.csv',
    'successful_bid_record_info_all_2014.csv',
    'successful_bid_record_info_all_2015.csv',
    'successful_bid_record_info_all_2016.csv',
    'successful_bid_record_info_all_2017.csv',
    'successful_bid_record_info_all_2018.csv',
    'successful_bid_record_info_all_2019.csv',
    'successful_bid_record_info_all_2020.csv',
    'successful_bid_record_info_all_2021.csv',
    'successful_bid_record_info_all_2022.csv',
    'successful_bid_record_info_all_2023.csv',
    'successful_bid_record_info_all_2024.csv',
    'successful_bid_record_info_all_2025.csv'
  ];
  const filesToProcess = targetFile ? [targetFile] : allCsvFiles;

  console.log(`Starting data seed. Processing: ${filesToProcess.join(', ')}`);

  for (const file of filesToProcess) {
    const filePath = join(dataDir, file);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found at ${filePath}`);
      continue;
    }

    console.log(`Processing ${file} from line ${offset + 1}...`);
    const parser = createReadStream(filePath, { encoding: 'utf8' }).pipe(parse({ from_line: offset + 1, relax_column_count: true, bom: true }));
    
    let companyBatch = [];
    let bidBatch = [];
    const batchSize = 7000; // Increased batch size for better performance with direct DB connection
    let processedCount = 0;

    for await (const record of parser) {
      if (record.length >= 8 && record[0] && record[7]) {
        companyBatch.push({ "法人番号": record[7], "商号又は名称": record[6] || '' });
        const price = parseInt(record[3], 10);
        bidBatch.push({
          "調達案件番号": record[0],
          "調達案件名称": record[1] || '',
          "落札決定日": record[2] || null,
          "落札価格": isNaN(price) ? 0 : price,
          "府省コード": record[4],
          "入札方式コード": record[5],
          "法人番号": record[7]
        });
      }

      if (companyBatch.length >= batchSize) {
        await batchInsert('companies', companyBatch, ["法人番号", "商号又は名称"]);
        await batchInsert('bids', bidBatch, ["調達案件番号", "調達案件名称", "落札決定日", "落札価格", "府省コード", "入札方式コード", "法人番号"]);
        processedCount += companyBatch.length;
        console.log(`  ... processed ${processedCount + offset} lines from ${file}`);
        companyBatch = [];
        bidBatch = [];
      }
    }
    if (companyBatch.length > 0) {
      await batchInsert('companies', companyBatch, ["法人番号", "商号又は名称"]);
      await batchInsert('bids', bidBatch, ["調達案件番号", "調達案件名称", "落札決定日", "落札価格", "府省コード", "入札方式コード", "法人番号"]);
      processedCount += companyBatch.length;
    }
    console.log(`Finished processing ${file}. Total lines processed from this file: ${processedCount}`);
  }
  console.log('Data seeding complete!');
}

async function main() {
  try {
    await client.connect();
    console.log("✅ Successfully connected to PostgreSQL.");

    if (shouldInit) {
      console.warn("WARNING: This script assumes the schema is already created by schema.sql.");
      console.warn("It will seed the initial mapping tables.");
      await initializeDatabase();
    }
    await seedData();
  } catch (e) {
    console.error("An error occurred during the seeding process:", e);
    process.exit(1);
  } finally {
    await client.end();
    console.log("PostgreSQL connection closed.");
  }
}

main();
