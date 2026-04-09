import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HCP Attachment Exporter",
  description: "Export all your HouseCallPro attachments for data migration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
