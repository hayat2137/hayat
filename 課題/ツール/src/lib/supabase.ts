import { createClient } from "@supabase/supabase-js";

// 接続情報は .env から読み込む（コードに直書きしない）
// NEXT_PUBLIC_ が付いた値はビルド時にページへ埋め込まれ、ブラウザから見える。
// ここには publishable（anon）key だけを入れ、service_role key は絶対に入れないこと。
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "images";

// 接続情報が設定されていないときは null（画面で案内を出す）
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function publicUrlOf(path: string): string {
  if (!supabase) return "";
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
