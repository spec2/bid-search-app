import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// .envファイルから秘密鍵を読み込む
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const secretLine = envFile.split('\n').find(line => line.startsWith('PGRST_JWT_SECRET='));

if (!secretLine) {
  console.error('エラー: .envファイルにPGRST_JWT_SECRETが見つかりません。');
  process.exit(1);
}

const secret = secretLine.split('=')[1].trim();

// PostgRESTが期待するペイロード
const payload = {
  role: 'api_user' 
};

// 署名アルゴリズムを指定してJWTを生成
const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

console.log('生成されたJWT:');
console.log(token);
