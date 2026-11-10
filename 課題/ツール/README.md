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
