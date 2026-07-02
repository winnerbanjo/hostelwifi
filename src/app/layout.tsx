import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Jendor The Plug | Hostel WiFi Vouchers",
  description: "Buy hostel internet vouchers in seconds."
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pb-16 md:pb-0">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
