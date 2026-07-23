import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  Lock,
  Search,
  Shuffle,
  Sparkles,
  TrendingUp,
  Unlock,
} from "lucide-react";
import AppLayout from "../../../components/student/layout/AppLayout";
import { codingProblems } from "../../../data/codingProblems";
import { api } from "../../../services/api";

type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";
type StatusFilter = "All" | "Solved" | "Unsolved";

// Banner templates referencing AiValytics branding and links
const BANNERS = [
  {
    id: 1,
    title: "Unlock Full Career Acceleration on AiValytics",
    description: "Get access to specialized company mockups, advanced programming tests, and verified corporate placement practice runs.",
    price: "₹599.00/mo",
    cta: "Upgrade to Premium",
    bg: "from-[#FFC55F]/20 via-[#FFFDF5] to-transparent border-[#FFC55F]/30",
    badge: "Premium Access",
    badgeBg: "bg-[#FFC55F]/20 text-[#755100]",
    link: "https://www.aivalytics.com/",
  },
  {
    id: 2,
    title: "AiValytics' Interview Preparation Course",
    description: "Direct pathway to clearing top-tier technical and managerial interviews with our interactive AI coach.",
    price: "Included in Pro",
    cta: "Start Learning",
    bg: "from-[#071D3A]/10 via-[#FFFDF5] to-transparent border-[#071D3A]/20",
    badge: "Popular Course",
    badgeBg: "bg-[#071D3A]/10 text-[#071D3A]",
    link: "https://www.aivalytics.com/",
  },
  {
    id: 3,
    title: "AI Verbal Interview Simulator",
    description: "Practice real-time speaking evaluations, and receive instantly generated rubrics, scorecards, and study recommendations.",
    price: "Standard Plan",
    cta: "Explore Simulator",
    bg: "from-[#FFC55F]/15 via-[#071D3A]/5 to-transparent border-[#C4C6CE]",
    badge: "Voice simulator",
    badgeBg: "bg-[#755100]/10 text-[#755100]",
    link: "https://www.aivalytics.com/",
  },
];

