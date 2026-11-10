"use client";

import { useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// よくあるログイン失敗の理由は日本語にする
const LOGIN_ERRORS: Record<string, string> = {
  invalid_credentials: "メールアドレスかパスワードが違います（またはそのユーザーが存在しません）。",
  email_not_confirmed: "メールアドレスが未確認です。管理画面でユーザーを確認済みにしてください。",
};

const buttonClass =
  "rounded-md border border-line bg-card px-3 py-1 text-sm hover:border-accent hover:text-accent disabled:opacity-50";
const inputClass =
  "min-w-0 rounded-md border border-line bg-card px-2 py-1 text-sm focus:border-accent focus:outline-none";

// 右上の管理者ログイン・ログアウト
export default function AuthBar({ session }: { session: Session | null }) {
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const reason = LOGIN_ERRORS[error.code ?? ""] ?? `${error.message}（${error.code ?? error.status}）`;
      setError(`ログインできませんでした：${reason}`);
      return;
    }
    setPassword("");
    setFormOpen(false);
  }

  async function logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    // サーバーに届かなかった場合も、この端末からはログアウトする
    if (error) await supabase.auth.signOut({ scope: "local" });
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">{session.user.email}</span>
        <button type="button" onClick={logout} className={buttonClass}>
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {formOpen ? (
        <form onSubmit={login} className="flex flex-wrap justify-end gap-1.5">
          <input
            type="email"
            placeholder="メールアドレス"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="パスワード"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? "ログイン中…" : "ログイン"}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setFormOpen(true)} className={buttonClass}>
          管理者ログイン
        </button>
      )}
      {error && <p className="m-0 text-sm text-danger">{error}</p>}
    </div>
  );
}
