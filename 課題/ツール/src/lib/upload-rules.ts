// アップロードできる画像の条件（Supabase 側のバケット設定 supabase-limits.sql と合わせること）
export const MAX_BYTES = 5 * 1024 * 1024; // 5MB 以上は弾く

export const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// ファイル選択画面で JPEG・PNG・WEBP だけを出すための値
export const ACCEPT = Object.keys(ALLOWED_TYPES).join(",");

// 条件に合わなければ理由を返す（合えば null）
export function validate(file: File): string | null {
  if (!ALLOWED_TYPES[file.type]) {
    return "対応していない形式です（JPEG・PNG・WEBP のみ）";
  }
  if (file.size >= MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `サイズが大きすぎます（${mb}MB。5MB 未満にしてください）`;
  }
  return null;
}

// 日本語や空白を含むファイル名は Storage でエラーになることがあるため、ランダムな名前に置き換える
// 拡張子はファイル名ではなく実際の形式から付ける
export function makePath(file: File): string {
  return `${crypto.randomUUID()}.${ALLOWED_TYPES[file.type]}`;
}
