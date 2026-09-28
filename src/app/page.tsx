import Link from "next/link";
import { ArrowRight, Captions, Check, Clapperboard, MousePointer2, Scissors, Sparkles, WandSparkles, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const workflow = [
  ["01", "Drop your footage", "MP4, MOV, or WebM. Your free edits stay on your device."],
  ["02", "Shape the story", "Trim, reframe, caption, and pace it with simple controls."],
  ["03", "Let AI take over", "Upgrade when you want hooks, highlights, and full drafts generated."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-white">
      <SiteHeader />
      <section className="relative mx-auto grid min-h-[780px] max-w-[1440px] items-center gap-14 px-6 pb-24 pt-28 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:pt-20">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="relative z-10 max-w-2xl">
          <div className="eyebrow mb-7 w-fit"><Sparkles size={13} /> AI video editor for short-form creators</div>
          <h1 className="font-display text-[clamp(3.75rem,8vw,7.6rem)] font-semibold leading-[0.86] tracking-[-0.075em]">Find the story.<br /><span className="text-gradient">Cut the noise.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/60 sm:text-xl">Edit Reels free with a clean, browser-based studio. When you want speed, FramePilot AI finds the hooks, builds the cut, and keeps every decision editable.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link className="button-primary h-14 px-7 text-base" href="/studio">Start editing free <ArrowRight size={18} /></Link>
            <Link className="button-secondary h-14 px-7 text-base" href="/pricing">See AI plans</Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/45">
            <span className="inline-flex items-center gap-2"><Check size={14} className="text-lime" /> No card needed</span>
            <span className="inline-flex items-center gap-2"><Check size={14} className="text-lime" /> No watermark</span>
            <span className="inline-flex items-center gap-2"><Check size={14} className="text-lime" /> Private by default</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[720px] lg:ml-auto">
          <div className="hero-orbit" />
          <div className="editor-shell relative z-10 rotate-[1.5deg] overflow-hidden rounded-[28px] border border-white/10 bg-[#111114] shadow-2xl shadow-violet-950/40">
            <div className="flex h-14 items-center justify-between border-b border-white/8 px-5">
              <div className="flex items-center gap-2.5 text-sm font-medium"><span className="brand-mark small"><Clapperboard size={14} /></span> Startup mistakes — v3</div>
              <div className="rounded-full bg-lime px-3 py-1.5 text-xs font-bold text-ink">Export</div>
            </div>
            <div className="grid min-h-[480px] grid-cols-[64px_1fr] sm:grid-cols-[76px_1fr_220px]">
              <div className="border-r border-white/8 p-3">
                {[Scissors, Captions, MousePointer2, WandSparkles].map((Icon, index) => <div key={index} className={`mb-3 grid aspect-square place-items-center rounded-xl ${index === 0 ? "bg-white text-black" : "text-white/35"}`}><Icon size={17} /></div>)}
              </div>
              <div className="flex flex-col bg-[#09090b] p-4 sm:p-6">
                <div className="relative mx-auto aspect-[9/16] h-[330px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#342269] via-[#16131f] to-[#19191e] shadow-2xl">
                  <div className="absolute inset-x-4 top-5 flex justify-between text-[8px] uppercase tracking-[0.18em] text-white/50"><span>Frame 004</span><span>9:16</span></div>
                  <div className="absolute left-1/2 top-[34%] h-28 w-24 -translate-x-1/2 rounded-[48%_48%_42%_42%] bg-gradient-to-b from-[#d69b75] to-[#5e3324] opacity-80" />
                  <div className="absolute bottom-20 left-3 right-3 text-center font-display text-[22px] font-black uppercase leading-[0.92] tracking-[-0.04em]">Most startups<br/><span className="text-lime">fail here</span></div>
                  <div className="absolute bottom-5 left-5 right-5 h-1 overflow-hidden rounded bg-white/15"><div className="h-full w-2/5 bg-lime" /></div>
                </div>
                <div className="mt-5 flex items-center gap-3 text-xs text-white/45"><span>00:14</span><div className="h-1 flex-1 rounded bg-white/10"><div className="h-full w-[36%] rounded bg-violet-500" /></div><span>00:38</span></div>
                <div className="mt-4 grid h-16 grid-cols-[1.2fr_.75fr_1fr] gap-1 rounded-lg bg-white/[0.04] p-1"><div className="rounded-md bg-violet-500/70" /><div className="rounded-md bg-violet-400/35"/><div className="rounded-md bg-lime/65"/></div>
              </div>
              <div className="hidden border-l border-white/8 p-4 sm:block">
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">AI editor</div>
                <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] p-3 text-xs leading-5 text-white/70">I found a stronger opening at 12:04. Want me to try it?</div>
                <div className="mt-3 rounded-2xl rounded-tr-sm bg-violet-600 p-3 text-xs leading-5">Yes — and make the first 5 seconds faster.</div>
                <div className="mt-4 space-y-2"><div className="flex items-center gap-2 rounded-xl border border-lime/20 bg-lime/5 p-2.5 text-[11px] text-lime"><Zap size={13}/> Hook replaced</div><div className="flex items-center gap-2 rounded-xl border border-white/8 p-2.5 text-[11px] text-white/50"><Scissors size={13}/> 3 pauses tightened</div></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 z-20 rounded-2xl border border-white/10 bg-[#1a1a1f]/95 p-4 shadow-xl backdrop-blur sm:-left-12"><div className="mb-2 flex items-center gap-2 text-xs text-white/45"><Sparkles size={13} className="text-lime"/> AI decision</div><div className="text-sm font-semibold">Removed 1.8s dead air</div><div className="mt-1 text-xs text-white/40">Reason: opening pace</div></div>
        </div>
      </section>
      <section id="workflow" className="border-y border-white/8 bg-white/[0.025]">
        <div className="mx-auto grid max-w-[1440px] divide-y divide-white/8 px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-12">
          {workflow.map(([number, title, body]) => <div key={number} className="py-10 md:px-8 md:first:pl-0 md:last:pr-0"><span className="font-mono text-xs text-lime">{number}</span><h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-white/45">{body}</p></div>)}
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12"><div className="grid gap-12 lg:grid-cols-2 lg:items-end"><div><div className="eyebrow mb-5 w-fit">Built around your intent</div><h2 className="font-display text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-7xl">Professional cuts.<br/><span className="text-white/30">Human control.</span></h2></div><p className="max-w-xl text-lg leading-8 text-white/50">AI suggests structured timeline changes instead of hiding your project behind a magic button. Keep, undo, or replace every choice.</p></div></section>
    </main>
  );
}
