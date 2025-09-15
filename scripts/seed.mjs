import { exec } from 'child_process';
import { createReadStream, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbName = 'bid-data';

// --- Argument Parsing ---
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value === undefined ? true : value;
  return acc;
}, {});

const isLocal = 'local' in args;
const shouldInit = 'init' in args;
const targetFile = args.file;
const offset = parseInt(args.offset || '0', 10);

const execWrangler = (command) => {
  const remoteFlag = isLocal ? '' : '--remote';
  const envVars = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN} CLOUDFLARE_ACCOUNT_ID=${process.env.CLOUDFLARE_ACCOUNT_ID}`;
  const commandString = `${envVars} npx wrangler d1 execute ${dbName} ${remoteFlag} --config wrangler.toml --command "${command}"`;
  
  return new Promise((resolve, reject) => {
    exec(commandString, { cwd: projectRoot, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
};

const batchInsertCompanies = async (records) => {
    if (records.length === 0) return;
    const uniqueCompanies = [...new Map(records.map(r => [r[7], { name: r[6], number: r[7] }])).values()];
    const companiesToInsert = uniqueCompanies.filter(c => c.number);

    if (companiesToInsert.length === 0) return;

    const columnsSql = `("法人番号", "商号又は名称")`;
    const valuesSql = companiesToInsert.map(
        c => `('${c.number}', '${String(c.name || '').replace(/'/g, "''")}')`
    ).join(',');

    const sql = `INSERT OR IGNORE INTO companies ${columnsSql} VALUES ${valuesSql};`;
    try {
        await execWrangler(sql);
    } catch (e) {
        console.error(`Failed to insert a batch into companies.`, e);
    }
};

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
        console.error(`Failed to insert a batch into bids.`, e);
    }
};

async function initializeDatabase() {
    console.log('Initializing database...');
    console.log('Dropping old tables if they exist...');
    await execWrangler('DROP TABLE IF EXISTS bids;').catch(e => console.log("Could not drop bids."));
    await execWrangler('DROP TABLE IF EXISTS companies;').catch(e => console.log("Could not drop companies."));
    await execWrangler('DROP TABLE IF EXISTS ministries;').catch(e => console.log("Could not drop ministries."));
    await execWrangler('DROP TABLE IF EXISTS bid_methods;').catch(e => console.log("Could not drop bid_methods."));

    console.log('Creating new tables...');
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
    console.log('Database initialization complete.');
}

async function seedData() {
    const dataDir = join(projectRoot, '..', 'successful-bid-data');
    const allCsvFiles = ['successful_bid_record_info_all_2024.csv', 'successful_bid_record_info_all_2025.csv'];
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
        
        let recordsBatch = [];
        const batchSize = 100;
        let processedCount = 0;

        for await (const record of parser) {
            if (record.length === 8 && record[0]) {
                recordsBatch.push(record);
            }
            if (recordsBatch.length >= batchSize) {
                await batchInsertCompanies(recordsBatch);
                await batchInsertBids(recordsBatch);
                processedCount += recordsBatch.length;
                console.log(`  ... processed ${processedCount + offset} lines from ${file}`);
                recordsBatch = [];
            }
        }
        if (recordsBatch.length > 0) {
            await batchInsertCompanies(recordsBatch);
            await batchInsertBids(recordsBatch);
            processedCount += recordsBatch.length;
        }
        console.log(`Finished processing ${file}. Total lines processed from this file: ${processedCount}`);
    }
    console.log('Data seeding complete!');
}

async function main() {
    if (shouldInit) {
        await initializeDatabase();
    } else if (targetFile || offset > 0) {
        await seedData();
    } else {
        // Default behavior: if no flags, assume user wants to seed all data without re-initializing.
        // This is a safeguard. For large datasets, users should use flags.
        console.log("No specific file or offset provided. Seeding all default files.");
        await seedData();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