// Trending Companies mock data aligned with practice portal style
const TRENDING_COMPANIES = [
  { name: "Google", count: 2327, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
  { name: "Amazon", count: 1993, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
  { name: "Bloomberg", count: 1215, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
  { name: "Meta", count: 1388, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
  { name: "Microsoft", count: 1390, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
  { name: "Apple", count: 304, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
  { name: "Infosys", count: 188, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
  { name: "Citadel", count: 88, color: "bg-white text-practice-ink border-practice-line hover:border-practice-amber hover:bg-practice-muted/40" },
];

// Calendar logic
const getDaysInMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

function CodingProblemsListPage() {
  const navigate = useNavigate();
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());
  const [attemptedProblemIds, setAttemptedProblemIds] = useState<Set<string>>(new Set());

  // Extract all unique tags
  const allTags = Array.from(new Set(codingProblems.flatMap((p) => p.tags)));

  // Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch submissions to identify solved & attempted problems
  useEffect(() => {
    const fetchSubmissionsHistory = async () => {
      try {
        const response = await api.getCodingSubmissions();
        const solved = new Set<string>();
        const attempted = new Set<string>();

        response.submissions.forEach((sub) => {
          attempted.add(sub.problem_id);
          if (sub.status.toLowerCase() === "accepted") {
            solved.add(sub.problem_id);
          }
        });

        setSolvedProblemIds(solved);
        setAttemptedProblemIds(attempted);
      } catch (err) {
        console.error("Failed to load submission history for dashboard metrics:", err);
      }
    };
    fetchSubmissionsHistory();
  }, []);

  // Shuffle / Random picker
  const handleShuffle = () => {
    if (codingProblems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * codingProblems.length);
    const randomProblem = codingProblems[randomIndex];
    navigate(`/coding-practice/problems/${randomProblem.id}`);
  };

  // Filter problems logic
  const filteredProblems = codingProblems.filter((problem) => {
    // Search match (title, id or tags)
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.id.includes(searchQuery) ||
      problem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // Difficulty match
    const matchesDifficulty =
      difficultyFilter === "All" || problem.difficulty === difficultyFilter;

    // Status match
    const isSolved = solvedProblemIds.has(problem.id);
    let matchesStatus = true;
    if (statusFilter === "Solved") {
      matchesStatus = isSolved;
    } else if (statusFilter === "Unsolved") {
      matchesStatus = !isSolved;
    }

    // Tag match
    const matchesTag = !selectedTag || problem.tags.includes(selectedTag);

    return matchesSearch && matchesDifficulty && matchesStatus && matchesTag;
  });

  // Calendar render helpers
  const days = getDaysInMonth();
  const currentDay = new Date().getDate();

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px] pb-16 text-practice-text">
        
        {/* Banner Carousel & Calendar Hero section (matching light theme) */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          
          {/* Slider Banners */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-practice-line bg-white p-6 shadow-sm min-h-[190px]">
            {/* Background Gradient effects */}
            <div className={`absolute inset-0 bg-gradient-to-r transition-all duration-700 ease-in-out -z-10 ${BANNERS[activeBanner].bg}`} />
            
            <div className="flex items-start justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${BANNERS[activeBanner].badgeBg}`}>
                {BANNERS[activeBanner].badge}
              </span>
              <div className="flex gap-1.5">
                {BANNERS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveBanner(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeBanner === idx ? "w-6 bg-practice-amber" : "w-2 bg-practice-line hover:bg-practice-line/80"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="my-3">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-practice-ink mb-1.5">
                {BANNERS[activeBanner].title}
              </h2>
              <p className="text-xs sm:text-sm text-practice-subdued max-w-lg font-semibold leading-relaxed">
                {BANNERS[activeBanner].description}
              </p>
            </div>

            <div className="flex items-center gap-4 border-t border-practice-line/55 pt-4 mt-1">
              <div className="text-xs font-bold text-practice-subdued">
                Starting at <span className="text-base font-black text-practice-amberDark">{BANNERS[activeBanner].price}</span>
              </div>
              <a
                href={BANNERS[activeBanner].link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-practice-ink hover:bg-practice-sidebarActive text-white px-4 py-2 text-xs font-black shadow-md active:scale-[0.98] transition-all no-underline inline-block text-center cursor-pointer"
              >
                {BANNERS[activeBanner].cta}
              </a>
            </div>
          </div>

          {/* Calendar Widget (matching light portal style) */}
          <div className="rounded-2xl border border-practice-line bg-white p-4 shadow-sm text-practice-text">
            <div className="mb-2.5 flex items-center justify-between text-xs font-extrabold tracking-wide uppercase text-practice-subdued">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-practice-amberDark" />
                Daily Check-In
              </span>
              <span className="text-practice-subdued/80">Day {currentDay}</span>
            </div>
            
            {/* Simple Grid Calendar */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold mb-2.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-practice-subdued/60 py-0.5">{d}</div>
              ))}
              {/* Empty offset for formatting alignment */}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, idx) => (
                <div key={idx} />
              ))}
              {days.map((day) => {
                const dateNum = day.getDate();
                const isToday = dateNum === currentDay;
                const isPast = dateNum < currentDay;

                return (
                  <div
                    key={dateNum}
                    className={`relative flex items-center justify-center p-1 rounded-md font-mono text-[9px] aspect-square transition ${
                      isToday
                        ? "bg-practice-amber text-practice-amberDark font-bold shadow-sm border border-practice-amberDark/30"
                        : isPast
                        ? "text-practice-text hover:bg-practice-muted/50"
                        : "text-practice-subdued/40"
                    }`}
                  >
                    {dateNum}
                    {isPast && (
                      <div className="absolute bottom-1 h-0.5 w-0.5 rounded-full bg-practice-line" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between border-t border-practice-line/80 pt-3 text-[10px] font-extrabold text-practice-subdued">
              <span>Streak: 12 Days</span>
              <span className="flex items-center gap-1 text-practice-amberDark">
                <Flame className="h-3.5 w-3.5 fill-practice-amber" />
                240 pts
              </span>
            </div>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-practice-line pb-5">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
              !selectedTag
                ? "bg-practice-amber/20 text-practice-amberDark border-practice-amber"
                : "bg-white text-practice-subdued border-practice-line hover:bg-practice-muted/40 hover:text-practice-ink"
            }`}
          >
            All Topics
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            const count = codingProblems.filter((p) => p.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-practice-amber/20 text-practice-amberDark border-practice-amber"
                    : "bg-white text-practice-subdued border-practice-line hover:bg-practice-muted/40 hover:text-practice-ink"
                }`}
              >
                {tag}
                <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${isSelected ? "bg-practice-amber/35 text-practice-amberDark" : "bg-practice-muted text-practice-subdued/75"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Problems Table & Company Panels layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          
          {/* Left panel: problems table */}
          <div className="rounded-2xl border border-practice-line bg-white p-5 shadow-sm">
            
            {/* Table controls */}
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-practice-subdued/60" />
                <input
                  type="text"
                  placeholder="Search questions by title or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-practice-line bg-practice-muted/30 py-2 pl-10 pr-4 text-xs font-semibold text-practice-ink placeholder-practice-subdued/50 transition focus:border-practice-amber focus:outline-none"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Difficulty selector */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                  className="rounded-xl border border-practice-line bg-white px-3 py-2 text-xs font-bold text-practice-subdued outline-none hover:bg-practice-muted/45 hover:border-practice-line transition cursor-pointer"
                >
                  <option value="All">Difficulty: All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="rounded-xl border border-practice-line bg-white px-3 py-2 text-xs font-bold text-practice-subdued outline-none hover:bg-practice-muted/45 hover:border-practice-line transition cursor-pointer"
                >
                  <option value="All">Status: All</option>
                  <option value="Solved">Solved</option>
                  <option value="Unsolved">Unsolved</option>
                </select>

                {/* Shuffle / Random button */}
                <button
                  type="button"
                  onClick={handleShuffle}
                  title="Pick a random problem"
                  className="flex items-center gap-1.5 rounded-xl border border-practice-line bg-white px-4 py-2 text-xs font-bold text-practice-amberDark hover:bg-practice-muted/40 transition active:scale-[0.98] cursor-pointer"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span>Pick One</span>
                </button>
              </div>
            </div>

            {/* Solved stats indicator */}
            <div className="mb-4 flex items-center justify-between text-xs font-extrabold tracking-wide uppercase text-practice-subdued border-b border-practice-line/60 pb-3">
              <span>Questions List</span>
              <span className="flex items-center gap-1 text-practice-subdued">
                <span className="text-practice-amberDark font-black">{solvedProblemIds.size}</span>
                <span className="text-practice-subdued/50">/</span>
                <span>{codingProblems.length} Solved</span>
              </span>
            </div>

            {/* Problems List */}
            <div className="min-w-full overflow-x-auto custom-scrollbar">
              <table className="min-w-full text-left text-xs text-practice-text">
                <thead className="border-b border-practice-line/80 text-[10px] font-extrabold uppercase tracking-wider text-practice-subdued">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4 w-28">Acceptance</th>
                    <th className="py-3 px-4 w-28">Difficulty</th>
                    <th className="py-3 px-4 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-practice-line/45">
                  {filteredProblems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-practice-subdued font-bold">
                        <BookOpen className="mx-auto mb-3 h-8 w-8 text-practice-line" />
                        No matching problems found. Adjust your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProblems.map((problem) => {
                      const isSolved = solvedProblemIds.has(problem.id);
                      const isAttempted = attemptedProblemIds.has(problem.id);

                      // Mock acceptance rate
                      const mockAcceptance = `${((parseInt(problem.id) * 31) % 25 + 45).toFixed(1)}%`;

                      let diffColor = "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
                      if (problem.difficulty === "Medium") {
                        diffColor = "text-practice-amberDark bg-practice-amber/20 border-practice-amberDark/20";
                      } else if (problem.difficulty === "Hard") {
                        diffColor = "text-red-700 bg-red-500/10 border-red-500/25";
                      }

                      return (
                        <tr
                          key={problem.id}
                          className="hover:bg-practice-muted/30 group transition duration-150"
                        >
                          <td className="py-4 px-4 text-center">
                            {isSolved ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : isAttempted ? (
                              <Circle className="mx-auto h-4 w-4 text-practice-amberDark" />
                            ) : (
                              <Circle className="mx-auto h-4 w-4 text-practice-line group-hover:text-practice-subdued/80" />
                            )}
                          </td>
                          <td className="py-4 px-4 font-bold text-practice-ink group-hover:text-practice-amberDark">
                            <Link
                              to={`/coding-practice/problems/${problem.id}`}
                              className="hover:text-practice-amberDark transition"
                            >
                              {parseInt(problem.id)}. {problem.title}
                            </Link>
                          </td>
                          <td className="py-4 px-4 font-mono text-practice-subdued font-medium">
                            {mockAcceptance}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${diffColor}`}>
                              {problem.difficulty}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {isSolved ? (
                              <Unlock className="mx-auto h-4 w-4 text-practice-subdued/60" />
                            ) : (
                              <Lock className="mx-auto h-4 w-4 text-practice-line/75" />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right panel: companies list & target sprint card */}
          <div className="space-y-6">
            
            {/* Target sprint card (light styled) */}
            <div className="rounded-2xl border border-[#E5DEC8] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-practice-amber/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-practice-amberDark border border-practice-amber/30">
                  Sprint Core
                </span>
                <Sparkles className="h-4 w-4 text-practice-amberDark animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-practice-ink mb-1.5">Meta & Google Prep</h3>
              <p className="text-xs text-practice-subdued mb-4 leading-relaxed font-semibold">
                Complete 5 essential dynamic programming and sliding window questions asked frequently in senior tech panels.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-practice-subdued">
                  <span>Progress</span>
                  <span>{solvedProblemIds.size > 0 ? "20%" : "0%"} Complete</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-practice-muted">
                  <div
                    className="h-full rounded-full bg-practice-amberDark"
                    style={{ width: solvedProblemIds.size > 0 ? "20%" : "0%" }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleShuffle}
                className="w-full rounded-xl bg-practice-ink hover:bg-practice-sidebarActive text-white py-2.5 text-xs font-black transition active:scale-[0.98] cursor-pointer"
              >
                Resume Sprint
              </button>
            </div>

            {/* Trending Companies (light styled) */}
            <div className="rounded-2xl border border-practice-line bg-white p-5 shadow-sm">
              <h4 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-practice-subdued flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-practice-amberDark" />
                Trending Companies
              </h4>
              
              <div className="flex flex-wrap gap-2">
                {TRENDING_COMPANIES.map((company) => (
                  <button
                    key={company.name}
                    type="button"
                    onClick={() => setSearchQuery(company.name)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${company.color}`}
                  >
                    <span>{company.name}</span>
                    <span className="text-[10px] opacity-65">{company.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-practice-line/50 pt-4 text-center">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setSearchQuery(""); }}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-practice-amberDark hover:text-practice-amber transition no-underline"
                >
                  Clear Company Search Filter
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}

export default CodingProblemsListPage;
