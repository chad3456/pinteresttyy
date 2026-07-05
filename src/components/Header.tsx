import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 sm:px-10 py-8 border-b border-white/5">
      <Link
        href="/"
        className="font-[family-name:var(--font-serif-display)] italic text-xl sm:text-2xl tracking-wide text-[#f3efe6] hover:text-[var(--accent)] transition-colors"
      >
        {SITE_NAME}
      </Link>
      <nav className="flex items-center gap-7 text-[11px] tracking-[0.2em] uppercase text-neutral-400">
        <Link href="/upload" className="hover:text-[var(--accent)] transition-colors">
          Upload
        </Link>
        <Link href="/admin" className="hover:text-[var(--accent)] transition-colors">
          Admin
        </Link>
      </nav>
    </header>
  );
}
