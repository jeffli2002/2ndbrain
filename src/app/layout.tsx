import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "第二大脑 | Second Brain",
  description: "你的个人知识管理系统 - 记忆、文档、任务一体化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
