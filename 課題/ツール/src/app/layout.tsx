import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "画像アップローダー",
  description: "ドラッグ＆ドロップで画像をアップロードし、公開URLを発行するツール",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
