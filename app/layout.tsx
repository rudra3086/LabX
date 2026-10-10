import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "SmartLab | Practical Work Platform",
  description:
    "Centralized academic practical management: sessions, tasks, submissions, grading, deadlines and monthly reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}