# 画像アップローダー

ドラッグ＆ドロップで画像を Supabase Storage にアップロードし、公開 URL を表示するツール。
アップロード済みの画像はサムネイルで一覧表示する（Vite + supabase-js）。

## セットアップ

1. Supabase ダッシュボードの SQL Editor で `supabase-setup.sql` を実行する
2. `.env.example` をコピーして `.env` を作り、Project URL と anon key を入れる
3. 次のコマンドで起動する

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## 画像の削除（管理者だけ）

ログインした人だけが画像を削除できる。新規登録の画面はなく、アカウントは管理画面で作る。

1. Supabase ダッシュボード → Authentication → Sign In / Providers で **Allow new users to sign up をオフ** にする
2. Authentication → Users → Add user → Create new user で、自分のメールアドレスとパスワードを登録する（Auto Confirm User にチェック）
3. SQL Editor で `supabase-delete-policy.sql` を実行する
4. ツール右上の「管理者ログイン」からログインすると、各画像に「削除」ボタンが出る

## 注意

- 今の設定では **誰でもアップロードできる**。URL を他人に教えるときは、容量を使われたり、不適切な画像を上げられたりする可能性があることに注意する。
- `.env` は Git に上げない（hayat の `.gitignore` で除外済み）。
