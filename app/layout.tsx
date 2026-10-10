import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linklight | Check links and QR codes",
  description: "Check links and QR codes before opening them. Download Linklight for desktop Chrome.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
