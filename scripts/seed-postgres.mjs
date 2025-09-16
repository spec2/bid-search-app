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

const allCsvFiles = [
    'successful_bid_record_info_all_2013.csv', 'successful_bid_record_info_all_2014.csv',
    'successful_bid_record_info_all_2015.csv', 'successful_bid_record_info_all_2016.csv',
    'successful_bid_record_info_all_2017.csv', 'successful_bid_record_info_all_2018.csv',
    'successful_bid_record_info_all_2019.csv', 'successful_bid_record_info_all_2020.csv',
    'successful_bid_record_info_all_2021.csv', 'successful_bid_record_info_all_2022.csv',
    'successful_bid_record_info_all_2023.csv', 'successful_bid_record_info_all_2024.csv',
    'successful_bid_record_info_all_2025.csv'
];

const getDbClient = async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'postgres', // Assuming default database, change if needed
  });
  await client.connect();
  return client;
};

const batchInsert = async (client, table, columns, records) => {
    if (records.length === 0) return;

    const valuesPlaceholder = records.map((_, rowIndex) => {
        const placeholders = columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`);
        return `(${placeholders.join(',')})`;
    }).join(',');

    const flatRecords = records.flat();
    const conflictTarget = columns[0]; // Assuming the first column is the primary key

    const sql = `
        INSERT INTO ${table} (${columns.join(', ')}) 
        VALUES ${valuesPlaceholder} 
        ON CONFLICT (${conflictTarget}) DO NOTHING;
    `;

    try {
        await client.query(sql, flatRecords);
    } catch (e) {
        console.error(`Failed to insert a batch into ${table}.`, e);
        // Optionally, you can try inserting one by one to debug
    }
};


async function initializeDatabase(client) {
    console.log('Initializing database...');
    console.log('Dropping old tables if they exist...');
    await client.query('DROP TABLE IF EXISTS bids;').catch(e => console.log("Could not drop bids."));
    await client.query('DROP TABLE IF EXISTS companies;').catch(e => console.log("Could not drop companies."));
    await client.query('DROP TABLE IF EXISTS ministries;').catch(e => console.log("Could not drop ministries."));
    await client.query('DROP TABLE IF EXISTS bid_methods;').catch(e => console.log("Could not drop bid_methods."));

    console.log('Creating new tables...');
    await client.query(`CREATE TABLE ministries ("コード" VARCHAR(10) PRIMARY KEY, "名称" VARCHAR(255) NOT NULL);`);
    await client.query(`CREATE TABLE bid_methods ("コード" VARCHAR(20) PRIMARY KEY, "名称" VARCHAR(255) NOT NULL);`);
    await client.query(`CREATE TABLE companies ("法人番号" VARCHAR(20) PRIMARY KEY, "商号又は名称" TEXT);`);
    await client.query(`CREATE TABLE bids (
        "調達案件番号" VARCHAR(50) PRIMARY KEY,
        "調達案件名称" TEXT,
        "落札決定日" DATE,
        "落札価格" BIGINT,
        "府省コード" VARCHAR(10) REFERENCES ministries("コード"),
        "入札方式コード" VARCHAR(20) REFERENCES bid_methods("コード"),
        "法人番号" VARCHAR(20) REFERENCES companies("法人番号")
    );`);
    console.log('Tables created successfully.');

    console.log('Seeding ministries and bid_methods tables...');
    const ministriesPath = join(projectRoot, '..', 'ministries_code.csv');
    const bidMethodsPath = join(projectRoot, '..', 'bid_method.csv');

    const processMappingFile = async (filePath, tableName) => {
        const records = [];
        const parser = createReadStream(filePath, { encoding: 'utf8' }).pipe(parse({ from_line: 2, relax_column_count: true, bom: true }));
        for await (const record of parser) {
            if (record[1] && record[2]) {
                records.push([record[1], record[2]]);
            }
        }
        if (records.length > 0) {
            await batchInsert(client, `"${tableName}"`, ['"コード"', '"名称"'], records);
        }
        console.log(`Seeded ${tableName} with ${records.length} records.`);
    };

    await processMappingFile(ministriesPath, 'ministries');
    await processMappingFile(bidMethodsPath, 'bid_methods');
    console.log('Database initialization complete.');
}

async function seedData(client) {
    const dataDir = join(projectRoot, '..', 'successful-bid-data');
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
        const batchSize = 7000;
        let processedCount = 0;

        for await (const record of parser) {
            if (record.length >= 8 && record[0] && record[7]) { // Ensure corporate number exists
                // Company: [法人番号, 商号又は名称]
                companyBatch.push([record[7], record[6] || '']);
                
                // Bid: [調達案件番号, 調達案件名称, 落札決定日, 落札価格, 府省コード, 入札方式コード, 法人番号]
                const price = parseInt(record[3], 10);
                bidBatch.push([
                    record[0],
                    record[1] || '',
                    record[2] || null, // Handle empty date
                    isNaN(price) ? 0 : price,
                    record[4],
                    record[5],
                    record[7]
                ]);
            }

            if (companyBatch.length >= batchSize) {
                await batchInsert(client, 'companies', ['"法人番号"', '"商号又は名称"'], companyBatch);
                await batchInsert(client, 'bids', ['"調達案件番号"', '"調達案件名称"', '"落札決定日"', '"落札価格"', '"府省コード"', '"入札方式コード"', '"法人番号"'], bidBatch);
                processedCount += companyBatch.length;
                console.log(`  ... processed ${processedCount + offset} lines from ${file}`);
                companyBatch = [];
                bidBatch = [];
            }
        }
        if (companyBatch.length > 0) {
            await batchInsert(client, 'companies', ['"法人番号"', '"商号又は名称"'], companyBatch);
            await batchInsert(client, 'bids', ['"調達案件番号"', '"調達案件名称"', '"落札決定日"', '"落札価格"', '"府省コード"', '"入札方式コード"', '"法人番号"'], bidBatch);
            processedCount += companyBatch.length;
        }
        console.log(`Finished processing ${file}. Total lines processed from this file: ${processedCount}`);
    }
    console.log('Data seeding complete!');
}

async function main() {
    const client = await getDbClient();
    try {
        if (shouldInit) {
            await initializeDatabase(client);
        }
        // Always run seedData after init, or run it standalone
        if (!shouldInit || (shouldInit && (targetFile || allCsvFiles.length > 0))) {
             await seedData(client);
        }
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
