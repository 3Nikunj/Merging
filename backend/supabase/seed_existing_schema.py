import os
from uuid import UUID

import psycopg
from psycopg.types.json import Jsonb
from dotenv import load_dotenv



TESTS = [
    {
        "title": "Aptitude Foundations Practice",
        "subject_slug": "aptitude",
        "topic_slug": "quantitative-aptitude",
        "duration_minutes": 45,
        "difficulty": "Medium",
        "category": "Aptitude",
        "questions": [
            {
                "prompt": "A number is increased by 20% and then decreased by 20%. What is the net percentage change?",
                "options": [("A", "No change", False), ("B", "4% decrease", True), ("C", "4% increase", False), ("D", "8% decrease", False)],
            },
            {
                "prompt": "If 12 workers complete a task in 10 days, how many days will 15 workers take at the same rate?",
                "options": [("A", "6", False), ("B", "8", True), ("C", "10", False), ("D", "12", False)],
            },
        ],
    },
    {
        "title": "Logical Reasoning Sprint",
        "subject_slug": "reasoning",
        "topic_slug": "logical-reasoning",
        "duration_minutes": 35,
        "difficulty": "Medium",
        "category": "Reasoning",
        "questions": [
            {
                "prompt": "Find the next term in the series: 2, 6, 12, 20, 30, ?",
                "options": [("A", "40", False), ("B", "42", True), ("C", "44", False), ("D", "46", False)],
            },
            {
                "prompt": "If A is the brother of B and B is the sister of C, how is A related to C?",
                "options": [("A", "Brother", True), ("B", "Sister", False), ("C", "Father", False), ("D", "Cannot be determined", False)],
            },
        ],
    },
    {
        "title": "Verbal Ability Grammar Drill",
        "subject_slug": "verbal",
        "topic_slug": "grammar",
        "duration_minutes": 30,
        "difficulty": "Easy",
        "category": "Verbal Ability",
        "questions": [
            {
                "prompt": "Choose the grammatically correct sentence.",
                "options": [("A", "She do her work daily.", False), ("B", "She does her work daily.", True), ("C", "She doing her work daily.", False), ("D", "She done her work daily.", False)],
            },
            {
                "prompt": "Select the synonym of 'concise'.",
                "options": [("A", "Brief", True), ("B", "Lengthy", False), ("C", "Confused", False), ("D", "Harsh", False)],
            },
        ],
    },
    {
        "title": "Data Structures Core Test",
        "subject_slug": "coding",
        "topic_slug": "data-structures",
        "duration_minutes": 60,
        "difficulty": "Hard",
        "category": "Coding",
        "questions": [
            {
                "prompt": "Which data structure follows the LIFO principle?",
                "options": [("A", "Queue", False), ("B", "Stack", True), ("C", "Graph", False), ("D", "Heap", False)],
            },
            {
                "prompt": "What is the average-case time complexity of searching in a balanced binary search tree?",
                "options": [("A", "O(1)", False), ("B", "O(log n)", True), ("C", "O(n)", False), ("D", "O(n log n)", False)],
            },
        ],
    },
]


def one(cur, query: str, params: tuple) -> UUID | None:
    cur.execute(query, params)
    row = cur.fetchone()
    return row[0] if row else None


def get_subject_id(cur, slug: str) -> UUID:
    subject_id = one(cur, "select id from public.subjects where slug = %s", (slug,))
    if subject_id is None:
        raise RuntimeError(f"Missing subject slug: {slug}")
    return subject_id


def get_topic_id(cur, slug: str) -> UUID:
    topic_id = one(cur, "select id from public.topics where slug = %s", (slug,))
    if topic_id is None:
        raise RuntimeError(f"Missing topic slug: {slug}")
    return topic_id


def get_or_create_question(cur, prompt: str, difficulty: str) -> UUID:
    question_id = one(cur, "select id from public.questions where prompt = %s limit 1", (prompt,))
    if question_id is not None:
        return question_id

    cur.execute(
        """
        insert into public.questions (question_type, prompt, difficulty, marks, status, metadata)
        values (%s, %s, %s, %s, %s, %s)
        returning id
        """,
        ("mcq", prompt, difficulty.lower(), 1, "draft", Jsonb({})),
    )
    return cur.fetchone()[0]


def ensure_options(cur, question_id: UUID, options: list[tuple[str, str, bool]]) -> None:
    cur.execute("select count(*) from public.question_options where question_id = %s", (question_id,))
    if cur.fetchone()[0] > 0:
        return

    for sort_order, (key, text, is_correct) in enumerate(options, start=1):
        cur.execute(
            """
            insert into public.question_options (
                question_id, option_key, option_text, is_correct, sort_order
            )
            values (%s, %s, %s, %s, %s)
            """,
            (question_id, key, text, is_correct, sort_order),
        )


def get_or_create_test(cur, test: dict, subject_id: UUID, topic_id: UUID) -> UUID:
    test_id = one(cur, "select id from public.tests where title = %s limit 1", (test["title"],))
    if test_id is not None:
        return test_id

    settings = {
        "category": test["category"],
        "difficulty": test["difficulty"],
        "questions": len(test["questions"]),
        "is_premium": False,
    }
    cur.execute(
        """
        insert into public.tests (
            title, scope, subject_id, topic_id, duration_minutes, is_active, settings
        )
        values (%s, %s, %s, %s, %s, %s, %s)
        returning id
        """,
        (
            test["title"],
            "general",
            subject_id,
            topic_id,
            test["duration_minutes"],
            True,
            Jsonb(settings),
        ),
    )
    return cur.fetchone()[0]


def link_question(cur, test_id: UUID, question_id: UUID, sort_order: int) -> None:
    cur.execute(
        """
        select 1
        from public.test_questions
        where test_id = %s and question_id = %s
        limit 1
        """,
        (test_id, question_id),
    )
    if cur.fetchone():
        return

    cur.execute(
        """
        insert into public.test_questions (
            test_id, question_id, sort_order, section_label, marks
        )
        values (%s, %s, %s, %s, %s)
        """,
        (test_id, question_id, sort_order, "Practice", 1),
    )


def main() -> None:
    load_dotenv()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set")

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            for test in TESTS:
                subject_id = get_subject_id(cur, test["subject_slug"])
                topic_id = get_topic_id(cur, test["topic_slug"])
                test_id = get_or_create_test(cur, test, subject_id, topic_id)

                for sort_order, question in enumerate(test["questions"], start=1):
                    question_id = get_or_create_question(
                        cur,
                        question["prompt"],
                        test["difficulty"],
                    )
                    ensure_options(cur, question_id, question["options"])
                    link_question(cur, test_id, question_id, sort_order)

        conn.commit()

    print(f"Seeded {len(TESTS)} tests into existing Supabase schema.")


if __name__ == "__main__":
    main()
