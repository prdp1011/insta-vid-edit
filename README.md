# FramePilot

FramePilot is a short-form video editor with a deliberate two-tier product model:

- **Free editor:** manual trim, 9:16 reframe, speed, captions, preview, undo/redo, and MP4 export run in the browser. Raw footage is not uploaded.
- **Creator AI:** paid transcription, highlight detection, three Reel concepts, editable timeline decisions, cloud rendering, and export artifacts.

The web application is designed for Vercel. Long FFmpeg jobs run in the separate Dockerized Python worker because media processing has different CPU, memory, and retry requirements from web requests.

## Chosen stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Web app/API | Next.js 16 + TypeScript on Vercel | One deployment for UI, billing, uploads, and short AI calls |
| Free rendering | FFmpeg.wasm in the browser | No infrastructure cost; footage stays on the creator's device |
| Paid rendering | Python/FastAPI + FFmpeg container | Deterministic commands, long-running jobs, simple horizontal scaling |
| AI planning | OpenAI provider interface, default `gpt-5.6-terra` | Strong structured output while keeping the provider replaceable |
| Transcription | Provider interface, default `gpt-transcribe` | Current non-deprecated OpenAI transcription path; worker integration is the next vertical slice |
| Database/auth | Supabase Postgres + Auth | Row-level security, managed Postgres, straightforward Vercel integration |
| Video storage | Private Vercel Blob client uploads | Large files bypass Vercel's function body limit and upload directly |
| Payments | Razorpay Subscriptions | INR, UPI/card mandates, webhooks, and India-first recurring billing |
| Region | Vercel Singapore (`sin1`) | Good latency for an India-first launch |

AI providers live behind interfaces; models can be changed with environment variables. AI produces typed creative decisions, never FFmpeg command strings.

## Local setup

Requirements: Node.js 22+, npm, Docker (for the paid rendering worker).

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The free editor works without API credentials. Browser export downloads a pinned FFmpeg WebAssembly runtime on first use.

For the render worker:

```bash
export WORKER_SIGNING_SECRET="use-at-least-32-random-characters"
docker compose up --build worker
```

The local worker listens on `http://localhost:8080`. Its `/v1/render` requests must be HMAC-SHA256 signed in the `x-framepilot-signature` header.

## Configuration and secrets

Copy `.env.example` to `.env.local`; never commit `.env.local`. Set the same production values in **Vercel → Project → Settings → Environment Variables**. Only variables beginning with `NEXT_PUBLIC_` are allowed in browser bundles.

Required for paid features:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID`, `RAZORPAY_WEBHOOK_SECRET`
- `WORKER_API_URL`, `WORKER_SIGNING_SECRET`

Set `NEXT_PUBLIC_BILLING_ENABLED=true` only after the Vercel scope is on a commercial plan and the Razorpay production setup has been verified. Checkout is intentionally hidden otherwise.

Run `supabase/migrations/0001_initial.sql` in the Supabase SQL editor. Create a monthly Razorpay plan for **₹999** and place its `plan_...` value in `RAZORPAY_PLAN_ID`. Configure the Razorpay webhook URL as:

```text
https://YOUR_DOMAIN/api/webhooks/razorpay
```

Subscribe it to `subscription.activated`, `subscription.charged`, `subscription.paused`, `subscription.cancelled`, and `subscription.completed`.

## Verification

```bash
npm test
npm run lint
npm run build
python3 -m unittest worker.tests.test_media
```

Worker integration tests that execute FFmpeg should run inside its Docker image; the pure command/security tests run without a local FFmpeg installation.

## Deployment

Deploy the Next.js root to the `prdp1011s-projects` Vercel scope. Add production environment variables before enabling paid checkout. Attach a private Vercel Blob store. Deploy `worker/` as a container service with at least 2 vCPU, 4 GB RAM, ephemeral scratch space, and a 20-minute request/job limit.

The payment endpoints fail closed when credentials are absent. The app never includes OpenAI, Razorpay secret, Supabase service-role, Blob, or worker-signing credentials in client code.

## Current vertical slice

Working now:

- Polished product site and responsive editor
- Local video input validation and preview
- Trim, framing, playback speed, caption styles, history, undo/redo
- Browser-side vertical MP4 export
- Typed timeline and creative-concept contracts
- Structured OpenAI concept provider/API
- Authenticated direct-upload token endpoint
- Razorpay subscription creation, signature verification, and webhook validation
- Row-level-secured project/asset/render schema
- Signed FastAPI render worker with safe paths and deterministic FFmpeg argument arrays

The next implementation slice is cloud ingestion: download a private Blob into worker scratch storage, inspect with ffprobe, transcribe, generate concepts, persist the canonical timeline, upload the render, and run QC. The boundaries and data model for that slice are already in place; the UI does not pretend it is active before credentials and worker storage are connected.
