# 入札サーチ.jp

## 概要

**入札サーチ.jp**は、全国の官公庁から公開される公共調達の入札・落札情報を、誰でも無料で横断検索できるWebアプリケーションです。
これまで各所に点在していた情報を一つに集約し、キーワード、府省、期間などで簡単に絞り込み検索を行えるようにすることで、ビジネスチャンスの発見をサポートします。

本アプリケーションは、[調達ポータル](https://www.p-portal.go.jp/)のオープンデータを活用しています。

## 主な機能

- **キーワード検索**: 案件名と事業者名を対象にした、複数キーワードでのAND検索
- **絞り込み機能**: 府省、落札決定日で期間を指定しての絞り込み
- **レスポンシブデザイン**: PC、スマートフォン、タブレットなど、様々なデバイスで快適に利用可能

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **デプロイ環境**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **データベース**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **アダプター**: [OpenNext](https://opennext.js.org/)

---

## 利用開始までの手順

### 1. 前提条件

- [Node.js](https://nodejs.org/) (v18.17.0 以上)
- [npm](https://www.npmjs.com/)

### 2. セットアップ

1.  **リポジトリをクローン**
    ```bash
    git clone <repository-url>
    cd nyusatsu-search-jp
    ```

2.  **依存関係をインストール**
    ```bash
    npm install
    ```

3.  **.envファイルの作成**
    プロジェクトのルートディレクトリに`.env`ファイルを作成し、Cloudflareの認証情報を記述します。このファイルは`.gitignore`に含まれており、Gitリポジトリにはコミットされません。

    ```env
    CLOUDFLARE_API_TOKEN="<あなたのCloudflare APIトークン>"
    CLOUDFLARE_ACCOUNT_ID="<あなたのCloudflare アカウントID>"
    ```

---

## データベースのセットアップとデータ投入

本アプリケーションは、Cloudflare D1データベースを使用します。データ投入（シード）スクリプトは、D1の書き込み制限（無料枠では1日10万行）に対応するため、複数日に分けて実行できるようになっています。

### 1. 初回のみ：データベースの初期化

最初に、データベースのテーブルをすべて作成します。
**注意:** このコマンドは既存のデータをすべて削除します。

```bash
# ローカル環境の場合
npm run db:seed -- --init --local

# 本番環境の場合
npm run db:seed -- --init
```

### 2. データの投入

`--file`オプションで、処理するCSVファイルを指定します。1日の上限に達したら、翌日以降に別のファイルで再開してください。

```bash
# 例：2024年のデータをローカルDBに投入
npm run db:seed -- --local --file=successful_bid_record_info_all_2024.csv

# 例：翌日、2025年のデータを本番DBに投入
npm run db:seed -- --file=successful_bid_record_info_all_2025.csv
```

### 3. 投入の中断と再開

1つのファイルが巨大な場合、`--offset`オプションで行数を指定して、処理を中断・再開できます。

```bash
# 例：巨大なファイルの50001行目から処理を再開
npm run db:seed -- --local --file=huge_data.csv --offset=50000
```

---

## コマンド一覧

| コマンド | 説明 |
|:---|:---|
| `npm run dev` | Next.jsの開発サーバーを起動します (http://localhost:3000) |
| `npm run build` | 本番用のアプリケーションをビルドします |
| `npm run preview` | 本番ビルドをローカルでプレビューします。ローカルのD1データベースに接続します |
| `npm run deploy` | アプリケーションをCloudflare Workersにデプロイします |
| `npm run start` | Next.jsのプロダクションサーバーを起動します（本プロジェクトでは通常`preview`を使用） |
| `npm run lint` | ESLintによるコードの静的解析を実行します |
| `npm run db:seed` | データベースにデータを投入（シード）します。詳細は上記セクションを参照 |

---

## デプロイ

1.  **認証情報の設定**
    `.env`ファイルに本番環境用のCloudflare認証情報が正しく設定されていることを確認します。

2.  **本番DBへのデータ投入**
    上記の「データベースのセットアップとデータ投入」セクションを参考に、本番環境のD1データベースにデータを投入します。

3.  **デプロイの実行**
    ```bash
    npm run deploy
    ```

4.  **D1データベースのバインド（初回のみ）**
    デプロイ後、アプリケーションからデータベースに接続できない場合は、Cloudflareダッシュボードで手動のバインディングが必要です。
    1. Cloudflareダッシュボードにログイン
    2. [Workers & Pages] > 対象のWorkerを選択
    3. [Settings] > [Variables] > [D1 Database Bindings]
    4. [Add binding] をクリック
    5. **Variable name:** `DB`
    6. **D1 database:** `bid-data` を選択
    7. [Save] をクリック