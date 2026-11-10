# 画像アップローダー

ドラッグ＆ドロップで画像を Supabase Storage にアップロードし、公開 URL を表示するツール。
アップロード済みの画像はサムネイルで一覧表示する（Next.js + TypeScript + Tailwind CSS + supabase-js）。

## ファイル構成

- `src/app/` … ページ（`page.tsx`）・全体のレイアウト・色の設定（`globals.css`）
- `src/components/` … 画面の部品（`ImageUploader` が本体、`AuthBar` がログイン、`Gallery` が一覧）
- `src/lib/` … Supabase への接続（`supabase.ts`）とアップロード条件（`upload-rules.ts`）
- `supabase-*.sql` … Supabase の SQL Editor で実行する設定

## セットアップ

1. Supabase ダッシュボードの SQL Editor で `supabase-setup.sql` を実行する
2. `.env.example` をコピーして `.env` を作り、Project URL と anon key を入れる
3. 次のコマンドで起動する

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## Vercel で公開する場合

- Root Directory：`課題/ツール`
- Framework Preset：**Next.js**
- Environment Variables：`NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY`・`NEXT_PUBLIC_SUPABASE_BUCKET`（`.env` と同じ値）

## アップロードできる画像

- 形式：JPEG・PNG・WEBP のみ
- サイズ：5MB 未満

画面でチェックしたうえで、Supabase 側でも同じ制限をかける（SQL Editor で `supabase-limits.sql` を実行）。

## アップロードと削除（ログインした人だけ）

画像のアップロードと削除は、ログインした人だけができる。一覧の表示と画像の閲覧は誰でもできる。
新規登録の画面はなく、アカウントは管理画面で作る。

1. Supabase ダッシュボード → Authentication → Sign In / Providers で **Allow new users to sign up をオフ** にする
2. Authentication → Users → Add user → Create new user で、使う人のメールアドレスとパスワードを登録する（Auto Confirm User にチェック）
3. SQL Editor で `supabase-delete-policy.sql` と `supabase-upload-auth-only.sql` を実行する
4. ツール右上の「管理者ログイン」からログインすると、アップロード欄と各画像の「削除」ボタンが出る

## 注意

- 一覧と画像の URL は誰でも見られる。見られて困る画像は上げない。
- `.env` は Git に上げない（このフォルダの `.gitignore` で除外済み）。
