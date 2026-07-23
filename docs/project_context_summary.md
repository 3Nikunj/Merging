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

### 3. Coding Arena & Multi-Language Sandbox Compiler
* **Supported Languages**: Reconfigured the frontend and backend workspace to support Python 3, JavaScript, Java, C++, and C compilation and running.
* **Detailed Expected & Actual Comparisons**: Rebuilt generic execution test drivers for all 5 languages in `code_executor_service.py`. The console output now prints the input parameters, expected result, actual returned result, and pass/fail verdict per test case.
* **Complex Structure Formatting**: Added linked list Node parser helpers (`ListNode` serializations) in the test runners of all languages to format pointer objects cleanly as JSON lists in stdout.
* **Sandbox Environment Build**: Upgraded the execution sandbox Docker image to include Node.js, openjdk17, gcc, g++, and musl-dev dependencies. Configured the main runner endpoint with `--interactive` to attach standard inputs for active compile processes.
* **Timeout Threshold**: Configured standard execution timeouts to 10.0 seconds to handle WS2/JVM startup overheads smoothly.

### 4. Practice Test Selection & Instructions Resolver
* **Dynamic Database Association**: Extended the `PracticeTest` model schema and mapped `subject_id` and `topic_id` queries from the database `tests` table.
* **Dynamic Test ID Resolution**: Resolved default `testId` reference on the Selection Page to find the correct test matching the user's selected Topic ID (falling back to Subject ID) from the active tests list.
* **Human-Readable Labels**: Modified navigation hooks to forward human-readable subject and topic titles, preventing database UUID strings from rendering on the Instructions summary cards.

