# Project Context Summary: AI Verbal Interview Simulator

This document serves as a complete hand-off and state-of-the-art reference for the AI Verbal Interview platform. It captures what we have built, how it operates under the hood, and the next steps for latency optimization.

---

## 🏗️ System Architecture & Services Stack

Our application is built as a multi-container Docker Compose stack:
1. **`aivalytics-unified-frontend`**: React / Vite SPA served on `http://localhost:5173`.
2. **`aivalytics-unified-backend`**: FastAPI (Python 3.12) server listening on `http://localhost:8000`.
3. **`aivalytics-kokoro-tts`**: CPU-bound speech synthesis microservice listening internally on `http://kokoro-tts:8880` (mapped to host port `8880`).
4. **`supabase`**: Database layer tracking sessions, turns, rubrics evaluation, and user authentication.

---

## 🛠️ Key Milestones Completed

During this session, we resolved critical bugs and modernized the voice pipeline architecture:

### 1. Media Permission & Mic UI Comfort
* **What We Built**: Configured the microphone to start in a muted state (`micActive = false` by default). Added a native browser `navigator.mediaDevices.getUserMedia` prompt on mount to pre-authorize permissions so toggling unmute triggers voice recording instantly on the first click.

### 2. Speech Synthesizer Connection Fix
* **What We Built**: The `kokoro-fastapi` CPU container executes its Uvicorn endpoint internally on port **`8880`** (not `8000`). We corrected the port mappings inside [docker-compose.yml](file:///d:/AiValytics%20Docs/Merging/docker-compose.yml) and the backend client configurations to route to port `8880`.

### 3. Bi-directional WebSocket Conversational Pipeline
* **Why We Built It**: To eliminate cascaded HTTP connection handshakes and payload lag, we replaced REST `/start` and `/answer` endpoints with a persistent WebSocket channel:
  `ws://localhost:8000/api/ai-interviews/ws/{session_id}?token=...`
* **Pipelined Streaming Flow**:
  1. The student submits their spoken/typed answer via WebSocket text frame.
  2. The backend launches a non-blocking **asynchronous background task** (`asyncio.create_task`) to evaluate the answer metrics via Groq Llama-3 and log results to Supabase in the background.
  3. In parallel, the backend immediately calls Groq in streaming mode (`stream=True`) to draft the next interviewer question.
  4. As tokens arrive, they are sent as text deltas to the client. The backend buffers tokens until a sentence/clause punctuation is hit.
  5. The backend passes the short sentence to Kokoro, fetches the audio bytes, and pushes the raw MP3 data down the socket as a **binary frame**.
  6. The frontend React room manages a **FIFO sequential audio queue**. It receives the raw binary chunks, decodes them, and plays them sentence-by-sentence.

---

## 🔍 Latency Analysis & Next Steps

Even with streaming enabled, a turnaround lag of **~10 seconds per question** is still observed on CPU. Here is the diagnostic breakdown of why this remains, and a roadmap for future optimization:

### Why the 10-Second Lag Persists
1. **CPU-bound Speech Synthesis Bottleneck**:
   * Running a PyTorch-based text-to-speech model (Kokoro 82M parameters) on a **single CPU core** inside Docker is computationally heavy.
   * As logged by the container:
     `Split completed in 9288.59ms, produced 1 chunks`
     It takes ~9 seconds of raw CPU compute time just to synthesize the audio waves of a 25-word sentence block.
2. **First Sentence Synthesis Wait**:
   * While the frontend plays subsequent sentences seamlessly, the *first* sentence must be synthesized before the speaker starts. If the first sentence is long (e.g. 15-20 words), it still creates an initial 4–6 second wait.

### Roadmap for Next Session
* **Option A: GPU Acceleration**:
  * Pass `--gpus all` to the `kokoro-tts` container configuration if NVIDIA GPU drivers are available on the host machine. GPU synthesis reduces the runtime to under **100ms** (practically instantaneous).
* **Option B: Edge-TTS / Cloud API Fallback**:
  * Fall back to an API-based service (like Google Cloud TTS or ElevenLabs) for live rendering if running on CPU-only hosting environments, saving local compute time.
* **Option C: Clause Chunk-Size Fine-Tuning**:
  * Instruct the backend stream-splitter to break clauses at smaller comma-boundaries rather than waiting for periods, reducing the size of the first speech segment to 3–4 words to trigger immediate playback.
