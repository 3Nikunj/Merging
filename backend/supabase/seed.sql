insert into practice_tests (id, title, category, status, questions, duration, difficulty, is_premium)
values
    ('dsa-core', 'Data Structures & Algorithms', 'Computer Science', 'Not Started', 45, 60, 'Medium', false),
    ('os-fundamentals', 'Operating Systems Fundamentals', 'Systems', 'In Progress', 30, 45, 'Hard', false),
    ('probability-statistics', 'Probability & Statistics', 'Mathematics', 'Not Started', 25, 40, 'Medium', false),
    ('dbms-interview', 'Database Management Essentials', 'Computer Science', 'Completed', 35, 50, 'Easy', false),
    ('premium-tests', 'Premium Tests', 'Premium', 'Not Started', 50, 90, 'Hard', true)
on conflict (id) do update set
    title = excluded.title,
    category = excluded.category,
    status = excluded.status,
    questions = excluded.questions,
    duration = excluded.duration,
    difficulty = excluded.difficulty,
    is_premium = excluded.is_premium;

insert into subjects (id, title, progress, average, questions, badge, sort_order)
values
    ('quant', 'Quantitative Aptitude', 75, '64%', 1240, 'Weak Area', 1),
    ('di', 'Data Interpretation', 40, '82%', 850, null, 2),
    ('logical', 'Logical Reasoning', 10, '55%', 2100, null, 3)
on conflict (id) do update set
    title = excluded.title,
    progress = excluded.progress,
    average = excluded.average,
    questions = excluded.questions,
    badge = excluded.badge,
    sort_order = excluded.sort_order;

insert into topics (id, subject_id, title, progress, average, questions, badge, sort_order)
values
    ('number-systems', 'quant', 'Number Systems', 85, '42%', 145, 'Recommended', 1),
    ('profit-loss', 'quant', 'Profit & Loss', 30, '76%', 98, null, 2),
    ('time-work', 'quant', 'Time & Work', 0, 'N/A', 120, null, 3)
on conflict (id) do update set
    subject_id = excluded.subject_id,
    title = excluded.title,
    progress = excluded.progress,
    average = excluded.average,
    questions = excluded.questions,
    badge = excluded.badge,
    sort_order = excluded.sort_order;

insert into subtopics (id, topic_id, title, progress, average, questions, badge, sort_order)
values
    ('prime-factors', 'number-systems', 'Prime Numbers & Factors', 90, '38%', 45, 'High Yield', 1),
    ('divisibility', 'number-systems', 'Divisibility Rules', 25, '68%', 32, null, 2),
    ('hcf-lcm', 'number-systems', 'HCF & LCM', 15, '72%', 68, null, 3)
on conflict (id) do update set
    topic_id = excluded.topic_id,
    title = excluded.title,
    progress = excluded.progress,
    average = excluded.average,
    questions = excluded.questions,
    badge = excluded.badge,
    sort_order = excluded.sort_order;

insert into test_summaries (
    subject,
    topic,
    subtopic,
    title,
    questions,
    duration,
    total_marks,
    difficulty,
    passing_score,
    attempts_allowed,
    best_score
)
values (
    'Quantitative Aptitude',
    'Number Systems',
    'Prime Numbers & Factors',
    'Prime Numbers & Factors Practice',
    30,
    45,
    60,
    'Medium',
    '40%',
    3,
    '72%'
);
