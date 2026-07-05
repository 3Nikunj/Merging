export interface Overview {
  subjects: number;
  topics: number;
  subtopics: number;
  tests: number;
  questions: number;
  coding_problems: number;
  latest_attempts: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  sort_order: number;
  subjects?: { name: string };
}

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  slug: string;
  sort_order: number;
  topics?: { name: string; subject_id: string };
}

export interface TestItem {
  id: string;
  title: string;
  scope: string;
  company_id?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  companies?: { name: string } | null;
  subjects?: { name: string } | null;
  topics?: { name: string } | null;
}

export interface StructuredTestSettings {
  instructions: string[];
  scoring: {
    total_marks: number;
    negative_marking: number;
  };
  behavior: {
    auto_submit_on_timeout: boolean;
    allow_question_navigation: boolean;
    allow_review_before_submit: boolean;
  };
  category?: string;
  difficulty?: string;
  questions?: number;
  is_premium?: boolean;
}

export interface TestQuestionLink {
  test_id: string;
  question_id: string;
  sort_order: number;
  section_label?: string | null;
  marks: number;
  questions?: {
    title: string | null;
    question_type: string;
    difficulty?: string | null;
    status?: string | null;
  } | null;
}

export interface QuestionItem {
  id: string;
  title: string | null;
  prompt: string;
  question_type: string;
  subject_id?: string | null;
  topic_id?: string | null;
  subtopic_id?: string | null;
  difficulty?: string | null;
  marks?: number;
  status?: string;
  metadata?: Record<string, unknown>;
  subjects?: { name: string } | null;
  topics?: { name: string; subject_id?: string } | null;
  subtopics?: { name: string; topic_id?: string } | null;
  question_options?: QuestionOption[];
  coding_test_cases?: CodingTestCase[];
}

export interface QuestionOption {
  id?: string;
  option_key: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface CodingTestCase {
  id?: string;
  input_text: string;
  expected_output: string;
  is_hidden: boolean;
  sort_order: number;
}

export interface ProgrammingProblem {
  id: string;
  question_id: string;
  slug: string;
  active: boolean;
  tags: string[];
  expected_time?: string | null;
  expected_space?: string | null;
  acceptance_rate?: number | null;
  constraints_text?: string | null;
  starter_templates?: Record<string, unknown>;
  examples_json?: unknown[];
  questions?: QuestionItem | null;
}

export interface Batch {
  id: string;
  name: string;
  college_id?: string | null;
  description?: string | null;
  active: boolean;
  student_count?: number;
  created_at?: string;
  colleges?: { name?: string | null; info?: string | null } | null;
}

export interface College {
  id: string;
  name: string;
  info?: string | null;
  active: boolean;
  batch_count?: number;
  created_at?: string;
}

export interface BatchStudent {
  batch_id: string;
  profile_id: string;
  roll_number?: string | null;
  status: string;
  joined_at?: string;
  profile: {
    id?: string;
    email?: string;
    full_name?: string | null;
    phone?: string | null;
    college?: string | null;
    department?: string | null;
    year_of_graduation?: number | null;
  };
  academics: {
    profile_id?: string;
    tenth_percentage?: number | null;
    twelfth_percentage?: number | null;
    graduation_cgpa?: number | null;
    backlogs?: number | null;
    gap_years?: number | null;
    gap_during_grad?: boolean | null;
  };
}
