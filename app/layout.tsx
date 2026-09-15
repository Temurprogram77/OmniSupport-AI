import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniSupport AI - Autonomous Logistics & Order Specialist",
  description:
    "Autonomous E-commerce and Logistics Support Agent with Gemini 2.0 Flash Tool Calling, Prisma ORM, and Supabase PostgreSQL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
