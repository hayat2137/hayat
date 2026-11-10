"use client";

import { useState } from "react";

type Props = {
  text: string;
  className?: string;
};

// URL をクリップボードにコピーし、少しの間「コピーしました」と表示するボタン
export default function CopyButton({ text, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "コピーしました" : "URLをコピー"}
    </button>
  );
}
