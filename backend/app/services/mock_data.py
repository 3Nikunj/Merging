PRACTICE_TESTS = [
    {
        "id": "dsa-core",
        "title": "Data Structures & Algorithms",
        "category": "Computer Science",
        "status": "Not Started",
        "questions": 45,
        "duration": 60,
        "difficulty": "Medium",
        "is_premium": False,
    },
    {
        "id": "os-fundamentals",
        "title": "Operating Systems Fundamentals",
        "category": "Systems",
        "status": "In Progress",
        "questions": 30,
        "duration": 45,
        "difficulty": "Hard",
        "is_premium": False,
    },
    {
        "id": "probability-statistics",
        "title": "Probability & Statistics",
        "category": "Mathematics",
        "status": "Not Started",
        "questions": 25,
        "duration": 40,
        "difficulty": "Medium",
        "is_premium": False,
    },
    {
        "id": "dbms-interview",
        "title": "Database Management Essentials",
        "category": "Computer Science",
        "status": "Completed",
        "questions": 35,
        "duration": 50,
        "difficulty": "Easy",
        "is_premium": False,
    },
    {
        "id": "premium-tests",
        "title": "Premium Tests",
        "category": "Premium",
        "status": "Not Started",
        "questions": 50,
        "duration": 90,
        "difficulty": "Hard",
        "is_premium": True,
    },
]

SUBJECTS = [
    {
        "id": "quant",
        "title": "Quantitative Aptitude",
        "progress": 75,
        "average": "64%",
        "questions": 1240,
        "badge": "Weak Area",
    },
    {
        "id": "di",
        "title": "Data Interpretation",
        "progress": 40,
        "average": "82%",
        "questions": 850,
        "badge": None,
    },
    {
        "id": "logical",
        "title": "Logical Reasoning",
        "progress": 10,
        "average": "55%",
        "questions": 2100,
        "badge": None,
    },
]

TOPICS = [
    {
        "id": "number-systems",
        "title": "Number Systems",
        "progress": 85,
        "average": "42%",
        "questions": 145,
        "badge": "Recommended",
    },
    {
        "id": "profit-loss",
        "title": "Profit & Loss",
        "progress": 30,
        "average": "76%",
        "questions": 98,
        "badge": None,
    },
    {
        "id": "time-work",
        "title": "Time & Work",
        "progress": 0,
        "average": "N/A",
        "questions": 120,
        "badge": None,
    },
]

SUBTOPICS = [
    {
        "id": "prime-factors",
        "title": "Prime Numbers & Factors",
        "progress": 90,
        "average": "38%",
        "questions": 45,
        "badge": "High Yield",
    },
    {
        "id": "divisibility",
        "title": "Divisibility Rules",
        "progress": 25,
        "average": "68%",
        "questions": 32,
        "badge": None,
    },
    {
        "id": "hcf-lcm",
        "title": "HCF & LCM",
        "progress": 15,
        "average": "72%",
        "questions": 68,
        "badge": None,
    },
]

SELECTED_TEST = {
    "subject": "Quantitative Aptitude",
    "topic": "Number Systems",
    "subtopic": "Prime Numbers & Factors",
    "title": "Prime Numbers & Factors Practice",
    "questions": 30,
    "duration": 45,
    "total_marks": 60,
    "difficulty": "Medium",
    "passing_score": "40%",
    "attempts_allowed": 3,
    "best_score": "72%",
}

LIVE_QUESTION = {
    "id": 12,
    "points": 4,
    "text": "If p and q are prime numbers such that p > q, what is the value of p2 - q2 if their sum is 12?",
    "answer_id": "b",
    "options": [
        {"id": "a", "label": "A", "value": "24"},
        {"id": "b", "label": "B", "value": "48"},
        {"id": "c", "label": "C", "value": "36"},
        {"id": "d", "label": "D", "value": "72"},
    ],
}

RESULT_BREAKDOWN = [
    {"label": "Number Theory", "score": 85},
    {"label": "Factors & Multiples", "score": 70},
    {"label": "Prime Identification", "score": 90},
]

ANSWER_REVIEW = [
    {
        "id": "01",
        "preview": "Which of the following is the only even prime...",
        "status": "Correct",
        "topic": "Prime Identification",
    },
    {
        "id": "02",
        "preview": "Find the prime factorization of 1240...",
        "status": "Incorrect",
        "topic": "Factors & Multiples",
    },
    {
        "id": "03",
        "preview": "How many divisors does the number 48 have...",
        "status": "Correct",
        "topic": "Number Theory",
    },
    {
        "id": "04",
        "preview": "If P is a prime number greater than 3, then...",
        "status": "Skipped",
        "topic": "Advanced Primes",
    },
]

RECOMMENDATIONS = [
    {
        "label": "High Impact",
        "title": "Trie Data Structures",
        "description": "Commonly asked in Google and Meta",
    },
    {
        "label": "Skill Gap",
        "title": "Dynamic Programming I",
        "description": "Improve your speed in hard questions",
    },
]

WEAK_AREAS = [
    {"topic": "Recursion", "accuracy": 34},
    {"topic": "SQL Joins", "accuracy": 48},
]
