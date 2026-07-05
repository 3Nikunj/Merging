import type {
  AnswerReviewRow,
  CodingProblem,
  LiveQuestion,
  ResultBreakdown,
  SelectionItem,
  TestSummary,
} from "../types/testFlow";

export const subjects: SelectionItem[] = [
  {
    id: "quant",
    title: "Quantitative Aptitude",
    progress: 75,
    average: "64%",
    questions: 1240,
    badge: "Weak Area",
  },
  {
    id: "di",
    title: "Data Interpretation",
    progress: 40,
    average: "82%",
    questions: 850,
  },
  {
    id: "logical",
    title: "Logical Reasoning",
    progress: 10,
    average: "55%",
    questions: 2100,
  },
];

export const topics: SelectionItem[] = [
  {
    id: "number-systems",
    title: "Number Systems",
    progress: 85,
    average: "42%",
    questions: 145,
    badge: "Recommended",
  },
  {
    id: "profit-loss",
    title: "Profit & Loss",
    progress: 30,
    average: "76%",
    questions: 98,
  },
  {
    id: "time-work",
    title: "Time & Work",
    progress: 0,
    average: "N/A",
    questions: 120,
  },
];

export const subtopics: SelectionItem[] = [
  {
    id: "prime-factors",
    title: "Prime Numbers & Factors",
    progress: 90,
    average: "38%",
    questions: 45,
    badge: "High Yield",
  },
  {
    id: "divisibility",
    title: "Divisibility Rules",
    progress: 25,
    average: "68%",
    questions: 32,
  },
  {
    id: "hcf-lcm",
    title: "HCF & LCM",
    progress: 15,
    average: "72%",
    questions: 68,
  },
];

export const selectedTest: TestSummary = {
  subject: "Quantitative Aptitude",
  topic: "Number Systems",
  subtopic: "Prime Numbers & Factors",
  title: "Prime Numbers & Factors Practice",
  questions: 30,
  duration: 45,
  totalMarks: 60,
  difficulty: "Medium",
  passingScore: "40%",
  attemptsAllowed: 3,
  bestScore: "72%",
};

export const liveQuestion: LiveQuestion = {
  id: 12,
  points: 4,
  text: "If p and q are prime numbers such that p > q, what is the value of p2 - q2 if their sum is 12?",
  answerId: "b",
  options: [
    { id: "a", label: "A", value: "24" },
    { id: "b", label: "B", value: "48" },
    { id: "c", label: "C", value: "36" },
    { id: "d", label: "D", value: "72" },
  ],
};

export const codingProblem: CodingProblem = {
  id: "001",
  title: "Two Sum",
  difficulty: "Medium",
  language: "Python3",
  description:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
  ],
  tags: ["Array", "Hash Table"],
  starterCode: [
    "class Solution:",
    "    def twoSum(self, nums: List[int], target: int) -> List[int]:",
    "        # Write your implementation here",
    "        prevMap = {} # val : index",
    "",
    "        for i, n in enumerate(nums):",
    "            diff = target - n",
  ],
};

export const resultBreakdown: ResultBreakdown[] = [
  { label: "Number Theory", score: 85 },
  { label: "Factors & Multiples", score: 70 },
  { label: "Prime Identification", score: 90 },
];

export const answerReview: AnswerReviewRow[] = [
  {
    id: "01",
    preview: "Which of the following is the only even prime...",
    status: "Correct",
    topic: "Prime Identification",
  },
  {
    id: "02",
    preview: "Find the prime factorization of 1240...",
    status: "Incorrect",
    topic: "Factors & Multiples",
  },
  {
    id: "03",
    preview: "How many divisors does the number 48 have...",
    status: "Correct",
    topic: "Number Theory",
  },
  {
    id: "04",
    preview: "If P is a prime number greater than 3, then...",
    status: "Skipped",
    topic: "Advanced Primes",
  },
];
