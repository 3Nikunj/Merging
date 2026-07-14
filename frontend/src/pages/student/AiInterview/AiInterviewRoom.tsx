import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../services/api";
import { supabase } from "../../../services/supabase";
import {
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  SkipForward,
  Send,
  Video,
  VideoOff,
} from "lucide-react";

// Inline styles for glowing AI animations
const ANIMATION_STYLES = `
  @keyframes orb-breathe {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 197, 95, 0.4)); }
    50% { transform: scale(1.06); filter: drop-shadow(0 0 35px rgba(255, 197, 95, 0.8)); }
  }
  @keyframes ring-spin-cw {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes ring-spin-ccw {
    0% { transform: rotate(360deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes ripple {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.3); opacity: 0.3; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes scanline {
    0% { top: 0%; }
    100% { top: 100%; }
  }
  .ai-orb-core {
    animation: orb-breathe 4s ease-in-out infinite;
  }
  .ai-ring-outer {
    animation: ring-spin-cw 20s linear infinite;
  }
  .ai-ring-inner {
    animation: ring-spin-ccw 14s linear infinite;
  }
  .ai-ripple-ring {
    animation: ripple 2.5s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
  }
`;

function AiInterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Interface States
  const [interviewerMessage, setInterviewerMessage] = useState("Connecting to recruiter...");
  const [aiState, setAiState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [textModeActive, setTextModeActive] = useState(false);
  const [manualAnswer, setManualAnswer] = useState("");
  
  // Media Devices States
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const speechVolumeIntervalRef = useRef<any>(null);
  const startedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  
  // Live Voice volume indicators
  const [inputVolume, setInputVolume] = useState<number[]>(Array(10).fill(2));
  
  // SpeechRecognition State
  const [liveTranscription, setLiveTranscription] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Initialize Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Request Microphone permission on mount so it's already allowed when user unmutes
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Permission granted! Stop the tracks immediately so we don't hold the microphone open
          stream.getTracks().forEach((track) => track.stop());
          setMicError(null);
        })
        .catch((err) => {
          console.error("Microphone access failed", err);
          setMicError("Microphone access denied. Please click the mic icon in your browser address bar to allow permissions.");
        });
    } else {
      setMicError("Microphone and camera features require a secure context (localhost or HTTPS).");
    }
  }, []);

  // Fetch Session details on load
  useEffect(() => {
    if (sessionId && !startedRef.current) {
      startedRef.current = true;
      startInterviewSession();
    }
    return () => {
      stopSpeechRecognition();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sessionId]);

  // Handle Camera toggles
  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access failed", err);
          setCameraActive(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [cameraActive]);

  const startInterviewSession = async () => {
    try {
      setAiState("thinking");
      
      // Get current auth token
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token || "";
      
      const wsUrl = (api as any).getInterviewWebSocketUrl(sessionId!, token);
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "blob";
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "start" }));
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          const audioUrl = URL.createObjectURL(event.data);
          enqueueAudio(audioUrl);
        } else {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "question") {
              setInterviewerMessage(msg.text);
              setSubmittingAnswer(false);
            } else if (msg.type === "text_delta") {
              setInterviewerMessage((prev) => {
                if (
                  prev === "Connecting to recruiter..." ||
                  prev === "Processing your answer..." ||
                  prev === "Thinking..." ||
                  prev === "Connecting..."
                ) {
                  return msg.text;
                }
                return prev + msg.text;
              });
            } else if (msg.type === "status") {
              setAiState(msg.status);
            } else if (msg.type === "complete") {
              setAiState("idle");
              setInterviewerMessage("Finishing interview and compiling analysis...");
              navigate(`/ai-interview/report/${sessionId}`);
            } else if (msg.type === "error") {
              console.error("WS error message:", msg.message);
              setInterviewerMessage(`Recruiter error: ${msg.message}`);
              setAiState("listening");
            }
          } catch (e) {
            console.error("Failed to parse WS text message:", e);
          }
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
      };

      ws.onclose = (event) => {
        console.info(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
        if (event.code !== 1000) {
          setAiState("listening");
        }
      };

    } catch (e) {
      console.error(e);
      setInterviewerMessage("Failed to start the interview session. Make sure your API key is correctly configured.");
      setAiState("idle");
    }
  };

  const enqueueAudio = (audioUrl: string) => {
    audioQueueRef.current.push(audioUrl);
    if (!isPlayingRef.current) {
      playNextInQueue();
    }
  };

  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setAiState("listening");
      setLiveTranscription("");
      if (micActive && !textModeActive) {
        startSpeechRecognition();
      }
      return;
    }

    isPlayingRef.current = true;
    setAiState("speaking");
    stopSpeechRecognition();

    const nextUrl = audioQueueRef.current.shift()!;
    const audio = new Audio(nextUrl);
    audioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(nextUrl);
      playNextInQueue();
    };

    audio.onerror = (e) => {
      console.error("Audio queue playback error", e);
      URL.revokeObjectURL(nextUrl);
      playNextInQueue();
    };

    audio.play().catch((err) => {
      console.error("Failed to play queue audio", err);
      URL.revokeObjectURL(nextUrl);
      playNextInQueue();
    });
  };

  // Helper to split text into clean sentences
  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Text-To-Speech (TTS) voice trigger with sentence-by-sentence queue streaming
  const speakQuestion = (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (nextAudioRef.current) {
      nextAudioRef.current.pause();
      nextAudioRef.current = null;
    }
    stopSpeechRecognition(); // Stop listening while AI speaks

    const sentences = splitIntoSentences(text);
    if (sentences.length === 0) {
      setAiState("listening");
      setLiveTranscription("");
      if (micActive && !textModeActive) {
        startSpeechRecognition();
      }
      return;
    }

    playSentenceIndex(sentences, 0);
  };

  const playSentenceIndex = (sentences: string[], index: number) => {
    if (index >= sentences.length) {
      setAiState("listening");
      setLiveTranscription("");
      if (micActive && !textModeActive) {
        startSpeechRecognition();
      }
      return;
    }

    setAiState("speaking");
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const audioUrl = `${apiBaseUrl}/api/ai-interviews/${sessionId}/tts?text=${encodeURIComponent(sentences[index])}&t=${Date.now()}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Pre-fetch the next sentence in browser cache while current one plays
    if (index + 1 < sentences.length) {
      const nextAudioUrl = `${apiBaseUrl}/api/ai-interviews/${sessionId}/tts?text=${encodeURIComponent(sentences[index + 1])}&t=${Date.now()}`;
      const nextAudio = new Audio(nextAudioUrl);
      nextAudio.preload = "auto";
      nextAudioRef.current = nextAudio;
    }

    audio.onended = () => {
      playSentenceIndex(sentences, index + 1);
    };

    audio.onerror = (e) => {
      console.error("Sentence TTS playback error", e);
      playSentenceIndex(sentences, index + 1);
    };

    audio.play().catch((err) => {
      console.error("Sentence play failed, falling back to next", err);
      playSentenceIndex(sentences, index + 1);
    });
  };

  // Speech-To-Text (STT) listeners
  const startSpeechRecognition = () => {
    if (recognitionRef.current) return;
    
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => {
      setIsSpeaking(true);
      setMicError(null);
      // Simulate input volume level fluctuations
      speechVolumeIntervalRef.current = setInterval(() => {
        setInputVolume(Array.from({ length: 10 }, () => Math.floor(Math.random() * 28) + 4));
      }, 100);
    };

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join("");
      setLiveTranscription(transcript);
    };

    rec.onend = () => {
      setIsSpeaking(false);
      setInputVolume(Array(10).fill(2));
      if (speechVolumeIntervalRef.current) {
        clearInterval(speechVolumeIntervalRef.current);
      }
      
      // Auto-submit if transcript is meaningful, else restart listening
      setLiveTranscription((current) => {
        if (current.trim().length > 1) {
          // Trigger submission
          submitCandidateAnswer(current);
          return current;
        } else {
          // Restart after short delay if active and mic is on
          setTimeout(() => {
            if (aiState === "listening" && micActive && !textModeActive) {
              startSpeechRecognition();
            }
          }, 300);
          return "";
        }
      });
    };

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error", e);
      // 'no-speech' and 'aborted' are transient silences. We let rec.onend handle restarting.
      if (e.error === "no-speech" || e.error === "aborted") {
        return;
      }
      if (e.error === "not-allowed") {
        setMicError("Microphone access denied. Please click the mic icon in your browser address bar to allow permissions.");
      } else {
        setMicError(`Microphone connection failed: ${e.error}`);
      }
      stopSpeechRecognition();
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeechRecognition = () => {
    if (speechVolumeIntervalRef.current) {
      clearInterval(speechVolumeIntervalRef.current);
    }
    setInputVolume(Array(10).fill(2));
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Submit Answer to backend WebSocket
  const submitCandidateAnswer = (answerText: string) => {
    if (!answerText.trim() || submittingAnswer || !wsRef.current) return;
    
    setSubmittingAnswer(true);
    stopSpeechRecognition();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    setAiState("thinking");
    setInterviewerMessage("Processing your answer...");
    setManualAnswer("");
    setLiveTranscription("");
    setQuestionCount((prev) => prev + 1);

    wsRef.current.send(JSON.stringify({
      type: "answer",
      text: answerText
    }));
  };

  const handleSkipQuestion = async () => {
    if (submittingAnswer) return;
    
    setSubmittingAnswer(true);
    stopSpeechRecognition();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAiState("thinking");
    setInterviewerMessage("Skipping current question...");

    try {
      const action = await api.skipInterviewQuestion(sessionId!);
      setQuestionCount((prev) => prev + 1);

      if (action.status === "completed") {
        navigate(`/ai-interview/report/${sessionId}`);
      } else {
        setInterviewerMessage(action.interviewerMessage);
        speakQuestion(action.interviewerMessage);
        setManualAnswer("");
        setLiveTranscription("");
      }
    } catch (e) {
      console.error(e);
      setAiState("listening");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleEndInterview = async () => {
    if (window.confirm("Are you sure you want to end this interview early? Your scores will be aggregated based on current answers.")) {
      stopSpeechRecognition();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setAiState("thinking");
      setInterviewerMessage("Concluding interview session...");
      try {
        await api.completeInterviewSession(sessionId!);
        navigate(`/ai-interview/report/${sessionId}`);
      } catch (e) {
        console.error(e);
        navigate("/ai-interview");
      }
    }
  };

  const handleRepeatQuestion = () => {
    speakQuestion(interviewerMessage);
  };

  const toggleMic = () => {
    if (micActive) {
      stopSpeechRecognition();
      setMicActive(false);
    } else {
      setMicActive(true);
      if (aiState === "listening" && !textModeActive) {
        startSpeechRecognition();
      }
    }
  };

  // Formatting clock timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f8f9fa] flex flex-col relative overflow-hidden select-none">
      {/* Inject custom visual animations */}
      <style>{ANIMATION_STYLES}</style>

      {/* Futuristic Grid overlay background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,29,58,0.4)_0%,rgba(0,0,0,0.85)_100%)] z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-40" />

      {/* Header bar */}
      <header className="flex h-20 items-center justify-between border-b border-white/5 bg-black/40 px-6 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#FFC55F] animate-ping" />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#FFC55F]">AI Boardroom Room</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-bold text-white/50 block">Question</span>
            <span className="text-sm font-extrabold">{questionCount} of 5</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-white/50 block">Timer</span>
            <span className="text-sm font-extrabold font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </header>

      {/* Main visual panel layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 z-10 overflow-hidden">
        {/* Left side: AI Interviewer Visualization */}
        <section className="rounded-2xl border border-white/5 bg-[#0d1425]/40 backdrop-blur-lg flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-[380px]">
          {/* Subtle scanning horizontal line */}
          <div className="absolute left-0 right-0 h-[1.5px] bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.4)] pointer-events-none z-10" style={{ animation: "scanline 8s linear infinite" }} />
          
          {/* Animated concentric scanning rays */}
          <div className="absolute h-96 w-96 rounded-full border border-white/5 pointer-events-none flex items-center justify-center">
            <div className="h-80 w-80 rounded-full border border-practice-amber/5 ai-ring-outer flex items-center justify-center">
              <div className="h-64 w-64 rounded-full border-2 border-dashed border-cyan-500/10 ai-ring-inner" />
            </div>
          </div>

          {/* Glowing Ripple rings during listening state */}
          {aiState === "listening" && (
            <>
              <div className="absolute h-56 w-56 rounded-full border border-[#FFC55F]/30 bg-[#FFC55F]/5 pointer-events-none ai-ripple-ring" style={{ animationDelay: "0s" }} />
              <div className="absolute h-56 w-56 rounded-full border border-[#FFC55F]/30 bg-[#FFC55F]/5 pointer-events-none ai-ripple-ring" style={{ animationDelay: "0.8s" }} />
              <div className="absolute h-56 w-56 rounded-full border border-[#FFC55F]/30 bg-[#FFC55F]/5 pointer-events-none ai-ripple-ring" style={{ animationDelay: "1.6s" }} />
            </>
          )}

          {/* AI Core Orb Center */}
          <div className="relative z-10 h-44 w-44 rounded-full bg-gradient-to-tr from-[#1b2b4d] to-[#071D3A] border-2 border-white/10 flex items-center justify-center shadow-[inset_0_4px_15px_rgba(255,255,255,0.08)]">
            <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-[#FFC55F] to-[#ffd894] flex items-center justify-center shadow-[0_0_45px_rgba(255,197,95,0.5)] ai-orb-core">
              <div className="h-24 w-24 rounded-full bg-[#070b13] flex flex-col items-center justify-center p-3 text-center border-2 border-[#FFC55F]/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFC55F] animate-pulse">
                  {aiState}
                </span>
              </div>
            </div>
          </div>

          {/* Recruiter Message Box */}
          <div className="mt-8 text-center max-w-lg z-10 px-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 mb-2">Interviewer Agent</h4>
            <p className="text-base font-medium leading-relaxed text-white/90 font-sans tracking-wide">
              "{interviewerMessage}"
            </p>
          </div>
        </section>

        {/* Right side: Candidate camera preview & Voice response log */}
        <section className="flex flex-col gap-6 overflow-hidden">
          {/* Camera preview */}
          <div className="rounded-2xl border border-white/5 bg-[#0d1425]/40 backdrop-blur-lg flex-1 relative overflow-hidden flex items-center justify-center min-h-[220px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover rounded-2xl opacity-65 scale-x-[-1] ${cameraActive ? "" : "hidden"}`}
            />
            {!cameraActive && (
              <div className="flex flex-col items-center gap-2 text-white/30">
                <VideoOff className="h-10 w-10" />
                <span className="text-xs font-semibold">Camera preview is off</span>
              </div>
            )}
            
            {/* Camera Controls overlay */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                type="button"
                onClick={() => setCameraActive((prev) => !prev)}
                className="p-2.5 rounded-lg bg-black/60 hover:bg-black/80 text-white border border-white/10"
              >
                {cameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            </div>

            {/* Bottom voice volume bars overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-3 rounded-xl bg-black/60 border border-white/10 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  {isSpeaking ? "Live Recog Active" : "Recog Idle"}
                </span>
              </div>
              <div className="flex items-center gap-[3px] h-6">
                {inputVolume.map((vol, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${vol}px` }}
                    className="w-[3px] bg-[#FFC55F] rounded-full transition-all duration-75"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Voice transcription / Manual input card */}
          <div className="rounded-2xl border border-white/5 bg-[#0d1425]/40 backdrop-blur-lg p-5 flex flex-col gap-4 shrink-0">
            {textModeActive ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/55">Keyboard Input Mode</span>
                  <button
                    type="button"
                    onClick={() => setTextModeActive(false)}
                    className="text-xs text-[#FFC55F] font-bold hover:underline"
                  >
                    Switch to Voice Mic
                  </button>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={manualAnswer}
                    onChange={(e) => setManualAnswer(e.target.value)}
                    placeholder="Type your complete answer here..."
                    className="flex-1 rounded-xl border border-white/10 bg-[#070b13] px-4 py-3 text-xs outline-none focus:border-[#FFC55F] text-[#f8f9fa] resize-none"
                  />
                  <button
                    type="button"
                    disabled={submittingAnswer || !manualAnswer.trim()}
                    onClick={() => submitCandidateAnswer(manualAnswer)}
                    className="rounded-xl bg-[#FFC55F] hover:bg-[#ffe3af] text-[#070b13] px-4 flex items-center justify-center disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${micError ? "text-red-400" : "text-white/55"}`}>
                    {micError ? "Microphone Error" : "Live Transcript preview"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeechRecognition();
                      setTextModeActive(true);
                    }}
                    className="text-xs text-[#FFC55F] font-bold hover:underline"
                  >
                    Type Answer Instead
                  </button>
                </div>
                <div className="flex gap-2 items-stretch">
                  <div className={`flex-1 min-h-[50px] rounded-xl border px-4 py-3 font-mono text-xs max-h-[80px] overflow-y-auto custom-scrollbar leading-relaxed ${micError ? "border-red-500/30 bg-red-950/20 text-red-300" : "border-white/10 bg-[#070b13]/60 text-white/70 italic"}`}>
                    {micError || liveTranscription || "Answer will appear here in real time as you speak. Speak clearly..."}
                  </div>
                  {liveTranscription.trim().length > 0 && !micError && (
                    <button
                      type="button"
                      disabled={submittingAnswer}
                      onClick={() => submitCandidateAnswer(liveTranscription)}
                      className="rounded-xl bg-[#FFC55F] hover:bg-[#ffe3af] text-[#070b13] px-4 flex items-center justify-center transition shrink-0 self-stretch"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Control Actions bar */}
      <footer className="h-24 border-t border-white/5 bg-black/40 px-6 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        <button
          type="button"
          onClick={handleEndInterview}
          className="rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-500 px-5 py-3 text-xs font-bold transition flex items-center gap-2"
        >
          <PhoneOff className="h-4 w-4" />
          End Session
        </button>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={toggleMic}
            className={[
              "p-4 rounded-full border transition flex items-center justify-center",
              micActive
                ? "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                : "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-500",
            ].join(" ")}
          >
            {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          
          <button
            type="button"
            onClick={handleRepeatQuestion}
            className="p-4 rounded-full border bg-white/10 hover:bg-white/20 border-white/10 text-white transition flex items-center justify-center"
            title="Repeat Question"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkipQuestion}
            disabled={submittingAnswer}
            className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white px-5 py-3 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            Skip Question
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default AiInterviewRoom;
