import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Filter,
  Layers3,
  ListChecks,
  Plus,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";

import { api } from "../../services/api";
import type {
  CodingTestCase,
  QuestionAudit,
  QuestionItem,
  QuestionOption,
  Subject,
  Subtopic,
  Topic,
} from "../../types/admin";

type QuestionType = "mcq" | "coding";
type QuestionStatus = "draft" | "review" | "published" | "archived";

type QuestionForm = {
  title: string;
  prompt: string;
  question_type: QuestionType;
  subject_id: string;
  topic_id: string;
  subtopic_id: string;
  difficulty: string;
  marks: number;
  status: QuestionStatus;
  metadataText: string;
  options: QuestionOption[];
  coding_test_cases: CodingTestCase[];
};

type ImportRow = Record<string, string>;
type ImportPreview = {
  rowNumber: number;
  source: ImportRow;
  payload?: ReturnType<typeof buildQuestionPayload>;
  errors: string[];
};

const defaultMcqOptions: QuestionOption[] = [
  { option_key: "A", option_text: "", is_correct: true, sort_order: 1 },
  { option_key: "B", option_text: "", is_correct: false, sort_order: 2 },
  { option_key: "C", option_text: "", is_correct: false, sort_order: 3 },
  { option_key: "D", option_text: "", is_correct: false, sort_order: 4 },
];

const defaultCodingCases: CodingTestCase[] = [
  { input_text: "", expected_output: "", is_hidden: false, sort_order: 1 },
  { input_text: "", expected_output: "", is_hidden: true, sort_order: 2 },
];

const importColumns = [
  "question_type",
  "subject_slug",
  "topic_slug",
  "subtopic_slug",
  "difficulty",
  "marks",
  "status",
  "title",
  "prompt",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_options",
  "test_case_1_input",
  "test_case_1_output",
  "test_case_1_hidden",
  "test_case_2_input",
  "test_case_2_output",
  "test_case_2_hidden",
  "metadata_json",
];

const emptyForm = (questionType: QuestionType = "mcq"): QuestionForm => ({
  title: "",
  prompt: "",
  question_type: questionType,
  subject_id: "",
  topic_id: "",
  subtopic_id: "",
  difficulty: "medium",
  marks: 1,
  status: "draft",
  metadataText:
    questionType === "coding"
      ? JSON.stringify({ languages: ["python", "javascript"], evaluation_mode: "stdin_stdout" }, null, 2)
      : "{}",
  options: defaultMcqOptions.map((option) => ({ ...option })),
  coding_test_cases: defaultCodingCases.map((testCase) => ({ ...testCase })),
});

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function normalizeStatus(value?: string | null): QuestionStatus {
  const normalized = normalize(value);
  if (normalized === "active" || normalized === "published") return "published";
  if (normalized === "review" || normalized === "archived") return normalized;
  return "draft";
}

function parseBoolean(value?: string) {
  return ["1", "true", "yes", "y"].includes(normalize(value));
}

function buildQuestionPayload(form: QuestionForm) {
  const metadata = JSON.parse(form.metadataText || "{}") as Record<string, unknown>;
  return {
    title: form.title.trim() || null,
    prompt: form.prompt.trim(),
    question_type: form.question_type,
    subject_id: form.subject_id || null,
    topic_id: form.topic_id || null,
    subtopic_id: form.subtopic_id || null,
    difficulty: form.difficulty || null,
    marks: Number(form.marks || 1),
    status: form.status,
    metadata,
    options:
      form.question_type === "mcq"
        ? form.options
            .filter((option) => option.option_text.trim())
            .map((option, index) => ({ ...option, sort_order: index + 1 }))
        : [],
    coding_test_cases:
      form.question_type === "coding"
        ? form.coding_test_cases
            .filter((testCase) => testCase.input_text.trim() && testCase.expected_output.trim())
            .map((testCase, index) => ({ ...testCase, sort_order: index + 1 }))
        : [],
  };
}

function findByIdSlugOrName<T extends { id: string; slug?: string; name: string }>(items: T[], value: string) {
  const target = normalize(value);
  if (!target) return null;
  return (
    items.find((item) => item.id === value || normalize(item.slug) === target || normalize(item.name) === target) || null
  );
}

