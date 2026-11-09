-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する
-- ログインした人（authenticated）だけが images バケットの画像を削除できるようにする
-- ※ 先に Authentication の設定で「新規登録（Allow new users to sign up）」をオフにしておくこと。
--    オンのままだと、誰でもアカウントを作って削除できてしまう。

create policy "images: logged-in users can delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images');
