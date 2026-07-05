import type { PracticeTestCardData } from "../types/practiceTest";

export const practiceTests: PracticeTestCardData[] = [
  {
    id: "dsa-core",
    title: "Data Structures & Algorithms",
    category: "Computer Science",
    status: "Not Started",
    questions: 45,
    duration: 60,
    difficulty: "Medium",
  },
  {
    id: "os-fundamentals",
    title: "Operating Systems Fundamentals",
    category: "Systems",
    status: "In Progress",
    questions: 30,
    duration: 45,
    difficulty: "Hard",
  },
  {
    id: "probability-statistics",
    title: "Probability & Statistics",
    category: "Mathematics",
    status: "Not Started",
    questions: 25,
    duration: 40,
    difficulty: "Medium",
  },
  {
    id: "dbms-interview",
    title: "Database Management Essentials",
    category: "Computer Science",
    status: "Completed",
    questions: 35,
    duration: 50,
    difficulty: "Easy",
  },
  {
    id: "premium-tests",
    title: "Premium Tests",
    category: "Premium",
    status: "Not Started",
    questions: 50,
    duration: 90,
    difficulty: "Hard",
    isPremium: true,
  },
];

export const recommendedTopics = [
  {
    label: "High Impact",
    title: "Trie Data Structures",
    description: "Commonly asked in Google and Meta",
  },
  {
    label: "Skill Gap",
    title: "Dynamic Programming I",
    description: "Improve your speed in hard questions",
  },
];

export const weakAreas = [
  {
    topic: "Recursion",
    accuracy: 34,
  },
  {
    topic: "SQL Joins",
    accuracy: 48,
  },
];
