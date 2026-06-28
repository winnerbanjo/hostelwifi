import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jendor The Plug | Hostel WiFi Vouchers",
  description: "Buy hostel internet vouchers in seconds."
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
