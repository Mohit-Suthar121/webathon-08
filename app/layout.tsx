import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "ReliefHub — Real-Time Crisis Coordination & Dispatch",
  description:
    "Instant real-time crisis coordination connecting citizens requesting urgent relief with volunteers and supply hubs, equipped with prioritized dispatcher command views.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#070B14] text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200">
        {children}
      </body>
    </html>
  );
}
