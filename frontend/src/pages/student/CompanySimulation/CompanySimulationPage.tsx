import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Play,
  CheckCircle,
  Clock,
  Gamepad2,
  BookOpen,
  UserCheck,
  PenTool,
  Trophy,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Mic,
  HelpCircle,
} from "lucide-react";
import AppLayout from "../../../components/student/layout/AppLayout";
import { api } from "../../../services/api";

interface Round {
  id: string;
  name: string;
  type: "aptitude" | "pseudocode" | "essay" | "technical_interview" | "hr_interview" | "communication" | "puzzle" | "cognitive";
  description: string;
  durationMinutes: number;
}

interface Company {
  id: string;
  name: string;
  logo: string;
  color: string;
  accentColor: string;
  package: string;
  difficulty: "Medium" | "Hard" | "Easy";
  description: string;
  rounds: Round[];
}

const COMPANIES: Company[] = [
  {
    id: "capgemini",
    name: "Capgemini",
    logo: "CG",
    color: "bg-[#0070ad]",
    accentColor: "border-[#0070ad] hover:bg-[#0070ad]/10 text-[#0070ad]",
    package: "4.25 LPA - 7.5 LPA",
    difficulty: "Medium",
    description: "Capgemini placement drives assess multi-dimensional skills including logical aptitude, debugging, and behavioral fit.",
    rounds: [
      {
        id: "cg_apt",
        name: "Game-Based Aptitude",
        type: "aptitude",
        description: "Interactive cognitive ability puzzles assessing working memory and spatial awareness.",
        durationMinutes: 15,
      },
      {
        id: "cg_pseudo",
        name: "Pseudocode & Logic",
        type: "pseudocode",
        description: "Evaluates algorithm understanding, basic syntax prediction, and logical constructs.",
        durationMinutes: 20,
      },
      {
        id: "cg_essay",
        name: "Timed Essay Writing",
        type: "essay",
        description: "Assesses structure, vocabulary, grammar, and coherent presentation of tech topics.",
        durationMinutes: 10,
      },
      {
        id: "cg_tech",
        name: "Technical AI Interview",
        type: "technical_interview",
        description: "Real-time AI voice conversation covering core computer science subjects, algorithms, and projects.",
        durationMinutes: 20,
      },
      {
        id: "cg_hr",
        name: "HR AI Interview",
        type: "hr_interview",
        description: "Assesses behavioral traits, interpersonal skills, and organizational fit.",
        durationMinutes: 15,
      },
    ],
  },
  {
    id: "tcs",
    name: "TCS (Ninja/Digital)",
    logo: "TCS",
    color: "bg-[#183060]",
    accentColor: "border-[#183060] hover:bg-[#183060]/10 text-[#183060]",
    package: "3.36 LPA - 7.0 LPA",
    difficulty: "Hard",
    description: "Tata Consultancy Services NQT evaluates fundamental coding, verbal capability, and numerical agility.",
    rounds: [
      {
        id: "tcs_written",
        name: "NQT Written Simulation",
        type: "aptitude",
        description: "Covers verbal ability, logical reasoning, and quantitative numerical capability.",
        durationMinutes: 30,
      },
      {
        id: "tcs_tech",
        name: "Technical AI Interview",
        type: "technical_interview",
        description: "Live evaluation of C/C++, Java, OOPs concepts, SQL queries, and project architecture.",
        durationMinutes: 20,
      },
      {
        id: "tcs_hr",
        name: "HR AI Interview",
        type: "hr_interview",
        description: "Assesses communication skills, willingness to relocate, and career goals.",
        durationMinutes: 15,
      },
    ],
  },
  {
    id: "accenture",
    name: "Accenture",
    logo: "AC",
    color: "bg-[#a100ff]",
    accentColor: "border-[#a100ff] hover:bg-[#a100ff]/10 text-[#a100ff]",
    package: "4.5 LPA - 6.5 LPA",
    difficulty: "Medium",
    description: "Accenture Cognitive & Technical assessment evaluates cognitive reasoning, coding fundamentals, MS Office, and communication proficiency.",
    rounds: [
      {
        id: "ac_cog",
        name: "Cognitive & Technical MCQ",
        type: "cognitive",
        description: "Evaluates MS Office applications, cloud computing fundamentals, and logic flow.",
        durationMinutes: 45,
      },
      {
        id: "ac_comm",
        name: "Communication Assessment",
        type: "communication",
        description: "Timed reading, speaking, and vocabulary matching to gauge accent, speed, and sentence syntax.",
        durationMinutes: 20,
      },
      {
        id: "ac_tech",
        name: "Technical AI Interview",
        type: "technical_interview",
        description: "Live interactive verbal conversation regarding projects, OOPs, DBMS, and core IT concepts.",
        durationMinutes: 20,
      },
      {
        id: "ac_hr",
        name: "HR AI Interview",
        type: "hr_interview",
        description: "Focuses on adaptability, client management, integrity, and corporate ethics.",
        durationMinutes: 15,
      },
    ],
  },
  {
    id: "infosys",
    name: "Infosys",
    logo: "INFY",
    color: "bg-[#007cc3]",
    accentColor: "border-[#007cc3] hover:bg-[#007cc3]/10 text-[#007cc3]",
    package: "3.6 LPA - 9.5 LPA",
    difficulty: "Hard",
    description: "Infosys recruitment drive assesses analytical capabilities, critical puzzle-solving, and algorithmic pseudocode.",
    rounds: [
      {
        id: "infy_puzzle",
        name: "Mathematical & Reasoning Puzzles",
        type: "puzzle",
        description: "Complex logic sequences, mathematical grids, and reasoning capability assessments.",
        durationMinutes: 25,
      },
      {
        id: "infy_pseudo",
        name: "Pseudocode & Compiler Logic",
        type: "pseudocode",
        description: "Requires dry-running nested loops, memory operations, and recursions.",
        durationMinutes: 30,
      },
      {
        id: "infy_tech",
        name: "Technical AI Interview",
        type: "technical_interview",
        description: "Conversational assessment covering DSA concepts, data structures, SQL joins, and coding problems.",
        durationMinutes: 20,
      },
      {
        id: "infy_hr",
        name: "HR AI Interview",
        type: "hr_interview",
        description: "Assesses candidate adaptability, career expectations, and cultural alignment.",
        durationMinutes: 15,
      },
    ],
  },
];