function taxonomyPath(question: QuestionItem) {
  return [question.subjects?.name, question.topics?.name, question.subtopics?.name].filter(Boolean).join(" / ");
}

function validateForm(form: QuestionForm) {
  const issues: string[] = [];
  if (!form.prompt.trim()) issues.push("Question prompt is required.");

  if (form.status === "published") {
    if (!form.subject_id || !form.topic_id || !form.subtopic_id) {
      issues.push("Published questions need subject, topic, and subtopic.");
    }
  }

  if (form.question_type === "mcq") {
    const filledOptions = form.options.filter((option) => option.option_text.trim());
    if (filledOptions.length < 2) issues.push("MCQ needs at least two filled options.");
    if (!filledOptions.some((option) => option.is_correct)) issues.push("MCQ needs at least one correct answer.");
  }

  if (form.question_type === "coding") {
    const cases = form.coding_test_cases.filter((testCase) => testCase.input_text.trim() && testCase.expected_output.trim());
    if (!cases.length) issues.push("Coding question needs at least one judge test case.");
  }

  try {
    JSON.parse(form.metadataText || "{}");
  } catch {
    issues.push("Metadata JSON is invalid.");
  }

  return issues;
}

function readWorkbookRows(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        resolve(
          rows.map((row) =>
            Object.fromEntries(
              Object.entries(row).map(([key, value]) => [normalize(key).replace(/\s+/g, "_"), String(value ?? "").trim()]),
            ),
          ),
        );
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function makeTemplate() {
  const sample = {
    question_type: "mcq",
    subject_slug: "aptitude",
    topic_slug: "number-system",
    subtopic_slug: "prime-numbers",
    difficulty: "medium",
    marks: 1,
    status: "draft",
    title: "Sample MCQ",
    prompt: "What is 2 + 2?",
    option_a: "3",
    option_b: "4",
    option_c: "5",
    option_d: "6",
    correct_options: "B",
    test_case_1_input: "",
    test_case_1_output: "",
    test_case_1_hidden: "",
    test_case_2_input: "",
    test_case_2_output: "",
    test_case_2_hidden: "",
    metadata_json: "{}",
  };
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([sample], { header: importColumns });
  XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
  XLSX.writeFile(workbook, "aivalytics-question-import-template.xlsx");
}

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [audit, setAudit] = useState<QuestionAudit | null>(null);
  const [form, setForm] = useState<QuestionForm>(() => emptyForm());
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | QuestionType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | QuestionStatus | "issues">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview[]>([]);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const formIssues = validateForm(form);
  const filteredTopics = form.subject_id ? topics.filter((topic) => topic.subject_id === form.subject_id) : topics;
  const filteredSubtopics = form.topic_id ? subtopics.filter((subtopic) => subtopic.topic_id === form.topic_id) : subtopics;
  const auditQuestionIds = useMemo(() => new Set((audit?.question_issues || []).map((issue) => issue.id)), [audit]);

  const taxonomyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((question) => {
      if (question.subject_id) counts.set(`subject:${question.subject_id}`, (counts.get(`subject:${question.subject_id}`) || 0) + 1);
      if (question.topic_id) counts.set(`topic:${question.topic_id}`, (counts.get(`topic:${question.topic_id}`) || 0) + 1);
      if (question.subtopic_id) counts.set(`subtopic:${question.subtopic_id}`, (counts.get(`subtopic:${question.subtopic_id}`) || 0) + 1);
    });
    return counts;
  }, [questions]);

  const visibleQuestions = useMemo(() => {
    const query = normalize(search);
    return questions.filter((question) => {
      const matchesSubject = !selectedSubjectId || question.subject_id === selectedSubjectId;
      const matchesTopic = !selectedTopicId || question.topic_id === selectedTopicId;
      const matchesSubtopic = !selectedSubtopicId || question.subtopic_id === selectedSubtopicId;
      const matchesType = typeFilter === "all" || question.question_type === typeFilter;
      const questionStatus = normalizeStatus(question.status);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "issues" ? auditQuestionIds.has(question.id) : questionStatus === statusFilter);
      const haystack = normalize(`${question.title || ""} ${question.prompt} ${taxonomyPath(question)}`);
      return matchesSubject && matchesTopic && matchesSubtopic && matchesType && matchesStatus && haystack.includes(query);
    });
  }, [auditQuestionIds, questions, search, selectedSubjectId, selectedSubtopicId, selectedTopicId, statusFilter, typeFilter]);

  async function load() {
    setLoading(true);
    const [questionRes, subjectRes, topicRes, subtopicRes, auditRes] = await Promise.all([
      api<{ items: QuestionItem[] }>("/admin/questions"),
      api<{ items: Subject[] }>("/admin/subjects"),
      api<{ items: Topic[] }>("/admin/topics"),
      api<{ items: Subtopic[] }>("/admin/subtopics"),
      api<QuestionAudit>("/admin/questions/audit"),
    ]);
    setQuestions(questionRes.items);
    setSubjects(subjectRes.items);
    setTopics(topicRes.items);
    setSubtopics(subtopicRes.items);
    setAudit(auditRes);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load question bank");
      setLoading(false);
    });
  }, []);

  function resetEditor(nextType: QuestionType = form.question_type) {
    setEditingQuestionId(null);
    setForm({
      ...emptyForm(nextType),
      subject_id: selectedSubjectId,
      topic_id: selectedTopicId,
      subtopic_id: selectedSubtopicId,
    });
    setError(null);
  }

  function chooseTaxonomy(subjectId = "", topicId = "", subtopicId = "") {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId(topicId);
    setSelectedSubtopicId(subtopicId);
    setForm((current) => ({
      ...current,
      subject_id: subjectId || current.subject_id,
      topic_id: topicId || "",
      subtopic_id: subtopicId || "",
    }));
  }

  function editQuestion(question: QuestionItem) {
    setEditingQuestionId(question.id);
    setForm({
      title: question.title || "",
      prompt: question.prompt,
      question_type: question.question_type === "coding" ? "coding" : "mcq",
      subject_id: question.subject_id || "",
      topic_id: question.topic_id || "",
      subtopic_id: question.subtopic_id || "",
      difficulty: question.difficulty || "medium",
      marks: Number(question.marks || 1),
      status: normalizeStatus(question.status),
      metadataText: JSON.stringify(question.metadata || {}, null, 2),
      options: question.question_options?.length
        ? question.question_options.map((option) => ({ ...option }))
        : defaultMcqOptions.map((option) => ({ ...option })),
      coding_test_cases: question.coding_test_cases?.length
        ? question.coding_test_cases.map((testCase) => ({ ...testCase }))
        : defaultCodingCases.map((testCase) => ({ ...testCase })),
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const issues = validateForm(form);
    if (issues.length) {
      setError(issues[0]);
      return;
    }

    try {
      await api(editingQuestionId ? `/admin/questions/${editingQuestionId}` : "/admin/questions", {
        method: editingQuestionId ? "PUT" : "POST",
        body: JSON.stringify(buildQuestionPayload(form)),
      });
      setNotice(editingQuestionId ? "Question updated." : "Question created.");
      resetEditor(form.question_type);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save question");
    }
  }

  function updateOption(index: number, patch: Partial<QuestionOption>) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option)),
    }));
  }

  function updateCase(index: number, patch: Partial<CodingTestCase>) {
    setForm((current) => ({
      ...current,
      coding_test_cases: current.coding_test_cases.map((testCase, caseIndex) =>
        caseIndex === index ? { ...testCase, ...patch } : testCase,
      ),
    }));
  }

  function previewRows(rows: ImportRow[]) {
    const previews = rows.map((row, rowIndex) => {
      const errors: string[] = [];
      const questionType = normalize(row.question_type) === "coding" ? "coding" : "mcq";
      const subject = findByIdSlugOrName(subjects, row.subject_slug || row.subject || row.subject_id || "");
      const topicCandidates = subject ? topics.filter((topic) => topic.subject_id === subject.id) : topics;
      const topic = findByIdSlugOrName(topicCandidates, row.topic_slug || row.topic || row.topic_id || "");
      const subtopicCandidates = topic ? subtopics.filter((subtopic) => subtopic.topic_id === topic.id) : subtopics;
      const subtopic = findByIdSlugOrName(subtopicCandidates, row.subtopic_slug || row.subtopic || row.subtopic_id || "");

      if (!row.prompt?.trim()) errors.push("Prompt is required");
      if ((row.subject_slug || row.subject || row.subject_id) && !subject) errors.push("Subject was not found");
      if ((row.topic_slug || row.topic || row.topic_id) && !topic) errors.push("Topic was not found under the selected subject");
      if ((row.subtopic_slug || row.subtopic || row.subtopic_id) && !subtopic) errors.push("Subtopic was not found under the selected topic");

      const options =
        questionType === "mcq"
          ? ["a", "b", "c", "d", "e", "f"]
              .map((key, optionIndex) => ({
                option_key: key.toUpperCase(),
                option_text: row[`option_${key}`] || "",
                is_correct: (row.correct_options || row.correct_option || "")
                  .split(/[|;,]/)
                  .map((option) => normalize(option).toUpperCase())
                  .includes(key.toUpperCase()),
                sort_order: optionIndex + 1,
              }))
              .filter((option) => option.option_text)
          : [];
      const testCases =
        questionType === "coding"
          ? Array.from({ length: 10 }, (_, index) => {
              const caseNumber = index + 1;
              return {
                input_text: row[`test_case_${caseNumber}_input`] || "",
                expected_output: row[`test_case_${caseNumber}_output`] || "",
                is_hidden: parseBoolean(row[`test_case_${caseNumber}_hidden`]),
                sort_order: caseNumber,
              };
            }).filter((testCase) => testCase.input_text && testCase.expected_output)
          : [];

      if (questionType === "mcq" && options.length < 2) errors.push("MCQ needs at least two options");
      if (questionType === "mcq" && !options.some((option) => option.is_correct)) errors.push("MCQ needs a correct option");
      if (questionType === "coding" && !testCases.length) errors.push("Coding question needs at least one test case");

      let metadata: Record<string, unknown> = {};
      if (row.metadata_json || row.metadata) {
        try {
          metadata = JSON.parse(row.metadata_json || row.metadata || "{}");
        } catch {
          errors.push("Metadata JSON is invalid");
        }
      }

      const rowForm: QuestionForm = {
        title: row.title || "",
        prompt: row.prompt || "",
        question_type: questionType,
        subject_id: subject?.id || "",
        topic_id: topic?.id || "",
        subtopic_id: subtopic?.id || "",
        difficulty: row.difficulty || "medium",
        marks: Number(row.marks || 1),
        status: normalizeStatus(row.status),
        metadataText: JSON.stringify(metadata),
        options,
        coding_test_cases: testCases,
      };

      errors.push(...validateForm(rowForm).filter((issue) => !errors.includes(issue)));

      return {
        rowNumber: rowIndex + 2,
        source: row,
        payload: errors.length ? undefined : buildQuestionPayload(rowForm),
        errors,
      };
    });
    setImportPreview(previews);
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    setNotice(null);
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      previewRows(await readWorkbookRows(file));
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Unable to read import file");
    } finally {
      event.target.value = "";
    }
  }

  async function importValidRows() {
    const validRows = importPreview.filter((row) => row.payload).map((row) => row.payload);
    if (!validRows.length) {
      setError("No valid rows are ready to import.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const response = await api<{ created_count: number }>("/admin/questions/bulk", {
        method: "POST",
        body: JSON.stringify({ questions: validRows }),
      });
      setNotice(`Imported ${response.created_count} questions.`);
      setImportPreview([]);
      await load();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import questions");
    } finally {
      setImporting(false);
    }
  }

  const selectedPath = [
    subjects.find((subject) => subject.id === selectedSubjectId)?.name,
    topics.find((topic) => topic.id === selectedTopicId)?.name,
    subtopics.find((subtopic) => subtopic.id === selectedSubtopicId)?.name,
  ].filter(Boolean);

  return (
    <section className="question-admin-page">
      <header className="page-header question-bank-hero">
        <div>
          <p className="eyebrow">Question Operations</p>
          <h2>Question Bank</h2>
          <p>Classify, validate, import, and prepare questions for clean test composition.</p>
        </div>
        <div className="question-health-grid">
          <span>
            <strong>{questions.length}</strong>
            Questions
          </span>
          <span>
            <strong>{audit?.summary.question_issues || 0}</strong>
            Content issues
          </span>
          <span>
            <strong>{audit?.summary.test_issues || 0}</strong>
            Test mismatches
          </span>
        </div>
      </header>

      <div className="question-command-bar">
        <label className="batch-search question-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, prompt, taxonomy..." />
        </label>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | QuestionType)}>
          <option value="all">All types</option>
          <option value="mcq">MCQ</option>
          <option value="coding">Coding</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
          <option value="issues">Needs repair</option>
        </select>
        <button className="ghost-button" type="button" onClick={() => resetEditor("mcq")}>
          <Plus size={16} />
          New Question
        </button>
      </div>

      {notice ? <p className="success-banner">{notice}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="question-workspace">
        <aside className="question-taxonomy-panel panel">
          <div className="panel-header">
            <div>
              <h3>Taxonomy</h3>
              <p className="helper-text">{selectedPath.length ? selectedPath.join(" / ") : "All content"}</p>
            </div>
            <button className="ghost-button icon-button" type="button" onClick={() => chooseTaxonomy()} aria-label="Show all taxonomy">
              <Filter size={16} />
            </button>
          </div>
          <div className="taxonomy-tree">
            {subjects.map((subject) => {
              const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id);
              return (
                <div key={subject.id} className="taxonomy-group">
                  <button
                    className={`taxonomy-node ${selectedSubjectId === subject.id && !selectedTopicId ? "active" : ""}`}
                    type="button"
                    onClick={() => chooseTaxonomy(subject.id)}
                  >
                    <Layers3 size={15} />
                    <span>{subject.name}</span>
                    <strong>{taxonomyCounts.get(`subject:${subject.id}`) || 0}</strong>
                  </button>
                  {subjectTopics.map((topic) => {
                    const topicSubtopics = subtopics.filter((subtopic) => subtopic.topic_id === topic.id);
                    return (
                      <div key={topic.id} className="taxonomy-branch">
                        <button
                          className={`taxonomy-node ${selectedTopicId === topic.id && !selectedSubtopicId ? "active" : ""}`}
                          type="button"
                          onClick={() => chooseTaxonomy(subject.id, topic.id)}
                        >
                          <ChevronRight size={14} />
                          <span>{topic.name}</span>
                          <strong>{taxonomyCounts.get(`topic:${topic.id}`) || 0}</strong>
                        </button>
                        {topicSubtopics.map((subtopic) => (
                          <button
                            key={subtopic.id}
                            className={`taxonomy-node leaf ${selectedSubtopicId === subtopic.id ? "active" : ""}`}
                            type="button"
                            onClick={() => chooseTaxonomy(subject.id, topic.id, subtopic.id)}
                          >
                            <span>{subtopic.name}</span>
                            <strong>{taxonomyCounts.get(`subtopic:${subtopic.id}`) || 0}</strong>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="question-list-panel panel">
          <div className="panel-header">
            <div>
              <h3>Content Queue</h3>
              <p className="helper-text">{loading ? "Loading..." : `${visibleQuestions.length} matching questions`}</p>
            </div>
            <span className="tag success">
              <ShieldCheck size={14} /> Guarded taxonomy
            </span>
          </div>

          <div className="question-list">
            {visibleQuestions.length ? (
              visibleQuestions.map((question) => {
                const issues = audit?.question_issues.find((issue) => issue.id === question.id)?.issues || [];
                return (
                  <article key={question.id} className={`question-row ${issues.length ? "needs-repair" : ""}`}>
                    <div className="question-row-main">
                      <span className={`status-pill ${normalizeStatus(question.status)}`}>{normalizeStatus(question.status)}</span>
                      <strong>{question.title || "Untitled question"}</strong>
                      <p>{question.prompt}</p>
                      <div className="tag-row">
                        <span className="tag">{question.question_type}</span>
                        <span className="tag">{question.difficulty || "unset"}</span>
                        <span className="tag">{question.marks || 1} mark</span>
                        <span className="tag">{taxonomyPath(question) || "Unmapped taxonomy"}</span>
                      </div>
                      {issues.length ? (
                        <div className="issue-list">
                          {issues.map((issue) => (
                            <span key={issue}>
                              <AlertTriangle size={13} /> {issue}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="action-row">
                      <button className="ghost-button" type="button" onClick={() => editQuestion(question)}>
                        Edit
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={async () => {
                          await api(`/admin/questions/${question.id}`, { method: "DELETE" });
                          await load();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">
                <ClipboardCheck size={28} />
                <strong>No questions match this view</strong>
                <p>Adjust filters or create a question inside the selected taxonomy bucket.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="question-editor-panel panel">
          <form onSubmit={submit} className="question-editor-form">
            <div className="panel-header">
              <div>
                <h3>{editingQuestionId ? "Edit Question" : "Create Question"}</h3>
                <p className="helper-text">Save drafts freely. Publishing requires a complete taxonomy path.</p>
              </div>
              {editingQuestionId ? (
                <button className="ghost-button" type="button" onClick={() => resetEditor(form.question_type)}>
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="inline-fields">
              <select value={form.question_type} onChange={(event) => resetEditor(event.target.value as QuestionType)}>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
              </select>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as QuestionStatus })}>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Question title" />
            <textarea value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} rows={5} placeholder="Question prompt" />

            <div className="settings-card compact-settings">
              <h4>Taxonomy Path</h4>
              <select
                value={form.subject_id}
                onChange={(event) => setForm({ ...form, subject_id: event.target.value, topic_id: "", subtopic_id: "" })}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select value={form.topic_id} onChange={(event) => setForm({ ...form, topic_id: event.target.value, subtopic_id: "" })}>
                <option value="">Select topic</option>
                {filteredTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              <select value={form.subtopic_id} onChange={(event) => setForm({ ...form, subtopic_id: event.target.value })}>
                <option value="">Select subtopic</option>
                {filteredSubtopics.map((subtopic) => (
                  <option key={subtopic.id} value={subtopic.id}>
                    {subtopic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-fields">
              <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <input type="number" min={0.5} step={0.5} value={form.marks} onChange={(event) => setForm({ ...form, marks: Number(event.target.value) })} />
            </div>

            {form.question_type === "mcq" ? (
              <div className="option-stack">
                <h4>Answer Options</h4>
                {form.options.map((option, index) => (
                  <label key={option.option_key} className="answer-option-row">
                    <input type="checkbox" checked={option.is_correct} onChange={(event) => updateOption(index, { is_correct: event.target.checked })} />
                    <strong>{option.option_key}</strong>
                    <input value={option.option_text} onChange={(event) => updateOption(index, { option_text: event.target.value })} placeholder={`Option ${option.option_key}`} />
                  </label>
                ))}
              </div>
            ) : (
              <div className="option-stack">
                <div className="panel-header compact-header">
                  <h4>Judge Test Cases</h4>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        coding_test_cases: [
                          ...form.coding_test_cases,
                          { input_text: "", expected_output: "", is_hidden: true, sort_order: form.coding_test_cases.length + 1 },
                        ],
                      })
                    }
                  >
                    Add Case
                  </button>
                </div>
                {form.coding_test_cases.map((testCase, index) => (
                  <div key={`case-${index}`} className="test-case-row">
                    <div className="option-row">
                      <strong>Case {index + 1}</strong>
                      <label className="checkbox">
                        <input type="checkbox" checked={testCase.is_hidden} onChange={(event) => updateCase(index, { is_hidden: event.target.checked })} />
                        Hidden
                      </label>
                    </div>
                    <textarea rows={2} value={testCase.input_text} onChange={(event) => updateCase(index, { input_text: event.target.value })} placeholder="Input" />
                    <textarea rows={2} value={testCase.expected_output} onChange={(event) => updateCase(index, { expected_output: event.target.value })} placeholder="Expected output" />
                  </div>
                ))}
              </div>
            )}

            <details className="metadata-details">
              <summary>Advanced metadata JSON</summary>
              <textarea value={form.metadataText} onChange={(event) => setForm({ ...form, metadataText: event.target.value })} rows={5} />
            </details>

            <div className="validation-panel">
              <strong>
                <ListChecks size={15} /> Publish readiness
              </strong>
              {formIssues.length ? (
                formIssues.map((issue) => <span key={issue}>{issue}</span>)
              ) : (
                <span className="ready-text">
                  <CheckCircle2 size={14} /> Ready to save
                </span>
              )}
            </div>

            <button type="submit">{editingQuestionId ? "Update Question" : "Create Question"}</button>
          </form>
        </aside>
      </div>

      <section className="question-audit-panel panel">
        <div className="panel-header">
          <div>
            <h3>Audit Center</h3>
            <p className="helper-text">Existing content and tests that need taxonomy cleanup before production use.</p>
          </div>
          <span className="tag">
            <AlertTriangle size={14} />
            {(audit?.summary.question_issues || 0) + (audit?.summary.test_issues || 0)} open
          </span>
        </div>
        <div className="audit-grid">
          <div>
            <h4>Question Repairs</h4>
            {audit?.question_issues.length ? (
              <ul className="audit-list">
                {audit.question_issues.slice(0, 6).map((issue) => (
                  <li key={issue.id}>
                    <strong>{issue.title}</strong>
                    <span>{issue.issues.join(" | ")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="helper-text">No question-level taxonomy or readiness issues found.</p>
            )}
          </div>
          <div>
            <h4>Test Mismatches</h4>
            {audit?.test_issues.length ? (
              <ul className="audit-list">
                {audit.test_issues.slice(0, 6).map((issue) => (
                  <li key={`${issue.test_id}-${issue.question_id}`}>
                    <strong>{issue.test_title}</strong>
                    <span>
                      {issue.question_title}: {issue.issues.join(" | ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="helper-text">No test/question taxonomy mismatch found.</p>
            )}
          </div>
        </div>
      </section>

      <section className="question-import-panel panel">
        <div className="panel-header">
          <div>
            <h3>Bulk Import</h3>
            <p className="helper-text">Upload XLSX, XLS, or CSV. Review invalid rows before importing.</p>
          </div>
          <div className="action-row">
            <button className="ghost-button" type="button" onClick={makeTemplate}>
              <Download size={16} /> Template
            </button>
            <label className="ghost-button upload-button">
              <Upload size={16} /> Upload
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} />
            </label>
          </div>
        </div>

        {importPreview.length ? (
          <>
            <div className="import-summary">
              <span>
                <FileSpreadsheet size={16} />
                {importPreview.filter((row) => row.payload).length} valid
              </span>
              <span>
                <AlertTriangle size={16} />
                {importPreview.filter((row) => row.errors.length).length} need repair
              </span>
              <button type="button" onClick={importValidRows} disabled={importing}>
                {importing ? "Importing..." : "Import Valid Rows"}
              </button>
            </div>
            <div className="batch-table-wrap">
              <table className="batch-student-table question-import-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Type</th>
                    <th>Title / Prompt</th>
                    <th>Status</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>{row.source.question_type || "mcq"}</td>
                      <td>
                        <strong>{row.source.title || "Untitled"}</strong>
                        <span>{row.source.prompt || "No prompt"}</span>
                      </td>
                      <td>{row.source.status || "draft"}</td>
                      <td>
                        {row.errors.length ? (
                          row.errors.map((issue) => <span key={issue} className="error-chip">{issue}</span>)
                        ) : (
                          <span className="success-chip">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state compact-empty">
            <Archive size={24} />
            <strong>No import staged</strong>
            <p>Use the template to keep taxonomy slugs and question fields consistent.</p>
          </div>
        )}
      </section>
    </section>
  );
}
