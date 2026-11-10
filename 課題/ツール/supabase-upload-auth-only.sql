-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する
-- アップロードを「ログインした人だけ」に変更する（一覧の表示と画像の閲覧は今までどおり誰でもできる）

-- 1. 「誰でもアップロードできる」ポリシーを削除
drop policy if exists "images: anyone can upload" on storage.objects;

-- 2. ログインした人（authenticated）だけがアップロードできるポリシーを作成
create policy "images: logged-in users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

-- 確認用：storage.objects のポリシー一覧を表示する
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
