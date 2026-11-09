-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する
-- images バケットに「5MB 未満」「JPEG・PNG・WEBP のみ」の制限をかける
-- （ツールの画面でもチェックしているが、画面を通さずに直接アップロードされる場合に備えて Supabase 側でも弾く）

update storage.buckets
set
  file_size_limit = 5242879,  -- 5MB（5 * 1024 * 1024 バイト）未満まで許可
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'images';

-- 確認用：設定が反映されたか表示する
select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'images';
