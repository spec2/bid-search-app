import { createReadStream, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const postgrestUrl = 'http://localhost:3001';

// --- Argument Parsing ---
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value === undefined ? true : value;
  return acc;
}, {});

const shouldInit = 'init' in args;
const targetFile = args.file;
const offset = parseInt(args.offset || '0', 10);

const postgrestFetch = async (path, options = {}) => {
  const response = await fetch(`${postgrestUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`PostgREST request to ${path} failed: ${response.status} ${response.statusText}\n${responseText}`);
  }

  if (!responseText.trim()) {
    // If the response body is empty or just whitespace, return null.
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse JSON response:", responseText);
    throw e; // Re-throw the parsing error
  }
};

const batchInsert = async (table, records) => {
    if (records.length === 0) return;
    try {
        await postgrestFetch(`/${table}`, {
            method: 'POST',
            body: JSON.stringify(records),
            headers: {
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal,resolution=ignore-duplicates'
            }
        });
    } catch (e) {
        console.error(`Failed to insert a batch into ${table}.`, e);
        throw e;
    }
};

async function initializeDatabase() {
    console.log('Initializing database...');
    console.log('Skipping table creation/deletion. Assuming schema is correct.');
    console.log('A clean database is required for the first run.');

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
            await batchInsert(tableName, records);
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
        'successful_bid_record_info_all_2024.csv', 'successful_bid_record_info_all_2025.csv'
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
        const batchSize = 100;
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
                await batchInsert('companies', companyBatch);
                await batchInsert('bids', bidBatch);
                processedCount += companyBatch.length;
                console.log(`  ... processed ${processedCount + offset} lines from ${file}`);
                companyBatch = [];
                bidBatch = [];
            }
        }
        if (companyBatch.length > 0) {
            await batchInsert('companies', companyBatch);
            await batchInsert('bids', bidBatch);
            processedCount += companyBatch.length;
        }
        console.log(`Finished processing ${file}. Total lines processed from this file: ${processedCount}`);
    }
    console.log('Data seeding complete!');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForPostgREST() {
    let attempts = 10;
    while (attempts > 0) {
        try {
            await fetch(postgrestUrl);
            console.log("✅ PostgREST is ready.");
            return;
        } catch (e) {
            console.log(`⏳ Waiting for PostgREST to be ready... (${attempts} attempts left)`);
            attempts--;
            await sleep(3000); // Wait 3 seconds
        }
    }
    throw new Error("PostgREST did not become ready in time.");
}

async function main() {
    await waitForPostgREST();

    if (shouldInit) {
        console.warn("WARNING: Table creation/deletion via PostgREST is not supported by this script.");
        console.warn("Please ensure the database is clean and tables are created before the first run.");
        await initializeDatabase();
    }
    await seedData();
}

main().catch(e => {
    console.error("An error occurred during the seeding process:", e);
    process.exit(1);
});