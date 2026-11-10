-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する
-- 「images」という公開バケットを作り、誰でも（ログインなしで）アップロード・一覧取得できるようにする
-- ※ アップロードをログインした人だけに絞る場合は、続けて supabase-upload-auth-only.sql を実行する

-- 1. 公開バケットを作成（ダッシュボードで作成済みなら不要）
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. 誰でもアップロードできるようにする
create policy "images: anyone can upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'images');

-- 3. 誰でも一覧を取得できるようにする
create policy "images: anyone can list"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'images');

-- ※ 削除・上書きのポリシーは作らないので、アップロードした画像を他人が消すことはできない
