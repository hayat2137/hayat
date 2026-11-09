-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する（確認用。何も変更しない）
-- storage.objects に設定されているポリシーの一覧を表示する
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
