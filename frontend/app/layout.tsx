import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HyPanel",
  description: "Hysteria visual management panel",
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
