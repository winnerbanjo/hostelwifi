import Link from "next/link";
import { Wifi, MessageCircle } from "lucide-react";
import { business, whatsappLink } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-brand">
            <Wifi size={20} />
          </span>
          <span>{business.name}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/plans">Plans</Link>
          <Link href="/voucher-checker">Check Voucher</Link>
          <Link href="/support">Support</Link>
          <Link href="/account">Account</Link>
        </nav>
        <a className="btn btn-secondary px-3 py-2 text-sm" href={whatsappLink("Hello Jendor The Plug, I need internet support.")}>
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>
    </header>
  );
}
