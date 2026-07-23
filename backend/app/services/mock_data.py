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

MOCK_QUESTIONS_POOL = [
    # --- EASY QUESTIONS ---
    {
        "id": 101,
        "difficulty": "easy",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "Which of the following is the only even prime number?",
        "points": 1,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "0"},
            {"id": "b", "option_key": "B", "option_text": "2", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "4"},
            {"id": "d", "option_key": "D", "option_text": "6"}
        ]
    },
    {
        "id": 102,
        "difficulty": "easy",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "What is the smallest two-digit prime number?",
        "points": 1,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "10"},
            {"id": "b", "option_key": "B", "option_text": "11", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "13"},
            {"id": "d", "option_key": "D", "option_text": "17"}
        ]
    },
    {
        "id": 103,
        "difficulty": "easy",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "How many prime numbers exist between 1 and 10?",
        "points": 1,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "3"},
            {"id": "b", "option_key": "B", "option_text": "4", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "5"},
            {"id": "d", "option_key": "D", "option_text": "6"}
        ]
    },
    {
        "id": 104,
        "difficulty": "easy",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "Which of the following is NOT a prime number?",
        "points": 1,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "2"},
            {"id": "b", "option_key": "B", "option_text": "3"},
            {"id": "c", "option_key": "C", "option_text": "9", "is_correct": True},
            {"id": "d", "option_key": "D", "option_text": "11"}
        ]
    },
    {
        "id": 105,
        "difficulty": "easy",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "What is the prime factorization of 15?",
        "points": 1,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "1 * 15"},
            {"id": "b", "option_key": "B", "option_text": "3 * 5", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "2 * 7.5"},
            {"id": "d", "option_key": "D", "option_text": "3 * 3 * 2"}
        ]
    },
    {
        "id": 106,
        "difficulty": "easy",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "Which of these numbers is prime?",
        "points": 1,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "15"},
            {"id": "b", "option_key": "B", "option_text": "21"},
            {"id": "c", "option_key": "C", "option_text": "23", "is_correct": True},
            {"id": "d", "option_key": "D", "option_text": "25"}
        ]
    },

    # --- MEDIUM QUESTIONS ---
    {
        "id": 201,
        "difficulty": "medium",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "How many prime factors does 60 have?",
        "points": 2,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "2"},
            {"id": "b", "option_key": "B", "option_text": "3", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "4"},
            {"id": "d", "option_key": "D", "option_text": "5"}
        ]
    },
    {
        "id": 202,
        "difficulty": "medium",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "What is the sum of the prime factors of 42?",
        "points": 2,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "10"},
            {"id": "b", "option_key": "B", "option_text": "12", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "14"},
            {"id": "d", "option_key": "D", "option_text": "15"}
        ]
    },
    {
        "id": 203,
        "difficulty": "medium",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "If x is a prime number and 17 < x < 29, what is the sum of possible values of x?",
        "points": 2,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "42"},
            {"id": "b", "option_key": "B", "option_text": "23"},
            {"id": "c", "option_key": "C", "option_text": "46", "is_correct": True},
            {"id": "d", "option_key": "D", "option_text": "51"}
        ]
    },
    {
        "id": 204,
        "difficulty": "medium",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "Which of the following numbers is the product of exactly two prime numbers?",
        "points": 2,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "27"},
            {"id": "b", "option_key": "B", "option_text": "33", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "36"},
            {"id": "d", "option_key": "D", "option_text": "45"}
        ]
    },
    {
        "id": 205,
        "difficulty": "medium",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "What is the largest prime factor of 255?",
        "points": 2,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "5"},
            {"id": "b", "option_key": "B", "option_text": "17", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "51"},
            {"id": "d", "option_key": "D", "option_text": "85"}
        ]
    },
    {
        "id": 206,
        "difficulty": "medium",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "What is the sum of the first five prime numbers?",
        "points": 2,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "26"},
            {"id": "b", "option_key": "B", "option_text": "28", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "17"},
            {"id": "d", "option_key": "D", "option_text": "11"}
        ]
    },

    # --- HARD QUESTIONS ---
    {
        "id": 301,
        "difficulty": "hard",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "What is the total number of positive factors of 360?",
        "points": 3,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "18"},
            {"id": "b", "option_key": "B", "option_text": "24", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "30"},
            {"id": "d", "option_key": "D", "option_text": "36"}
        ]
    },
    {
        "id": 302,
        "difficulty": "hard",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "If p and q are prime numbers such that p > q and their sum is 12, what is the value of p^2 - q^2?",
        "points": 3,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "24"},
            {"id": "b", "option_key": "B", "option_text": "48", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "36"},
            {"id": "d", "option_key": "D", "option_text": "72"}
        ]
    },
    {
        "id": 303,
        "difficulty": "hard",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "For how many integers n is the value of (n^2 - 19n + 92) a prime number?",
        "points": 3,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "1"},
            {"id": "b", "option_key": "B", "option_text": "2", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "4"},
            {"id": "d", "option_key": "D", "option_text": "0"}
        ]
    },
    {
        "id": 304,
        "difficulty": "hard",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "What is the product of all prime factors of 10! (10 factorial)?",
        "points": 3,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "210", "is_correct": True},
            {"id": "b", "option_key": "B", "option_text": "3840"},
            {"id": "c", "option_key": "C", "option_text": "10"},
            {"id": "d", "option_key": "D", "option_text": "5040"}
        ]
    },
    {
        "id": 305,
        "difficulty": "hard",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "If N = 2^4 * 3^3 * 5^2, how many of N's positive factors are perfect squares?",
        "points": 3,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "6"},
            {"id": "b", "option_key": "B", "option_text": "12", "is_correct": True},
            {"id": "c", "option_key": "C", "option_text": "18"},
            {"id": "d", "option_key": "D", "option_text": "24"}
        ]
    },
    {
        "id": 306,
        "difficulty": "hard",
        "subject_id": "quant",
        "topic_id": "number-systems",
        "subtopic_id": "prime-factors",
        "prompt": "How many primes divide the sum of all divisors of 120?",
        "points": 3,
        "options": [
            {"id": "a", "option_key": "A", "option_text": "2", "is_correct": True},
            {"id": "b", "option_key": "B", "option_text": "3"},
            {"id": "c", "option_key": "C", "option_text": "4"},
            {"id": "d", "option_key": "D", "option_text": "5"}
        ]
    }
]
