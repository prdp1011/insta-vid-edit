"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  Captions, Check, ChevronLeft, Clapperboard, Cloud, Download, Film, FolderOpen,
  Gauge, Image as ImageIcon, LoaderCircle, Maximize2, Pause, Play, Redo2,
  Scissors, Sparkles, Undo2, Upload, WandSparkles, X, Zap,
} from "lucide-react";
import { exportVerticalVideo } from "@/lib/browser-export";

type EditorState = { start: number; end: number; speed: number; fit: "cover" | "contain"; caption: string; captionStyle: "clean" | "bold" | "minimal" };
const initialState: EditorState = { start: 0, end: 30, speed: 1, fit: "cover", caption: "YOUR STORY STARTS HERE", captionStyle: "bold" };

const fmt = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2,"0")}:${Math.floor(seconds % 60).toString().padStart(2,"0")}`;

export function FreeEditor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<EditorState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const state = history[historyIndex];

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const apply = (patch: Partial<EditorState>) => {
    const next = { ...state, ...patch };
    setHistory((items) => [...items.slice(0, historyIndex + 1), next]);
    setHistoryIndex((index) => index + 1);
  };

  const acceptFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("video/")) { setMessage("Choose an MP4, MOV, or WebM video."); return; }
    if (nextFile.size > 500 * 1024 * 1024) { setMessage("Free browser editing supports files up to 500 MB."); return; }
    if (url) URL.revokeObjectURL(url);
    setFile(nextFile); setUrl(URL.createObjectURL(nextFile)); setMessage(""); setCurrent(0); setPlaying(false);
  };

  const onMetadata = () => {
    const mediaDuration = videoRef.current?.duration || 0;
    setDuration(mediaDuration);
    const next = { ...initialState, end: Math.min(mediaDuration, 30) };
    setHistory([next]); setHistoryIndex(0);
  };

  const togglePlayback = () => {
    const video = videoRef.current; if (!video) return;
    if (video.paused) { if (video.currentTime < state.start || video.currentTime >= state.end) video.currentTime = state.start; video.playbackRate = state.speed; void video.play(); }
    else video.pause();
  };

  const exportVideo = async () => {
    if (!file) return;
    setExporting(true); setProgress(0); setMessage("");
    try {
      const blob = await exportVerticalVideo({ file, start: state.start, end: state.end, speed: state.speed, fit: state.fit, onProgress: setProgress });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = downloadUrl; anchor.download = `${file.name.replace(/\.[^.]+$/, "")}-vertical.mp4`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2_000); setMessage("Export complete — your source never left this device.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); }
    finally { setExporting(false); }
  };

  const timelineWidth = duration ? `${Math.max(4, ((state.end - state.start) / duration) * 100)}%` : "100%";
  const timelineLeft = duration ? `${(state.start / duration) * 100}%` : "0%";

  return (
    <main className="flex min-h-screen flex-col bg-[#08080a] text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/8 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Back home" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/55 hover:text-white"><ChevronLeft size={18}/></Link>
          <Link href="/" className="hidden items-center gap-2.5 font-extrabold sm:flex"><span className="brand-mark small"><Clapperboard size={14}/></span>FramePilot</Link>
          <div className="hidden h-5 w-px bg-white/10 sm:block"/><span className="max-w-40 truncate text-sm text-white/55">{file?.name || "Untitled Reel"}</span>
          <span className="hidden rounded-full bg-white/5 px-2 py-1 font-mono text-[10px] text-white/35 md:inline">SAVED LOCALLY</span>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Undo" onClick={() => setHistoryIndex((i) => Math.max(0, i - 1))} disabled={historyIndex === 0} className="grid h-9 w-9 place-items-center rounded-lg text-white/50 hover:bg-white/5 disabled:opacity-20"><Undo2 size={17}/></button>
          <button aria-label="Redo" onClick={() => setHistoryIndex((i) => Math.min(history.length - 1, i + 1))} disabled={historyIndex === history.length - 1} className="grid h-9 w-9 place-items-center rounded-lg text-white/50 hover:bg-white/5 disabled:opacity-20"><Redo2 size={17}/></button>
          <Link href="/pricing" className="hidden h-9 items-center gap-2 rounded-full bg-violet-600 px-4 text-xs font-bold sm:flex"><Sparkles size={14}/> Use AI</Link>
          <button onClick={exportVideo} disabled={!file || exporting} className="button-primary h-9 px-4 text-xs disabled:cursor-not-allowed disabled:opacity-35">{exporting ? <LoaderCircle className="animate-spin" size={14}/> : <Download size={14}/>} {exporting ? `${Math.round(progress * 100)}%` : "Export"}</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[72px_1fr_292px]">
        <aside className="hidden flex-col items-center gap-3 border-r border-white/8 px-3 py-5 lg:flex">
          {[[Scissors,"Edit"],[Captions,"Text"],[ImageIcon,"Media"],[Gauge,"Pace"]].map(([Icon,label],index) => { const I = Icon as typeof Scissors; return <button key={String(label)} className={`flex w-full flex-col items-center gap-1.5 rounded-xl py-3 text-[10px] ${index === 0 ? "bg-white text-black" : "text-white/35 hover:bg-white/5 hover:text-white"}`}><I size={18}/>{String(label)}</button>; })}
          <div className="mt-auto"><span className="grid h-9 w-9 place-items-center rounded-full bg-lime text-xs font-black text-black">FP</span></div>
        </aside>

        <section className="flex min-w-0 flex-col bg-[#0c0c0f]">
          <div className="relative flex min-h-[480px] flex-1 items-center justify-center overflow-hidden p-6">
            <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage:"linear-gradient(#fff 1px, transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize:"32px 32px" }}/>
            {!file ? (
              <button onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); acceptFile(e.dataTransfer.files[0]); }} className="relative z-10 flex w-full max-w-xl flex-col items-center rounded-[28px] border border-dashed border-white/15 bg-white/[0.025] px-8 py-20 text-center transition hover:border-lime/40 hover:bg-lime/[0.025]">
                <span className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-lime text-black shadow-[0_0_60px_rgba(200,255,61,.12)]"><Upload size={25}/></span>
                <h1 className="font-display text-3xl font-semibold tracking-[-0.04em]">Drop in your raw footage</h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">Edit locally for free. Video stays in your browser until you choose an AI feature.</p>
                <span className="button-secondary mt-7 h-11 px-5 text-sm"><FolderOpen size={16}/> Choose video</span>
                <span className="mt-5 font-mono text-[10px] uppercase tracking-widest text-white/25">MP4 · MOV · WebM · up to 500 MB</span>
              </button>
            ) : (
              <div className="relative z-10 h-[min(58vh,610px)] max-h-[610px] aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <video ref={videoRef} src={url} onLoadedMetadata={onMetadata} onTimeUpdate={(e) => { const time=e.currentTarget.currentTime; setCurrent(time); if (time >= state.end) { e.currentTarget.pause(); e.currentTarget.currentTime=state.start; } }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} className={`h-full w-full ${state.fit === "cover" ? "object-cover" : "object-contain"}`} playsInline />
                <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlayback} className="absolute inset-0 grid place-items-center bg-transparent opacity-0 transition hover:bg-black/10 hover:opacity-100"><span className="grid h-14 w-14 place-items-center rounded-full bg-black/60 backdrop-blur">{playing ? <Pause fill="white" size={21}/> : <Play fill="white" size={21}/>}</span></button>
                {state.caption && <div className={`pointer-events-none absolute inset-x-4 bottom-[12%] text-center ${state.captionStyle === "bold" ? "font-black uppercase text-[clamp(1rem,3vh,2rem)] leading-[.95] drop-shadow-[0_3px_0_#000]" : state.captionStyle === "minimal" ? "text-sm font-semibold" : "rounded-md bg-black/55 px-2 py-1 text-lg font-bold"}`}><span className={state.captionStyle === "bold" ? "bg-lime px-1 text-black" : ""}>{state.caption}</span></div>}
                <div className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[9px] text-white/65 backdrop-blur">9:16 · 1080 × 1920</div>
              </div>
            )}
            <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0])}/>
          </div>

          <div className="border-t border-white/8 bg-[#0a0a0d] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between text-xs text-white/35"><span>{fmt(current)} / {fmt(state.end)}</span><div className="flex gap-2"><button onClick={togglePlayback} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">{playing?<Pause size={14}/>:<Play size={14}/>}</button><button className="grid h-8 w-8 place-items-center rounded-lg bg-white/5"><Maximize2 size={14}/></button></div></div>
            <div className="relative h-24 overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-2">
              <div className="absolute inset-x-0 top-1/2 border-t border-white/5"/>
              <div className="absolute bottom-2 top-2 rounded-lg border-2 border-lime bg-violet/30" style={{ left:timelineLeft, width:timelineWidth }}>
                <div className="absolute inset-x-2 top-2 flex h-8 items-center gap-1 overflow-hidden opacity-70">{Array.from({length:18},(_,i)=><span key={i} className="h-full min-w-4 flex-1 rounded-sm bg-gradient-to-b from-violet-300/40 to-violet-700/20"/>)}</div>
                <div className="absolute bottom-1.5 left-2 text-[9px] font-semibold">{file?.name}</div>
              </div>
              {duration>0 && <div className="absolute bottom-0 top-0 w-px bg-white" style={{left:`${Math.min(100,(current/duration)*100)}%`}}><span className="absolute -left-1 top-0 h-2 w-2 rotate-45 bg-white"/></div>}
            </div>
          </div>
        </section>

        <aside className="border-l border-white/8 bg-[#0e0e11] p-5">
          <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Edit settings</h2>{file && <button onClick={()=>{setFile(null);setUrl("");}} className="text-white/30 hover:text-white" aria-label="Close video"><X size={16}/></button>}</div>
          <div className="mt-6 space-y-7">
            <Control label="Trim" icon={<Scissors size={14}/>}>
              <div className="grid grid-cols-2 gap-2"><NumberInput label="Start" value={state.start} max={Math.max(0,state.end-.1)} onChange={(value)=>apply({start:value})}/><NumberInput label="End" value={state.end} max={duration||30} onChange={(value)=>apply({end:Math.max(state.start+.1,value)})}/></div>
            </Control>
            <Control label="Framing" icon={<Film size={14}/>}><div className="grid grid-cols-2 gap-2">{(["cover","contain"] as const).map((fit)=><button key={fit} onClick={()=>apply({fit})} className={`rounded-xl border px-3 py-2.5 text-xs capitalize ${state.fit===fit?"border-lime bg-lime/10 text-lime":"border-white/8 text-white/40"}`}>{fit === "cover" ? "Fill frame" : "Fit video"}</button>)}</div></Control>
            <Control label="Speed" icon={<Zap size={14}/>}><div className="grid grid-cols-4 gap-1.5">{[.75,1,1.25,1.5].map(speed=><button key={speed} onClick={()=>apply({speed})} className={`rounded-lg py-2 text-[11px] ${state.speed===speed?"bg-white text-black":"bg-white/5 text-white/40"}`}>{speed}×</button>)}</div></Control>
            <Control label="Caption" icon={<Captions size={14}/>}><textarea value={state.caption} onChange={(e)=>apply({caption:e.target.value.slice(0,90)})} placeholder="Add a caption" className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-xs outline-none focus:border-lime/50"/><div className="mt-2 grid grid-cols-3 gap-1.5">{(["clean","bold","minimal"] as const).map(style=><button key={style} onClick={()=>apply({captionStyle:style})} className={`rounded-lg py-2 text-[10px] capitalize ${state.captionStyle===style?"bg-violet text-white":"bg-white/5 text-white/35"}`}>{style}</button>)}</div></Control>
          </div>
          <div className="mt-8 rounded-2xl border border-violet/25 bg-violet/8 p-4"><div className="flex items-center gap-2 text-xs font-bold text-violet-300"><WandSparkles size={15}/> Want AI to do the cut?</div><p className="mt-2 text-[11px] leading-5 text-white/40">Find hooks, remove dead air, generate captions, and get three editable concepts.</p><Link href="/pricing" className="mt-4 flex h-9 items-center justify-center rounded-full bg-violet text-xs font-bold">Explore AI Studio</Link></div>
          {message && <div className={`mt-4 flex gap-2 rounded-xl p-3 text-[11px] leading-5 ${message.startsWith("Export complete")?"bg-lime/10 text-lime":"bg-amber-400/10 text-amber-200"}`}>{message.startsWith("Export complete")&&<Check size={14} className="mt-0.5 shrink-0"/>}{message}</div>}
          <div className="mt-5 flex items-center gap-2 text-[10px] text-white/25"><Cloud size={12}/> AI uploads only happen with your permission.</div>
        </aside>
      </div>
    </main>
  );
}

function Control({label,icon,children}:{label:string;icon:React.ReactNode;children:React.ReactNode}) { return <div><div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-white/35">{icon}{label}</div>{children}</div>; }
function NumberInput({label,value,max,onChange}:{label:string;value:number;max:number;onChange:(value:number)=>void}) { return <label className="rounded-xl border border-white/8 bg-black/20 p-2.5"><span className="block text-[9px] uppercase tracking-wider text-white/25">{label}</span><input type="number" min={0} max={max} step="0.1" value={Number.isFinite(value)?value:0} onChange={(e)=>onChange(Math.min(max,Math.max(0,Number(e.target.value))))} className="mt-1 w-full bg-transparent text-xs outline-none"/></label>; }
