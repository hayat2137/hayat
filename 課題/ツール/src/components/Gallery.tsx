"use client";

import { publicUrlOf } from "@/lib/supabase";
import CopyButton from "./CopyButton";

type Props = {
  files: { name: string }[];
  canDelete: boolean;
  deleting: string | null;
  onDelete: (name: string) => void;
};

const actionClass = "flex-1 px-2 py-2 text-sm hover:text-accent disabled:opacity-50";

// アップロード済み画像のサムネイル一覧
export default function Gallery({ files, canDelete, deleting, onDelete }: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {files.map((f) => {
        const url = publicUrlOf(f.name);
        return (
          <figure
            key={f.name}
            className="m-0 flex flex-col overflow-hidden rounded-lg border border-line bg-card"
          >
            {/* Supabase の公開 URL をそのまま表示する（Next.js の画像最適化は使わない） */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={f.name} loading="lazy" className="aspect-square w-full object-cover" />
            <div className="flex divide-x divide-line border-t border-line">
              <CopyButton text={url} className={actionClass} />
              {/* ログイン中だけ削除ボタンを出す（実際の削除可否は Supabase 側のポリシーで判定される） */}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(f.name)}
                  disabled={deleting === f.name}
                  className={`${actionClass} text-danger hover:bg-danger hover:text-white`}
                >
                  {deleting === f.name ? "削除中…" : "削除"}
                </button>
              )}
            </div>
          </figure>
        );
      })}
    </div>
  );
}
