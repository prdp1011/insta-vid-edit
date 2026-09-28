import Link from "next/link";
import { Clapperboard } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-3 font-display text-lg font-extrabold tracking-[-0.04em]">
          <span className="brand-mark"><Clapperboard size={17}/></span> FramePilot
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/55 md:flex">
          <Link className="hover:text-white" href="/studio">Editor</Link>
          <Link className="hover:text-white" href="/pricing">Pricing</Link>
          <Link className="hover:text-white" href="/#workflow">How it works</Link>
        </nav>
        <Link className="button-secondary h-10 px-5 text-sm" href="/studio">Open studio</Link>
      </div>
    </header>
  );
}
