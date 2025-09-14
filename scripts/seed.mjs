import { exec } from 'child_process';
import { createReadStream, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbName = 'bid-data';

const execWrangler = (command) => {
  return new Promise((resolve, reject) => {
    exec(`npx wrangler d1 execute ${dbName} --remote --command "${command}"`, { cwd: projectRoot, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
};

// New function to handle company inserts
const batchInsertCompanies = async (records) => {
    if (records.length === 0) return;
    const uniqueCompanies = [...new Map(records.map(r => [r[7], { name: r[6], number: r[7] }])).values()];
    const companiesToInsert = uniqueCompanies.filter(c => c.number); // Ensure corporate number exists

    if (companiesToInsert.length === 0) return;

    const columnsSql = `("法人番号", "商号又は名称")`;
    const valuesSql = companiesToInsert.map(
        c => `('${c.number}', '${String(c.name || '').replace(/'/g, "''")}')`
    ).join(',');

    const sql = `INSERT OR IGNORE INTO companies ${columnsSql} VALUES ${valuesSql};`;
    try {
        await execWrangler(sql);
    } catch (e) {
        console.error(`Failed to insert a batch into companies.`);
    }
};

// Modified function for bids
const batchInsertBids = async (records) => {
    if (records.length === 0) return;
    const columnsSql = `("調達案件番号", "調達案件名称", "落札決定日", "落札価格", "府省コード", "入札方式コード", "法人番号")`;
    const valuesSql = records.map(
        r => `('${r[0]}', '${String(r[1] || '').replace(/'/g, "''")}', '${r[2]}', ${parseFloat(r[3]) || 0}, '${r[4]}', '${r[5]}', '${r[7]}')`
    ).join(',');

    const sql = `INSERT OR IGNORE INTO bids ${columnsSql} VALUES ${valuesSql};`;
    try {
        await execWrangler(sql);
    } catch (e) {
        console.error(`Failed to insert a batch into bids.`);
    }
};


async function main() {
    console.log('Starting database seed (Normalized)...');
    console.log('Dropping old tables if they exist...');
    await execWrangler('DROP TABLE IF EXISTS bids;').catch(e => console.log("Could not drop bids."));
    await execWrangler('DROP TABLE IF EXISTS companies;').catch(e => console.log("Could not drop companies."));
    await execWrangler('DROP TABLE IF EXISTS ministries;').catch(e => console.log("Could not drop ministries."));
    await execWrangler('DROP TABLE IF EXISTS bid_methods;').catch(e => console.log("Could not drop bid_methods."));

    console.log('Creating new tables (Normalized)...');
    await execWrangler(`CREATE TABLE ministries ("コード" TEXT PRIMARY KEY, "名称" TEXT NOT NULL);`);
    await execWrangler(`CREATE TABLE bid_methods ("コード" TEXT PRIMARY KEY, "名称" TEXT NOT NULL);`);
    await execWrangler(`CREATE TABLE companies ("法人番号" TEXT PRIMARY KEY, "商号又は名称" TEXT);`);
    await execWrangler(`CREATE TABLE bids (
        "調達案件番号" TEXT PRIMARY KEY,
        "調達案件名称" TEXT,
        "落札決定日" TEXT,
        "落札価格" REAL,
        "府省コード" TEXT,
        "入札方式コード" TEXT,
        "法人番号" TEXT
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
            const columnsSql = '("コード", "名称")';
            const valuesSql = records.map(rec => `('${rec[0]}', '${rec[1].replace(/'/g, "''")}')`).join(',');
            const sql = `INSERT OR IGNORE INTO ${tableName} ${columnsSql} VALUES ${valuesSql};`;
            await execWrangler(sql);
        }
        console.log(`Seeded ${tableName} with ${records.length} records.`);
    };

    await processMappingFile(ministriesPath, 'ministries');
    await processMappingFile(bidMethodsPath, 'bid_methods');

    console.log('Seeding bids and companies tables for 2024 and 2025...');
    const dataDir = join(projectRoot, '..', 'successful-bid-data');
    const csvFiles = ['successful_bid_record_info_all_2024.csv', 'successful_bid_record_info_all_2025.csv'];

    for (const file of csvFiles) {
        console.log(`Processing ${file}...`);
        const filePath = join(dataDir, file);
        const parser = createReadStream(filePath, { encoding: 'utf8' }).pipe(parse({ from_line: 1, relax_column_count: true, bom: true }));
        let recordsBatch = [];
        const batchSize = 1000; // User requested chunk size

        for await (const record of parser) {
            if (record.length === 8 && record[0]) {
                recordsBatch.push(record);
            }
            if (recordsBatch.length >= batchSize) {
                await batchInsertCompanies(recordsBatch);
                await batchInsertBids(recordsBatch);
                recordsBatch = [];
            }
        }
        if (recordsBatch.length > 0) {
            await batchInsertCompanies(recordsBatch);
            await batchInsertBids(recordsBatch);
        }
        console.log(`Finished processing ${file}.`);
    }

    console.log('Database seeding for 2 years (Normalized) completed successfully!');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
