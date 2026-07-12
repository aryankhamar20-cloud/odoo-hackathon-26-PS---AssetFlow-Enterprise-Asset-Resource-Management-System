import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetFlow",
  description: "Enterprise Asset & Resource Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <div className="flex min-h-screen">
          {/* Sidebar shell — role-gated nav items go here. Fixed 240px, ink bg. */}
          <aside className="w-60 shrink-0 bg-ink text-white">
            <div className="p-4 font-display text-xl font-bold">AssetFlow</div>
            {/* TODO: nav items filtered by role, see PRD 5.2 quick actions */}
          </aside>
          <main className="flex-1 mx-auto w-full max-w-[1280px] p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
