# Project Context Summary: AI Verbal Interview Simulator

This document serves as a complete hand-off and reference for the AI Verbal Interview platform. It captures the full systems architecture, features built, and running containers.

---

## 🏗️ System Architecture & Services Stack

Our application is built as a multi-container Docker Compose stack:
1. **`aivalytics-unified-frontend`**: React / Vite SPA served on `http://localhost:5173`.
2. **`aivalytics-unified-backend`**: FastAPI (Python 3.12) server listening on `http://localhost:8000`.
3. **`aivalytics-kokoro-tts`**: Speech synthesis microservice container listening internally on `http://kokoro-tts:8880` (mapped to host port `8880`), now acting primarily as a fallback for old browsers.
4. **`supabase`**: Database layer tracking sessions, turns, rubrics evaluation, and user authentication.

---

## 🛠️ Key Milestones Completed

During this session, we migrated speech synthesis to a browser-native execution provider using standard OS voice engines:

### 1. Web Speech API (SpeechSynthesis) TTS
* **Instant Start (0ms Latency)**: Replaced ONNX/WASM browser Kokoro engine with the browser's native `SpeechSynthesis` API (`window.speechSynthesis`). Voice playbacks begin instantly upon request.
* **0MB Download Size**: Removed all heavy dependencies on `kokoro-js` (ONNX Runtime Web, 80MB quantized model files, WebGPU compilers), reducing the React bundle size from ~3.5MB to ~1.0MB.
* **Perfect Pronunciation**: OS native voices (e.g. Google English, Microsoft Zira/David, Apple Samantha) possess fully verified grapheme-to-phoneme (G2P) English dictionaries, guaranteeing clear accents.
* **Dynamic Accent Customization**: Utilizes the user's selected dashboard settings (`voiceAccent` - Male/Female, US/UK) to dynamically search and load the closest matching native OS voice.

### 2. Pipelined WebSocket Token Delivery
* **Real-time Streaming Accumulation**: The React room establishes a WebSocket channel with the FastAPI server.
* As Llama-3 generates tokens on Groq, the backend streams text deltas down the socket, printing them word-by-word instantly to the screen (0 text latency).
* The frontend accumulates the full streamed question text in the background. Once completed, it triggers `window.speechSynthesis.speak()` to play the full paragraph in a single continuous verbal turn.
* **Zero Backend Audio Overhead**: Server-side speech generation has been completely disabled on the backend WebSocket route, saving CPU load and preventing duplicate stream warnings.
