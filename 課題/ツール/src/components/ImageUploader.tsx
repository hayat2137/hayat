"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { BUCKET, publicUrlOf, supabase } from "@/lib/supabase";
import { ACCEPT, makePath, validate } from "@/lib/upload-rules";
import AuthBar from "./AuthBar";
import CopyButton from "./CopyButton";
import Gallery from "./Gallery";

type StoredFile = { name: string };

// アップロード結果の1行分
type ResultItem = {
  key: string;
  fileName: string;
  status: "uploading" | "done" | "error";
  url?: string;
  message?: string;
};

const LIST_LIMIT = 100;

export default function ImageUploader() {
  const [session, setSession] = useState<Session | null>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [listError, setListError] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------- 一覧の取得 ----------
  const loadList = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: LIST_LIMIT, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      setListError(error.message);
      setListState("error");
      return;
    }
    // フォルダのプレースホルダー（.emptyFolderPlaceholder）などは除く
    setFiles(data.filter((f) => f.id && !f.name.startsWith(".")).map((f) => ({ name: f.name })));
    setListState("ready");
  }, []);

  useEffect(() => {
    if (!supabase) return;
    loadList();

    // ログイン状態が変わったら画面を切り替える
    // （このコールバック内で他の Supabase 処理を await すると固まることがあるため、状態の更新だけ行う）
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setResults([]);
    });
    return () => data.subscription.unsubscribe();
  }, [loadList]);

  function reload() {
    setListState("loading");
    loadList();
  }

  // ---------- アップロード ----------
  function updateResult(key: string, patch: Partial<ResultItem>) {
    setResults((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function uploadFiles(selected: File[]) {
    if (!supabase || selected.length === 0) return;
    // アップロードはログイン中だけ（実際の可否は Supabase 側のポリシーで判定される）
    if (!session) {
      alert("画像をアップロードするにはログインしてください。");
      return;
    }

    setResults([]);
    for (const file of selected) {
      const key = crypto.randomUUID();

      // 形式・サイズのチェック（条件外はアップロードしない）
      const reason = validate(file);
      if (reason) {
        setResults((prev) => [...prev, { key, fileName: file.name, status: "error", message: reason }]);
        continue;
      }

      setResults((prev) => [...prev, { key, fileName: file.name, status: "uploading" }]);
      const path = makePath(file);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });

      if (error) {
        updateResult(key, { status: "error", message: `失敗しました（${error.message}）` });
        continue;
      }

      updateResult(key, { status: "done", url: publicUrlOf(path) });
      // 成功したらすぐに一覧の先頭へ追加する（全件の再取得を待たない）
      setFiles((prev) => [{ name: path }, ...prev]);
    }
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  }

  // ---------- 削除 ----------
  async function deleteFile(name: string) {
    if (!supabase) return;
    if (!confirm("この画像を削除しますか？\n削除すると元に戻せず、この画像のURLも見られなくなります。")) return;

    setDeleting(name);
    const { data, error } = await supabase.storage.from(BUCKET).remove([name]);
    setDeleting(null);

    // ポリシーで許可されていないと、エラーにならず「0件削除」が返るため件数も確認する
    if (error || !data || data.length === 0) {
      alert(
        `削除できませんでした（${error ? error.message : "権限がありません。削除用のSQLを実行したか確認してください"}）`,
      );
      return;
    }
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  // ---------- 画面 ----------
  if (!supabase) {
    return (
      <p className="text-danger">
        .env に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください（.env.example を参照）。
      </p>
    );
  }

  const statusText =
    listState === "loading"
      ? "読み込み中…"
      : listState === "error"
        ? `一覧の取得に失敗しました（${listError}）`
        : files.length
          ? `${files.length} 件（新しい順・最大${LIST_LIMIT}件）`
          : "まだ画像がありません。";

  return (
    <>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">画像アップローダー</h1>
        <AuthBar session={session} />
      </header>

      {session ? (
        // ドロップエリア（ログイン中だけ表示。クリックでファイル選択もできる）
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`block cursor-pointer rounded-xl border-2 border-dashed px-4 py-12 text-center transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent ${
            dragOver ? "border-accent bg-accent-soft text-accent" : "border-line bg-card text-muted"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              uploadFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          ここに画像をドラッグ＆ドロップ
          <br />
          <small>またはクリックして選択（JPEG・PNG・WEBP／5MB 未満）</small>
        </label>
      ) : (
        <p className="m-0 rounded-xl border border-line bg-card px-4 py-6 text-center text-muted">
          画像をアップロードするには、右上の「管理者ログイン」からログインしてください。
        </p>
      )}

      {results.length > 0 && (
        <section className="mt-4 rounded-lg border border-line bg-card px-4 py-3">
          <h2 className="text-lg font-semibold">アップロード結果</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 break-all">
            {results.map((r) => (
              <li key={r.key} className={r.status === "error" ? "text-danger" : undefined}>
                {r.fileName}:{" "}
                {r.status === "uploading" && "アップロード中…"}
                {r.status === "error" && r.message}
                {r.status === "done" && r.url && (
                  <>
                    <a href={r.url} target="_blank" rel="noopener" className="text-accent underline">
                      {r.url}
                    </a>{" "}
                    <CopyButton
                      text={r.url}
                      className="rounded-md border border-line px-2 py-0.5 text-sm hover:border-accent hover:text-accent"
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">アップロード済み</h2>
          <button
            type="button"
            onClick={reload}
            className="rounded-md border border-line bg-card px-3 py-1 text-sm hover:border-accent hover:text-accent"
          >
            再読み込み
          </button>
        </div>
        <p className={`my-3 text-sm ${listState === "error" ? "text-danger" : "text-muted"}`}>{statusText}</p>
        <Gallery files={files} canDelete={Boolean(session)} deleting={deleting} onDelete={deleteFile} />
      </section>
    </>
  );
}
