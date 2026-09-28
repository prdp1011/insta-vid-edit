type ExportOptions = {
  file: File;
  start: number;
  end: number;
  speed: number;
  fit: "cover" | "contain";
  onProgress: (progress: number) => void;
};

export async function exportVerticalVideo({ file, start, end, speed, fit, onProgress }: ExportOptions) {
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  const coreBase = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
  ffmpeg.on("progress", ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))));
  await ffmpeg.load({
    coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm"),
  });

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const input = `source.${extension}`;
  await ffmpeg.writeFile(input, await fetchFile(file));
  const duration = Math.max(0.1, end - start);
  const frameFilter = fit === "cover"
    ? "crop=ih*9/16:ih:(iw-ow)/2:0,scale=1080:1920"
    : "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black";
  const filters = `${frameFilter},setpts=${(1 / speed).toFixed(6)}*PTS`;

  const code = await ffmpeg.exec([
    "-ss", start.toFixed(3), "-t", duration.toFixed(3), "-i", input,
    "-vf", filters,
    "-af", `atempo=${speed.toFixed(3)}`,
    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24",
    "-c:a", "aac", "-b:a", "160k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "output.mp4",
  ]);
  if (code !== 0) throw new Error("The browser renderer could not complete this export.");
  const output = await ffmpeg.readFile("output.mp4");
  const bytes = output instanceof Uint8Array ? output.slice() : new TextEncoder().encode(output);
  ffmpeg.terminate();
  return new Blob([bytes], { type: "video/mp4" });
}
