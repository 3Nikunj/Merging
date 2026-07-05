-- Seed Users & Profiles
insert into public.profiles (id, email, full_name, role, phone, college, department, year_of_graduation)
values
    ('00000000-0000-0000-0000-000000000001', 'student@aivalytics.com', 'Demo Student', 'student', '1234567890', 'Tech College', 'Computer Science', 2026),
    ('00000000-0000-0000-0000-000000000002', 'admin@aivalytics.com', 'Demo Admin', 'admin', '0987654321', null, null, null)
on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

insert into public.profile_academics (profile_id, tenth_percentage, twelfth_percentage, graduation_cgpa, backlogs, gap_years, gap_during_grad)
values
    ('00000000-0000-0000-0000-000000000001', 92.50, 89.00, 8.85, 0, 0, false)
on conflict (profile_id) do update set
    graduation_cgpa = excluded.graduation_cgpa;

-- Seed Taxonomy (Subjects, Topics, Subtopics)
insert into public.subjects (id, name, slug, progress, average, questions, badge, sort_order, active)
values
    ('11111111-1111-1111-1111-111111111111', 'Quantitative Aptitude', 'quant', 75, '64%', 1240, 'Weak Area', 1, true),
    (' di111111-1111-1111-1111-111111111111', 'Data Interpretation', 'di', 40, '82%', 850, null, 2, true),
    ('11111111-1111-1111-1111-111111111112', 'Logical Reasoning', 'logical', 10, '55%', 2100, null, 3, true)
on conflict (id) do update set
    name = excluded.name,
    progress = excluded.progress,
    average = excluded.average,
    questions = excluded.questions;

insert into public.topics (id, subject_id, name, slug, progress, average, questions, badge, sort_order, active)
values
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Number Systems', 'number-systems', 85, '42%', 145, 'Recommended', 1, true),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Profit & Loss', 'profit-loss', 30, '76%', 98, null, 2, true),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Time & Work', 'time-work', 0, 'N/A', 120, null, 3, true)
on conflict (id) do update set
    name = excluded.name,
    progress = excluded.progress,
    average = excluded.average;

insert into public.subtopics (id, topic_id, name, slug, progress, average, questions, badge, sort_order, active)
values
    ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'Prime Numbers & Factors', 'prime-factors', 90, '38%', 45, 'High Yield', 1, true),
    ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222221', 'Divisibility Rules', 'divisibility', 25, '68%', 32, null, 2, true),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221', 'HCF & LCM', 'hcf-lcm', 15, '72%', 68, null, 3, true)
on conflict (id) do update set
    name = excluded.name,
    progress = excluded.progress,
    average = excluded.average;

-- Seed Tests
insert into public.tests (id, title, scope, company_id, subject_id, topic_id, duration_minutes, is_active, settings, created_by)
values
    ('44444444-4444-4444-4444-444444444444', 'Prime Numbers & Factors Practice', 'general', null, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 45, true, '{"category": "Aptitude", "difficulty": "Medium", "questions": 2, "is_premium": false}', 'system')
on conflict (id) do update set
    title = excluded.title,
    duration_minutes = excluded.duration_minutes;

-- Seed Questions
insert into public.questions (id, title, prompt, question_type, subject_id, topic_id, subtopic_id, difficulty, marks, status, metadata)
values
    ('55555555-5555-5555-5555-555555555551', 'Percentage net change question', 'A number is increased by 20% and then decreased by 20%. What is the net percentage change?', 'mcq', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', 'medium', 1.00, 'published', '{}'),
    ('55555555-5555-5555-5555-555555555552', 'Time and work workers question', 'If 12 workers complete a task in 10 days, how many days will 15 workers take at the same rate?', 'mcq', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', 'medium', 1.00, 'published', '{}')
on conflict (id) do update set
    prompt = excluded.prompt,
    status = excluded.status;

-- Seed MCQ Options
insert into public.question_options (id, question_id, option_key, option_text, is_correct, sort_order)
values
    ('66666666-6666-6666-6666-666666666611', '55555555-5555-5555-5555-555555555551', 'A', 'No change', false, 1),
    ('66666666-6666-6666-6666-666666666612', '55555555-5555-5555-5555-555555555551', 'B', '4% decrease', true, 2),
    ('66666666-6666-6666-6666-666666666613', '55555555-5555-5555-5555-555555555551', 'C', '4% increase', false, 3),
    ('66666666-6666-6666-6666-666666666614', '55555555-5555-5555-5555-555555555551', 'D', '8% decrease', false, 4),
    
    ('66666666-6666-6666-6666-666666666621', '55555555-5555-5555-5555-555555555552', 'A', '6', false, 1),
    ('66666666-6666-6666-6666-666666666622', '55555555-5555-5555-5555-555555555552', 'B', '8', true, 2),
    ('66666666-6666-6666-6666-666666666623', '55555555-5555-5555-5555-555555555552', 'C', '10', false, 3),
    ('66666666-6666-6666-6666-666666666624', '55555555-5555-5555-5555-555555555552', 'D', '12', false, 4)
on conflict (id) do update set
    option_text = excluded.option_text,
    is_correct = excluded.is_correct;

-- Link Questions to Test
insert into public.test_questions (test_id, question_id, sort_order, section_label, marks)
values
    ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555551', 1, 'Practice', 1.00),
    ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555552', 2, 'Practice', 1.00)
on conflict (test_id, question_id) do nothing;

-- Seed Analytics & Recommendations
insert into public.user_recommendations (id, user_id, label, title, description)
values
    ('77777777-7777-7777-7777-777777777771', '00000000-0000-0000-0000-000000000001', 'High Yield', 'Revise Divisibility Rules', 'Spend 30 minutes reviewing divisible properties of 3, 7, and 11 to bolster calculation accuracy.'),
    ('77777777-7777-7777-7777-777777777772', '00000000-0000-0000-0000-000000000001', 'Recommended', 'DSA Trees Sprint', 'Take the DSA Trees Core Practice Assessment to check your understanding of binary tree paths.')
on conflict (id) do nothing;

insert into public.weak_areas (id, user_id, topic, accuracy)
values
    ('88888888-8888-8888-8888-888888888881', '00000000-0000-0000-0000-000000000001', 'Number Systems', 38),
    ('88888888-8888-8888-8888-888888888882', '00000000-0000-0000-0000-000000000001', 'Profit & Loss', 48)
on conflict (id) do nothing;