interface SimulationQuestion {
  code: string;
  options: string[];
  correct: string;
  explanation: string;
}

export default function CompanySimulationPage() {
  const navigate = useNavigate();
  const [dbQuestions, setDbQuestions] = useState<SimulationQuestion[] | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company>(COMPANIES[0]);
  const [activeSimulatorRound, setActiveSimulatorRound] = useState<Round | null>(null);
  
  // Simulator State
  const [simLoading, setSimLoading] = useState(false);
  const [simStep, setSimStep] = useState<"intro" | "playing" | "result">("intro");
  const [simScore, setSimScore] = useState(0);
  
  // 1. Memory Game State (Capgemini Aptitude)
  const [gameGrid, setGameGrid] = useState<boolean[]>(Array(9).fill(false));
  const [gamePattern, setGamePattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<string>("Click Start to begin pattern flash");
  const [roundNum, setRoundNum] = useState(1);
  const [flashing, setFlashing] = useState(false);

  // 2. MCQ Question Index
  const [mcqIndex, setMcqIndex] = useState(0);
  const [selectedMcqAnswer, setSelectedMcqAnswer] = useState<string | null>(null);
  const [, setMcqResults] = useState<{ [key: number]: boolean }>({});

  // 3. Timed Essay
  const [essayText, setEssayText] = useState("");
  const [essayTimer, setEssayTimer] = useState(180); 
  const [essayCompleted, setEssayCompleted] = useState(false);

  // 4. Timed Communication (Mic Recording Simulation)
  const [commRecording, setCommRecording] = useState(false);
  const [commTimer, setCommTimer] = useState(15);
  const [commResults, setCommResults] = useState<any>(null);

  // Custom Corporate Mock Pools
  const PSEUDOCODE_QUESTIONS = [
    {
      code: `integer a = 3, b = 5, c = 2
c = (a & b) + (b | a)
print c + a`,
      options: ["10", "13", "8", "11"],
      correct: "11",
      explanation: "3 & 5 is 1. 5 | 3 is 7. Sum c = 1 + 7 = 8. Printing c + a evaluates to 8 + 3 = 11.",
    },
    {
      code: `function solve(val) {
  if (val <= 1) return 1
  return val * solve(val - 2)
}
print solve(5)`,
      options: ["120", "15", "24", "60"],
      correct: "15",
      explanation: "solve(5) evaluates to 5 * solve(3) -> 5 * 3 * solve(1) -> 5 * 3 * 1 = 15.",
    },
    {
      code: `integer i, sum = 0
for (i = 1; i <= 5; i++) {
  if (i % 2 == 0) continue
  sum = sum + i
}
print sum`,
      options: ["15", "6", "9", "12"],
      correct: "9",
      explanation: "Sum of odd numbers between 1 and 5: 1 + 3 + 5 = 9.",
    },
  ];

  const TCS_NQT_QUESTIONS = [
    {
      code: "A train running at 54 km/hr crosses a post in 20 seconds. What is the length of the train in meters?",
      options: ["300m", "150m", "250m", "400m"],
      correct: "300m",
      explanation: "Speed in m/s = 54 * (5/18) = 15 m/s. Length = Speed * Time = 15 * 20 = 300m.",
    },
    {
      code: "If 15% of x is equal to 20% of y, then x:y is:",
      options: ["4:3", "3:4", "15:20", "20:15"],
      correct: "4:3",
      explanation: "0.15x = 0.20y => x/y = 0.20/0.15 = 4/3 => 4:3.",
    },
    {
      code: "Choose the correct antonym of the word: 'METICULOUS'",
      options: ["Careful", "Messy", "Sloppy", "Precise"],
      correct: "Sloppy",
      explanation: "Meticulous means showing great attention to detail. Sloppy is the opposite (careless).",
    },
  ];

  const ACCENTURE_COGNITIVE_QUESTIONS = [
    {
      code: "Which of the following is NOT a feature of MS Word?",
      options: ["Mail Merge", "Macro recording", "Data compilation via pivot charts", "Track Changes"],
      correct: "Data compilation via pivot charts",
      explanation: "Pivot charts are a characteristic feature of Microsoft Excel, not Microsoft Word.",
    },
    {
      code: "What is the primary function of a Cloud Service Delivery Manager?",
      options: ["Writing database queries", "Managing cloud infrastructure delivery metrics", "Designing silicon chips", "Debugging JavaScript code"],
      correct: "Managing cloud infrastructure delivery metrics",
      explanation: "Service Delivery Managers handle SLAs, deployment timelines, and delivery metrics for cloud services.",
    },
    {
      code: "In MS Excel, which formula evaluates the count of non-empty cells in a range?",
      options: ["COUNT", "COUNTA", "COUNTIF", "COUNTBLANK"],
      correct: "COUNTA",
      explanation: "COUNTA counts the number of cells that are not empty in a range, while COUNT only counts numeric cells.",
    },
  ];

  const INFOSYS_PUZZLE_QUESTIONS = [
    {
      code: "Find the missing number in the sequence: 2, 6, 12, 20, 30, ?",
      options: ["40", "42", "45", "38"],
      correct: "42",
      explanation: "The sequence is generated by n^2 + n or adding consecutive even numbers: +4, +6, +8, +10, +12. 30 + 12 = 42.",
    },
    {
      code: "A clock shows 4:30. What is the angle between the hour and minute hands?",
      options: ["45 degrees", "60 degrees", "30 degrees", "75 degrees"],
      correct: "45 degrees",
      explanation: "Angle = |30H - 5.5M| = |30(4) - 5.5(30)| = |120 - 165| = 45 degrees.",
    },
    {
      code: "A father is twice as old as his son. 10 years ago he was three times as old. How old is the father now?",
      options: ["30", "40", "50", "60"],
      correct: "40",
      explanation: "F = 2S. F-10 = 3(S-10) => 2S-10 = 3S-30 => S = 20. F = 2S = 40.",
    },
  ];

  const currentQuestionsPool = 
    (dbQuestions && dbQuestions.length > 0) ? dbQuestions :
    activeSimulatorRound?.type === "pseudocode" ? PSEUDOCODE_QUESTIONS :
    activeSimulatorRound?.type === "cognitive" ? ACCENTURE_COGNITIVE_QUESTIONS :
    activeSimulatorRound?.type === "puzzle" ? INFOSYS_PUZZLE_QUESTIONS : TCS_NQT_QUESTIONS;

  const startSimulation = async (round: Round) => {
    setActiveSimulatorRound(round);
    setSimStep("intro");
    setEssayText("");
    setEssayTimer(180);
    setEssayCompleted(false);
    setMcqIndex(0);
    setSelectedMcqAnswer(null);
    setMcqResults({});
    setRoundNum(1);
    setSimScore(0);
    setUserPattern([]);
    setCommRecording(false);
    setCommTimer(15);
    setCommResults(null);
    setDbQuestions(null);

    const mcqTypes = ["pseudocode", "cognitive", "puzzle", "aptitude"];
    if (mcqTypes.includes(round.type) && !(round.type === "aptitude" && selectedCompany.id === "capgemini")) {
      setSimLoading(true);
      try {
        const res = await api.getCompanySimulationQuestions(selectedCompany.id, round.type);
        if (res.questions && res.questions.length > 0) {
          const mapped = res.questions.map((q: any) => {
            const correctOption = q.question_options?.find((o: any) => o.is_correct);
            return {
              code: q.prompt,
              options: q.question_options?.map((o: any) => o.option_text) || [],
              correct: correctOption ? correctOption.option_text : "",
              explanation: q.metadata?.explanation || "No explanation provided."
            };
          });
          setDbQuestions(mapped);
        }
      } catch (error) {
        console.error("Failed to load company simulation questions:", error);
      } finally {
        setSimLoading(false);
      }
    }
  };

  // Memory grid logic (Capgemini Aptitude)
  const startMemoryGameRound = () => {
    setUserPattern([]);
    setFlashing(true);
    setGameStatus("Watch the flashing sequence...");
    const newPattern: number[] = [];
    const length = 2 + roundNum; 
    for (let i = 0; i < length; i++) {
      newPattern.push(Math.floor(Math.random() * 9));
    }
    setGamePattern(newPattern);
    
    let step = 0;
    const interval = setInterval(() => {
      if (step < newPattern.length) {
        const gridIndex = newPattern[step];
        setGameGrid((prev) => {
          const next = [...prev];
          next[gridIndex] = true;
          return next;
        });
        setTimeout(() => {
          setGameGrid(Array(9).fill(false));
        }, 500);
        step++;
      } else {
        clearInterval(interval);
        setFlashing(false);
        setGameStatus("Your turn! Repeat the pattern in order.");
      }
    }, 850);
  };

  const handleGridClick = (index: number) => {
    if (flashing || simStep !== "playing") return;
    const newUserPattern = [...userPattern, index];
    setUserPattern(newUserPattern);

    setGameGrid((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setTimeout(() => {
      setGameGrid(Array(9).fill(false));
    }, 250);

    const patternStep = newUserPattern.length - 1;
    if (index !== gamePattern[patternStep]) {
      setGameStatus("❌ Wrong pattern! Game Over.");
      setTimeout(() => {
        setSimStep("result");
      }, 1000);
      return;
    }

    if (newUserPattern.length === gamePattern.length) {
      if (roundNum >= 3) {
        setGameStatus("🏆 Congratulations! All rounds passed!");
        setSimScore(100);
        setTimeout(() => {
          setSimStep("result");
        }, 1000);
      } else {
        setGameStatus("✅ Perfect! Advancing to next round.");
        setRoundNum((prev) => prev + 1);
      }
    }
  };

  // Timed Essay Logic
  useEffect(() => {
    let timer: number;
    if (activeSimulatorRound?.type === "essay" && simStep === "playing" && essayTimer > 0) {
      timer = window.setInterval(() => {
        setEssayTimer((prev) => prev - 1);
      }, 1000);
    } else if (essayTimer === 0 && !essayCompleted) {
      submitEssay();
    }
    return () => clearInterval(timer);
  }, [essayTimer, simStep, activeSimulatorRound]);

  const submitEssay = () => {
    setEssayCompleted(true);
    const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
    let score = 30;
    if (wordCount >= 100) score += 30;
    if (essayText.includes("\n")) score += 20; 
    if (essayText.length > 300) score += 20;
    setSimScore(score);
    setSimStep("result");
  };

  // Timed Communication Logic
  useEffect(() => {
    let timer: number;
    if (activeSimulatorRound?.type === "communication" && simStep === "playing" && commRecording && commTimer > 0) {
      timer = window.setInterval(() => {
        setCommTimer((prev) => prev - 1);
      }, 1000);
    } else if (commTimer === 0 && commRecording) {
      finishCommRecording();
    }
    return () => clearInterval(timer);
  }, [commTimer, commRecording, simStep, activeSimulatorRound]);

  const startCommRecording = () => {
    setCommRecording(true);
    setCommTimer(15);
    setCommResults(null);
  };

  const finishCommRecording = () => {
    setCommRecording(false);
    setCommResults({
      fluency: 92,
      pronunciation: 88,
      syntax: 100,
    });
    setSimScore(93);
    setSimStep("result");
  };

  // MCQ selections
  const submitMcqAnswer = (ans: string) => {
    setSelectedMcqAnswer(ans);
    const isCorrect = ans === currentQuestionsPool[mcqIndex].correct;
    setMcqResults((prev) => ({ ...prev, [mcqIndex]: isCorrect }));
    if (isCorrect) {
      setSimScore((prev) => prev + Math.round(100 / currentQuestionsPool.length));
    }
  };

  const nextMcq = () => {
    setSelectedMcqAnswer(null);
    if (mcqIndex + 1 < currentQuestionsPool.length) {
      setMcqIndex((prev) => prev + 1);
    } else {
      setSimStep("result");
    }
  };

  const launchAiInterview = async (round: Round) => {
    setSimLoading(true);
    try {
      const session = await api.createInterviewSession({
        mode: "jd_based",
        company: selectedCompany.name,
        position: round.name,
        experience_level: "Entry Level",
        interview_type: round.type === "technical_interview" ? "technical" : "behavioral",
        difficulty: "medium",
        jd_text: `Hiring Drive for ${selectedCompany.name} - ${round.name}. Core competencies required for placement.`,
        resume_text: "Enthusiastic CS student preparing for recruitment drives.",
      });
      navigate(`/ai-interview/live/${session.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to initialize AI Interview Session. Please make sure the backend is active.");
    } finally {
      setSimLoading(false);
    }
  };

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  // Brand vector logos helper
  const getCompanyLogo = (companyId: string) => {
    switch (companyId) {
      case "capgemini":
        return (
          <svg className="h-8 w-8 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        );
      case "tcs":
        return (
          <svg className="h-8 w-8 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
          </svg>
        );
      case "accenture":
        return (
          <svg className="h-8 w-8 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4l12 8-12 8V4z" />
          </svg>
        );
      case "infosys":
        return (
          <svg className="h-8 w-8 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.66 0 3 1.34 3 3v1.9l2.9 2.59z" />
          </svg>
        );
      default:
        return <Building2 className="h-8 w-8 text-white" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-lg border border-white/5">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-practice-amber/20 px-3 py-1 text-xs font-bold text-practice-amber">
                <Sparkles className="h-3.5 w-3.5" /> Simulation Lab
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight">Company Recruitment Simulator</h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Experience full-scale placement drives of leading recruiters. Play game aptitude rounds, solve custom pseudocode, submit essay outlines, and practice live conversational AI interviews.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 self-start md:self-auto">
              <Building2 className="h-10 w-10 text-practice-amber" />
              <div>
                <p className="text-xs uppercase font-extrabold text-white/50 tracking-wider">Visiting Drives</p>
                <p className="text-2xl font-black text-white">Active Labs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-lg font-black text-practice-ink uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-5 w-5 text-practice-subdued" /> Select Company
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {COMPANIES.map((company) => {
                const isSelected = selectedCompany.id === company.id;
                return (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={[
                      "w-full text-left rounded-xl border p-5 transition duration-300 relative overflow-hidden group shadow-dashboard",
                      isSelected
                        ? "border-practice-amber bg-white ring-2 ring-practice-amber"
                        : "border-practice-line bg-white hover:border-practice-amber/40 hover:shadow-lg",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-4">
                      <div className={["flex h-12 w-12 items-center justify-center rounded-lg text-white", company.color].join(" ")}>
                        {getCompanyLogo(company.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-practice-ink truncate group-hover:text-practice-amber transition">{company.name}</h3>
                          <span className={[
                            "text-[10px] font-extrabold px-2 py-0.5 rounded-full",
                            company.difficulty === "Hard" ? "bg-red-100 text-red-700" : "bg-practice-amber/20 text-practice-amberDark"
                          ].join(" ")}>
                            {company.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-practice-subdued mt-1 flex items-center gap-1 font-semibold">
                          <Trophy className="h-3 w-3 text-practice-amberDark" /> Package: {company.package}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-practice-line rounded-2xl p-6 shadow-dashboard space-y-6">
            <div>
              <h2 className="text-2xl font-black text-practice-ink">Hiring Workflow: {selectedCompany.name}</h2>
              <p className="text-sm text-practice-subdued mt-1">{selectedCompany.description}</p>
            </div>

            <div className="relative pl-8 border-l-2 border-practice-line space-y-8 py-2">
              {selectedCompany.rounds.map((round, idx) => {
                const getRoundIcon = (type: string) => {
                  switch (type) {
                    case "aptitude": return <Gamepad2 className="h-5 w-5 text-indigo-500" />;
                    case "pseudocode": return <BookOpen className="h-5 w-5 text-emerald-500" />;
                    case "essay": return <PenTool className="h-5 w-5 text-amber-500" />;
                    case "cognitive": return <HelpCircle className="h-5 w-5 text-indigo-500" />;
                    case "communication": return <Mic className="h-5 w-5 text-purple-500" />;
                    case "puzzle": return <Trophy className="h-5 w-5 text-amber-500" />;
                    case "technical_interview": return <Sparkles className="h-5 w-5 text-rose-500" />;
                    case "hr_interview": return <UserCheck className="h-5 w-5 text-sky-500" />;
                    default: return <HelpCircle className="h-5 w-5 text-slate-500" />;
                  }
                };

                return (
                  <div key={round.id} className="relative group">
                    <div className="absolute -left-[45px] top-1 flex h-8 w-8 items-center justify-center rounded-full border border-practice-line bg-white shadow transition-all duration-300 group-hover:border-practice-amber group-hover:scale-110">
                      {getRoundIcon(round.type)}
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-practice-background rounded-xl p-5 border border-practice-line/60 hover:border-practice-amber/40 transition duration-300 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-extrabold tracking-wider text-practice-amberDark">Round {idx + 1}</span>
                          <span className="text-xs text-practice-subdued flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {round.durationMinutes} min
                          </span>
                        </div>
                        <h4 className="text-lg font-extrabold text-practice-ink">{round.name}</h4>
                        <p className="text-sm text-practice-subdued max-w-xl">{round.description}</p>
                      </div>

                      <div>
                        {round.type.includes("interview") ? (
                          <button
                            onClick={() => launchAiInterview(round)}
                            disabled={simLoading}
                            className="w-full md:w-auto inline-flex items-center gap-2 rounded-lg bg-practice-sidebar hover:bg-practice-sidebarActive text-white px-5 py-3 text-sm font-extrabold shadow-md transition disabled:opacity-50"
                          >
                            {simLoading ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" /> Launching...
                              </>
                            ) : (
                              <>
                                Simulate <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => startSimulation(round)}
                            className="w-full md:w-auto inline-flex items-center gap-2 rounded-lg border border-practice-ink hover:bg-practice-ink hover:text-white text-practice-ink px-5 py-3 text-sm font-extrabold transition shadow-sm"
                          >
                            Simulate <Play className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {activeSimulatorRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-practice-line overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-practice-sidebar text-white p-5 flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60 font-extrabold">Simulating Drive Round</p>
                <h3 className="text-xl font-black">{activeSimulatorRound.name}</h3>
              </div>
              <button
                onClick={() => setActiveSimulatorRound(null)}
                className="text-white/70 hover:text-white font-extrabold text-sm border border-white/20 rounded-lg px-3 py-1 hover:bg-white/10 transition"
              >
                Exit Sim
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-practice-background">
              {simLoading ? (
                <div className="space-y-4 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto" />
                  <p className="text-sm font-semibold text-practice-subdued">Fetching drive simulation questions...</p>
                </div>
              ) : (
                <>
                  {simStep === "intro" && (
                <div className="space-y-6 text-center py-6">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-practice-amber/20 text-practice-amberDark">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-practice-ink">Are you ready to test?</h4>
                    <p className="text-sm text-practice-subdued max-w-md mx-auto">
                      This active sandbox is configured with authentic round parameters for {selectedCompany.name}. It should take around {activeSimulatorRound.durationMinutes} minutes under live conditions.
                    </p>
                  </div>

                  <div className="border border-practice-line bg-white rounded-xl p-4 max-w-sm mx-auto text-left space-y-2 text-xs font-semibold text-practice-subdued">
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Dynamic Scoring active</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Interactive evaluation</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Do not close browser during testing</p>
                  </div>

                  <button
                    onClick={() => {
                      setSimStep("playing");
                      if (activeSimulatorRound.type === "aptitude" && selectedCompany.id === "capgemini") {
                        startMemoryGameRound();
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-practice-sidebar hover:bg-practice-sidebarActive text-white px-8 py-3.5 text-sm font-extrabold shadow-md transition"
                  >
                    Start Simulation <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {simStep === "playing" && (
                <div>
                  {activeSimulatorRound.type === "aptitude" && selectedCompany.id === "capgemini" && (
                    <div className="space-y-6 text-center py-4">
                      <div className="flex justify-between items-center bg-white border border-practice-line rounded-lg p-3 px-4 shadow-sm">
                        <span className="text-sm font-extrabold text-practice-ink">Level: {roundNum} / 3</span>
                        <span className="text-xs uppercase font-extrabold tracking-wider bg-practice-amber/20 text-practice-amberDark px-2 py-0.5 rounded">
                          {gameStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                        {gameGrid.map((isActive, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleGridClick(idx)}
                            disabled={flashing}
                            className={[
                              "aspect-square rounded-xl transition duration-300 text-transparent font-bold flex items-center justify-center",
                              isActive
                                ? "bg-practice-amberDark scale-95 shadow"
                                : "bg-white border-2 border-practice-line hover:border-practice-amber/50 hover:shadow-md cursor-pointer",
                              flashing ? "cursor-not-allowed" : ""
                            ].join(" ")}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>

                      {gamePattern.length === 0 && !flashing && (
                        <button
                          onClick={startMemoryGameRound}
                          className="rounded-lg bg-indigo-600 text-white px-6 py-2.5 text-sm font-extrabold transition hover:bg-indigo-700"
                        >
                          Flash Pattern
                        </button>
                      )}
                    </div>
                  )}

                  {(activeSimulatorRound.type === "pseudocode" || 
                    activeSimulatorRound.type === "cognitive" || 
                    activeSimulatorRound.type === "puzzle" ||
                    (activeSimulatorRound.type === "aptitude" && selectedCompany.id !== "capgemini")) && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center text-sm font-semibold text-practice-subdued">
                        <span>Question {mcqIndex + 1} of {currentQuestionsPool.length}</span>
                        <span>Current Score: {simScore}%</span>
                      </div>

                      <div className="bg-white border border-practice-line rounded-xl p-5 shadow-sm space-y-4">
                        {activeSimulatorRound.type === "pseudocode" ? (
                          <pre className="bg-slate-950 text-emerald-400 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap border border-white/5">
                            {currentQuestionsPool[mcqIndex].code}
                          </pre>
                        ) : (
                          <p className="text-lg font-extrabold text-practice-ink leading-relaxed">
                            {currentQuestionsPool[mcqIndex].code}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {currentQuestionsPool[mcqIndex].options.map((opt: string) => {
                          const isCorrect = opt === currentQuestionsPool[mcqIndex].correct;
                          const isSelected = selectedMcqAnswer === opt;
                          
                          let btnClass = "border-practice-line bg-white hover:border-practice-amber/50 hover:bg-practice-background";
                          if (selectedMcqAnswer) {
                            if (isSelected) {
                              btnClass = isCorrect ? "border-emerald-500 bg-emerald-100/40 text-emerald-800 animate-pulse" : "border-red-500 bg-red-100/40 text-red-800";
                            } else if (isCorrect) {
                              btnClass = "border-emerald-500 bg-emerald-100/40 text-emerald-800";
                            } else {
                              btnClass = "border-practice-line bg-white opacity-60 cursor-not-allowed";
                            }
                          }

                          return (
                            <button
                              key={opt}
                              onClick={() => !selectedMcqAnswer && submitMcqAnswer(opt)}
                              disabled={!!selectedMcqAnswer}
                              className={["w-full text-left p-4 rounded-xl border text-sm font-extrabold transition duration-300 flex items-center justify-between", btnClass].join(" ")}
                            >
                              <span>{opt}</span>
                              {selectedMcqAnswer && isSelected && (
                                <span className="text-xs uppercase font-extrabold">
                                  {isCorrect ? "Correct ✓" : "Incorrect ✗"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {selectedMcqAnswer && (
                        <div className="bg-white border border-practice-line rounded-xl p-4 space-y-2">
                          <p className="text-xs font-black uppercase text-practice-amberDark tracking-wider">Evaluation / Explanation</p>
                          <p className="text-sm text-practice-subdued">{currentQuestionsPool[mcqIndex].explanation}</p>
                          <button
                            onClick={nextMcq}
                            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-practice-sidebar hover:bg-practice-sidebarActive text-white px-5 py-2 text-xs font-bold transition"
                          >
                            Next Question <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSimulatorRound.type === "essay" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center bg-white border border-practice-line rounded-lg p-3 px-4 shadow-sm text-sm font-extrabold text-practice-ink">
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-practice-amber" /> Time: {formatTime(essayTimer)}</span>
                        <span>Words: {essayText.trim().split(/\s+/).filter(Boolean).length}</span>
                      </div>

                      <div className="bg-white border border-practice-line rounded-xl p-5 shadow-sm space-y-3">
                        <h4 className="text-sm font-black uppercase text-practice-amberDark tracking-wider">Essay Topic</h4>
                        <p className="text-lg font-extrabold text-practice-ink leading-relaxed">
                          "The impact of Generative AI on student curriculum and modern learning methodologies."
                        </p>
                      </div>

                      <textarea
                        value={essayText}
                        onChange={(e) => setEssayText(e.target.value)}
                        placeholder="Write your essay outline or essay paragraphs here..."
                        rows={8}
                        className="w-full p-4 rounded-xl border border-practice-line bg-white focus:ring-1 focus:ring-practice-amberDark focus:border-practice-amberDark outline-none text-sm transition leading-relaxed"
                      />

                      <button
                        onClick={submitEssay}
                        disabled={essayText.trim().length === 0}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-practice-sidebar hover:bg-practice-sidebarActive text-white px-5 py-3 text-sm font-extrabold transition shadow-md disabled:opacity-50"
                      >
                        Submit Essay <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {activeSimulatorRound.type === "communication" && (
                    <div className="space-y-6 text-center">
                      <div className="bg-white border border-practice-line rounded-xl p-5 shadow-sm text-left space-y-3">
                        <h4 className="text-xs font-black uppercase text-practice-amberDark tracking-wider">Reading Passage</h4>
                        <p className="text-lg font-extrabold text-practice-ink leading-relaxed">
                          "Communication is the cornerstone of corporate collaboration. Delivering projects on schedule requires team members to speak clearly, listen actively, and summarize requirements objectively."
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        {commRecording ? (
                          <>
                            {/* Glowing Waveform Animation */}
                            <div className="flex items-center gap-1.5 h-8">
                              {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                <div
                                  key={i}
                                  className="w-1 bg-[#a100ff] rounded-full animate-bounce"
                                  style={{
                                    height: `${h * 8}px`,
                                    animationDelay: `${i * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                            <p className="text-sm font-extrabold text-purple-600">Recording Audio... {commTimer}s left</p>
                            <button
                              onClick={finishCommRecording}
                              className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 text-sm font-extrabold shadow transition"
                            >
                              Stop Recording
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 animate-pulse">
                              <Mic className="h-8 w-8" />
                            </div>
                            <p className="text-sm text-practice-subdued">Press Start and read the passage aloud.</p>
                            <button
                              onClick={startCommRecording}
                              className="rounded-lg bg-[#a100ff] hover:bg-[#8000cc] text-white px-8 py-3 text-sm font-extrabold shadow transition"
                            >
                              Start Recording
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {simStep === "result" && (
                <div className="space-y-6 text-center py-6">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-practice-ink">Simulation Complete!</h4>
                    <p className="text-sm text-practice-subdued">
                      Your performance has been evaluated by the local driver framework.
                    </p>
                  </div>

                  {/* Fluency / Pronunciation Breakdowns if Communication */}
                  {activeSimulatorRound.type === "communication" && commResults && (
                    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-bold text-practice-subdued">
                      <div className="bg-white border border-practice-line p-3 rounded-lg">
                        <p className="text-practice-ink text-base">{commResults.fluency}%</p>
                        <p className="mt-1">Fluency</p>
                      </div>
                      <div className="bg-white border border-practice-line p-3 rounded-lg">
                        <p className="text-practice-ink text-base">{commResults.pronunciation}%</p>
                        <p className="mt-1">Pronunciation</p>
                      </div>
                      <div className="bg-white border border-practice-line p-3 rounded-lg">
                        <p className="text-practice-ink text-base">{commResults.syntax}%</p>
                        <p className="mt-1">Sentence Syntax</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-practice-line rounded-2xl p-6 max-w-xs mx-auto shadow-sm space-y-4">
                    <p className="text-xs uppercase tracking-wider font-extrabold text-practice-subdued">Evaluation Score</p>
                    <p className="text-5xl font-black text-practice-ink">{simScore}%</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${simScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        setSimStep("playing");
                        setSimScore(0);
                        setMcqIndex(0);
                        setEssayText("");
                        setEssayTimer(180);
                        setRoundNum(1);
                        setCommRecording(false);
                        setCommTimer(15);
                        setCommResults(null);
                        if (activeSimulatorRound.type === "aptitude" && selectedCompany.id === "capgemini") {
                          startMemoryGameRound();
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-practice-line hover:bg-practice-muted text-practice-ink px-6 py-3 text-sm font-extrabold transition"
                    >
                      <RefreshCw className="h-4 w-4" /> Retry Round
                    </button>
                    <button
                      onClick={() => setActiveSimulatorRound(null)}
                      className="inline-flex items-center gap-2 rounded-xl bg-practice-sidebar hover:bg-practice-sidebarActive text-white px-6 py-3.5 text-sm font-extrabold transition"
                    >
                      Done <CheckCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
