import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Hello Jobs — Direct Hands for Indian Industry", template: "%s | Hello Jobs" },
  description:
    "Two-way marketplace connecting ITI holders and factory workers directly with verified manufacturing units. Zero middlemen, 100% fair pay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-slate-50 font-sans text-slate-900 antialiased`}>
        <Header />
        <main>{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
          Hello Jobs — 0% commission for workers. Never pay anyone to get a job.{" "}
          <a href="/report" className="font-medium text-amber-700 underline">
            Report an agent
          </a>
        </footer>
      </body>
    </html>
  );
}
