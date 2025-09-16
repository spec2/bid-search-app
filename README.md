# 入札サーチ.jp

## 概要

**入札サーチ.jp**は、全国の官公庁から公開される公共調達の入札・落札情報を、誰でも無料で横断検索できるWebアプリケーションです。
これまで各所に点在していた情報を一つに集約し、キーワード、府省、期間などで簡単に絞り込み検索を行えるようにすることで、ビジネスチャンスの発見をサポートします。

本アプリケーションは、[政府調達ポータル](https://www.p-portal.go.jp/)のオープンデータを活用しています。

## 主な機能

- **キーワード検索**: 案件名でのフリーワード検索
- **絞り込み機能**: 事業者名、府省、落札決定日で期間を指定しての絞り込み
- **ページネーション**: 検索結果を50件ごとに表示
- **レスポンシブデザイン**: PC、スマートフォン、タブレットなど、様々なデバイスで快適に利用可能

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **データベース**: [PostgreSQL](https://www.postgresql.org/)
- **API**: [PostgREST](https://postgrest.org/) (PostgreSQLからRESTful APIを自動生成)
- **開発環境**: [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)
- **デプロイ環境**: [Vercel](https://vercel.com/)

---

## ローカル開発環境のセットアップ

### 1. 前提条件

- [Node.js](https://nodejs.org/) (v18.17.0 以上)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. セットアップ手順

1.  **リポジトリをクローン**
    ```bash
    git clone <repository-url>
    cd bid-search-app
    ```

2.  **依存関係をインストール**
    ```bash
    npm install
    ```

3.  **.env ファイルの作成**
    プロジェクトのルートにある `.env.local.example` をコピーして `.env` ファイルを作成します。中身はローカル開発用に設定済みなので、変更は不要です。
    ```bash
    cp .env.local.example .env
    ```

4.  **Dockerコンテナの起動**
    以下のコマンドで、PostgreSQLとPostgRESTのコンテナをバックグラウンドで起動します。
    ```bash
    docker-compose up -d
    ```

5.  **データベースの初期化とデータ投入**
    初回のみ、以下のコマンドでテーブルを作成し、CSVデータをデータベースに投入します。
    ```bash
    npm run db:pg:init
    ```
    データ量に応じて数分かかることがあります。

6.  **開発サーバーの起動**
    ```bash
    npm run dev
    ```
    ブラウザで `http://localhost:3000` にアクセスすると、アプリケーションが表示されます。

---

## 環境変数

| 変数名 | 説明 | 設定ファイル |
|:---|:---|:---|
| `POSTGRES_USER` | PostgreSQLのユーザー名。 | `.env` |
| `POSTGRES_PASSWORD` | PostgreSQLのパスワード。 | `.env` |
| `API_URL` | **[Vercelデプロイ時のみ]** 本番環境のPostgREST APIのエンドポイントURL。 | Vercelの環境変数設定 |

---

## コマンド一覧

| コマンド | 説明 |
|:---|:---|
| `npm run dev` | Next.jsの開発サーバーを起動します (http://localhost:3000)。 |
| `npm run build` | 本番用のアプリケーションをビルドします。 |
| `npm run start` | 本番ビルドをローカルで起動します。 |
| `npm run lint` | ESLintによるコードの静的解析を実行します。 |
| `docker-compose up -d` | 開発用のDBとAPIコンテナをバックグラウンドで起動します。 |
| `docker-compose down` | 開発用のコンテナを停止・削除します。 |
| `npm run db:pg:init` | DBのテーブルを初期化し、CSVデータを投入します。 |
| `npm run db:pg:seed` | DBのテーブルを削除せずに、CSVデータのみを投入します。 |

---

## デプロイ

本アプリケーションはVercelへのデプロイを想定しています。

### 1. PostgREST APIの準備

PostgreSQLとPostgRESTを任意のサーバーにデプロイし、公開URL (`https://...`) を用意します。
（例: `docker-compose.yml` の `cloudflared` サービスを利用してCloudflare Tunnelで公開する、など）

### 2. Vercelプロジェクトのセットアップ

1.  **Vercel CLIでログイン**
    ```bash
    vercel login
    ```

2.  **プロジェクトのリンク**
    ```bash
    vercel link
    ```
    対話形式の質問に答えて、ローカルリポジトリとVercel上のプロジェクトを紐付けます。

3.  **環境変数の設定**
    Vercelのダッシュボード、または以下のコマンドで本番用のAPIのURLを設定します。
    ```bash
    vercel env add API_URL <あなたのPostgREST APIのURL> production
    ```

### 3. デプロイの実行

以下のコマンドで、本番環境にデプロイします。
```bash
vercel --prod
```
