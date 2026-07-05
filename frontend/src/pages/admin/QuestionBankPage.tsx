import { FormEvent, useEffect, useState } from "react";

import { api } from "../../services/api";
import type {
  CodingTestCase,
  QuestionItem,
  QuestionOption,
  Subject,
  Subtopic,
  Topic,
} from "../../types/admin";

type SampleCase = {
  input: string;
  output: string;
};

type BulkQuestionType = "mcq" | "coding";

const defaultMcqOptions: QuestionOption[] = [
  { option_key: "A", option_text: "", is_correct: true, sort_order: 1 },
  { option_key: "B", option_text: "", is_correct: false, sort_order: 2 },
  { option_key: "C", option_text: "", is_correct: false, sort_order: 3 },
  { option_key: "D", option_text: "", is_correct: false, sort_order: 4 },
];

const defaultCodingTestCases: CodingTestCase[] = [
  { input_text: "2\n1 2\n", expected_output: "3", is_hidden: false, sort_order: 1 },
  { input_text: "4\n5 7 9 11\n", expected_output: "32", is_hidden: true, sort_order: 2 },
];

const defaultSampleCases: SampleCase[] = [
  { input: "4\n1 2 3 4\n", output: "10" },
];

const sharedCsvColumns = [
  "title",
  "prompt",
  "subject",
  "topic",
  "subtopic",
  "difficulty",
  "marks",
  "status",
  "metadata_json",
];

const mcqCsvColumns = [
  ...sharedCsvColumns,
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_options",
];

const codingCsvColumns = [
  ...sharedCsvColumns,
  "test_case_1_input",
  "test_case_1_output",
  "test_case_1_hidden",
  "test_case_2_input",
  "test_case_2_output",
  "test_case_2_hidden",
];


const requiredMcqCsvColumns = ["prompt", "option_a", "option_b", "correct_options"];
const requiredCodingCsvColumns = ["prompt", "test_case_1_input", "test_case_1_output"];

function buildCodingMetadata(
  metadataText: string,
  constraintsText: string,
  sampleCases: SampleCase[],
): string {
  const parsed = metadataText.trim() ? (JSON.parse(metadataText) as Record<string, unknown>) : {};
  return JSON.stringify(
    {
      ...parsed,
      languages: Array.isArray(parsed.languages) ? parsed.languages : ["python", "javascript"],
      evaluation_mode: parsed.evaluation_mode || "stdin_stdout",
      starter_mode: parsed.starter_mode || "function",
      constraints_text: constraintsText,
      sample_cases: sampleCases.filter((sample) => sample.input.trim() || sample.output.trim()),
    },
    null,
    2,
  );
}

function parseCodingMetadata(metadata?: Record<string, unknown>) {
  const source = metadata || {};
  const sampleCases = Array.isArray(source.sample_cases)
    ? source.sample_cases.map((sample) => ({
        input: typeof sample === "object" && sample !== null && "input" in sample ? String(sample.input) : "",
        output: typeof sample === "object" && sample !== null && "output" in sample ? String(sample.output) : "",
      }))
    : defaultSampleCases.map((sample) => ({ ...sample }));

  const { constraints_text, sample_cases, ...remaining } = source;

  return {
    constraintsText: typeof constraints_text === "string" ? constraints_text : "",
    sampleCases: sampleCases.length ? sampleCases : defaultSampleCases.map((sample) => ({ ...sample })),
    metadataText: JSON.stringify(remaining, null, 2),
  };
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
  return dataRows.map((dataRow) =>
    Object.fromEntries(
      normalizedHeaders.map((header, index) => [header, (dataRow[index] || "").trim()]),
    ),
  );
}

function parseBoolean(value: string): boolean {
  return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
}

function normalizeLookup(value: string): string {
  return value.trim().toLowerCase();
}

function resolveSubjectId(value: string, subjects: Subject[]): string | null {
  if (!value.trim()) {
    return null;
  }
  const normalized = normalizeLookup(value);
  return (
    subjects.find(
      (subject) =>
        subject.id === value ||
        normalizeLookup(subject.slug) === normalized ||
        normalizeLookup(subject.name) === normalized,
    )?.id || null
  );
}

function resolveTopicId(value: string, subjectId: string | null, topics: Topic[]): string | null {
  if (!value.trim()) {
    return null;
  }
  const normalized = normalizeLookup(value);
  return (
    topics.find(
      (topic) =>
        (topic.id === value || normalizeLookup(topic.slug) === normalized || normalizeLookup(topic.name) === normalized) &&
        (!subjectId || topic.subject_id === subjectId),
    )?.id || null
  );
}

function resolveSubtopicId(value: string, topicId: string | null, subtopics: Subtopic[]): string | null {
  if (!value.trim()) {
    return null;
  }
  const normalized = normalizeLookup(value);
  return (
    subtopics.find(
      (subtopic) =>
        (subtopic.id === value || normalizeLookup(subtopic.slug) === normalized || normalizeLookup(subtopic.name) === normalized) &&
        (!topicId || subtopic.topic_id === topicId),
    )?.id || null
  );
}

function formatCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function findMissingColumns(row: Record<string, string>, requiredColumns: string[]): string[] {
  return requiredColumns.filter((column) => !(column in row));
}

function findEmptyColumns(row: Record<string, string>, requiredColumns: string[]): string[] {
  return requiredColumns.filter((column) => !row[column]?.trim());
}

function friendlyApiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unable to import CSV. Please check the file and try again.";
  }

  try {
    const parsed = JSON.parse(error.message) as { detail?: unknown };
    if (Array.isArray(parsed.detail)) {
      const missingFields = parsed.detail
        .filter((item) => typeof item === "object" && item !== null && "loc" in item)
        .map((item) => {
          const loc = (item as { loc?: unknown[] }).loc;
          return loc?.[loc.length - 1];
        })
        .filter((field): field is string => typeof field === "string");

      if (missingFields.length) {
        return `Import failed because required values are missing: ${[...new Set(missingFields)].join(", ")}.`;
      }
    }
  } catch {
    // The backend returned a normal message instead of validation JSON.
  }

  return error.message.length > 180
    ? "Unable to import CSV. Please check that the file uses the selected template and all required fields are filled."
    : error.message;
}

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [filter, setFilter] = useState("all");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    prompt: "",
    question_type: "mcq",
    subject_id: "",
    topic_id: "",
    subtopic_id: "",
    difficulty: "medium",
    marks: 1,
    status: "draft",
    metadataText: "{}",
    codingConstraintsText: "",
    codingSampleCases: defaultSampleCases.map((sample) => ({ ...sample })),
    options: defaultMcqOptions.map((option) => ({ ...option })),
    coding_test_cases: defaultCodingTestCases.map((testCase) => ({ ...testCase })),
  });
  const [error, setError] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkQuestionType, setBulkQuestionType] = useState<BulkQuestionType>("mcq");

  const filteredTopics = form.subject_id
    ? topics.filter((topic) => topic.subject_id === form.subject_id)
    : topics;
  const filteredSubtopics = form.topic_id
    ? subtopics.filter((subtopic) => subtopic.topic_id === form.topic_id)
    : subtopics;

  async function load(selectedFilter = filter) {
    const query = selectedFilter === "all" ? "" : `?question_type=${selectedFilter}`;
    const [questionRes, subjectRes, topicRes, subtopicRes] = await Promise.all([
      api<{ items: QuestionItem[] }>(`/admin/questions${query}`),
      api<{ items: Subject[] }>("/admin/subjects"),
      api<{ items: Topic[] }>("/admin/topics"),
      api<{ items: Subtopic[] }>("/admin/subtopics"),
    ]);
    setQuestions(questionRes.items);
    setSubjects(subjectRes.items);
    setTopics(topicRes.items);
    setSubtopics(subtopicRes.items);
  }

  useEffect(() => {
    load("all");
  }, []);

  function resetForm(questionType = "mcq") {
    setEditingQuestionId(null);
    setForm({
      title: "",
      prompt: "",
      question_type: questionType,
      subject_id: "",
      topic_id: "",
      subtopic_id: "",
      difficulty: "medium",
      marks: 1,
      status: "draft",
      metadataText: questionType === "coding" ? JSON.stringify({ languages: ["python", "javascript"], evaluation_mode: "stdin_stdout", starter_mode: "function" }, null, 2) : "{}",
      codingConstraintsText: "",
      codingSampleCases: defaultSampleCases.map((sample) => ({ ...sample })),
      options: defaultMcqOptions.map((option) => ({ ...option })),
      coding_test_cases: defaultCodingTestCases.map((testCase) => ({ ...testCase })),
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    let metadata: Record<string, unknown>;
    try {
      metadata =
        form.question_type === "coding"
          ? JSON.parse(
              buildCodingMetadata(form.metadataText, form.codingConstraintsText, form.codingSampleCases),
            )
          : JSON.parse(form.metadataText || "{}");
    } catch {
      setError("Question metadata JSON is invalid");
      return;
    }

    const payload = {
      title: form.title || null,
      prompt: form.prompt,
      question_type: form.question_type,
      subject_id: form.subject_id || null,
      topic_id: form.topic_id || null,
      subtopic_id: form.subtopic_id || null,
      difficulty: form.difficulty || null,
      marks: Number(form.marks),
      status: form.status,
      metadata,
      options:
        form.question_type === "mcq"
          ? form.options.filter((option) => option.option_text.trim())
          : [],
      coding_test_cases:
        form.question_type === "coding"
          ? form.coding_test_cases
              .filter((testCase) => testCase.input_text.trim() && testCase.expected_output.trim())
              .map((testCase, index) => ({ ...testCase, sort_order: index + 1 }))
          : [],
    };

    try {
      await api(editingQuestionId ? `/admin/questions/${editingQuestionId}` : "/admin/questions", {
        method: editingQuestionId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      await load(filter);
      resetForm(form.question_type);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save question");
    }
  }

  function updateOption(index: number, field: keyof QuestionOption, value: string | boolean | number) {
    const nextOptions = form.options.map((option, optionIndex) =>
      optionIndex === index ? { ...option, [field]: value } : option,
    );
    setForm({ ...form, options: nextOptions });
  }

  function updateTestCase(index: number, field: keyof CodingTestCase, value: string | boolean | number) {
    const nextTestCases = form.coding_test_cases.map((testCase, testCaseIndex) =>
      testCaseIndex === index ? { ...testCase, [field]: value } : testCase,
    );
    setForm({ ...form, coding_test_cases: nextTestCases });
  }

  function updateSampleCase(index: number, field: keyof SampleCase, value: string) {
    const nextSampleCases = form.codingSampleCases.map((sampleCase, sampleIndex) =>
      sampleIndex === index ? { ...sampleCase, [field]: value } : sampleCase,
    );
    setForm({ ...form, codingSampleCases: nextSampleCases });
  }

  function addTestCase() {
    setForm({
      ...form,
      coding_test_cases: [
        ...form.coding_test_cases,
        {
          input_text: "",
          expected_output: "",
          is_hidden: true,
          sort_order: form.coding_test_cases.length + 1,
        },
      ],
    });
  }

  function addSampleCase() {
    setForm({
      ...form,
      codingSampleCases: [...form.codingSampleCases, { input: "", output: "" }],
    });
  }

  function buildBulkPayload(rows: Record<string, string>[], questionType: BulkQuestionType) {
    const requiredColumns = questionType === "mcq" ? requiredMcqCsvColumns : requiredCodingCsvColumns;

    if (!rows.length) {
      throw new Error("The CSV file has no question rows. Add at least one row below the header.");
    }

    const firstRow = rows[0];
    const missingColumns = findMissingColumns(firstRow, requiredColumns);
    if (missingColumns.length) {
      throw new Error(`Missing required column${missingColumns.length > 1 ? "s" : ""}: ${missingColumns.join(", ")}.`);
    }

    if (questionType === "mcq" && Object.keys(firstRow).some((column) => column.startsWith("test_case_"))) {
      throw new Error("This looks like a coding CSV. Select Coding before importing this file.");
    }

    if (questionType === "coding" && Object.keys(firstRow).some((column) => column.startsWith("option_") || column === "correct_options" || column === "correct_option")) {
      throw new Error("This looks like an MCQ CSV. Select MCQ before importing this file.");
    }

    return rows.map((row, rowIndex) => {
      const emptyColumns = findEmptyColumns(row, requiredColumns);
      if (emptyColumns.length) {
        throw new Error(`Row ${rowIndex + 2} is missing: ${emptyColumns.join(", ")}.`);
      }

      const subjectId = resolveSubjectId(row.subject || row.subject_id || "", subjects);
      const topicId = resolveTopicId(row.topic || row.topic_id || "", subjectId, topics);
      const subtopicId = resolveSubtopicId(row.subtopic || row.subtopic_id || "", topicId, subtopics);
      let metadata: Record<string, unknown> = {};

      if (row.metadata || row.metadata_json) {
        try {
          metadata = JSON.parse(row.metadata || row.metadata_json);
        } catch {
          throw new Error(`Row ${rowIndex + 2}: metadata must be valid JSON`);
        }
      }

      if ((row.subject || row.subject_id) && !subjectId) {
        throw new Error(`Row ${rowIndex + 2}: subject was not found`);
      }
      if ((row.topic || row.topic_id) && !topicId) {
        throw new Error(`Row ${rowIndex + 2}: topic was not found`);
      }
      if ((row.subtopic || row.subtopic_id) && !subtopicId) {
        throw new Error(`Row ${rowIndex + 2}: subtopic was not found`);
      }

      const optionKeys = ["a", "b", "c", "d", "e", "f"];
      const correctOptions = new Set(
        (row.correct_options || row.correct_option || "")
          .split(/[|;,]/)
          .map((option) => option.trim().toUpperCase())
          .filter(Boolean),
      );
      const options =
        questionType === "mcq"
          ? optionKeys
              .map((key, index) => ({
                option_key: key.toUpperCase(),
                option_text: row[`option_${key}`],
                is_correct: correctOptions.has(key.toUpperCase()),
                sort_order: index + 1,
              }))
              .filter((option) => option.option_text)
          : [];
      const coding_test_cases =
        questionType === "coding"
          ? Array.from({ length: 10 }, (_, index) => {
              const caseNumber = index + 1;
              return {
                input_text: row[`test_case_${caseNumber}_input`] || "",
                expected_output: row[`test_case_${caseNumber}_output`] || "",
                is_hidden: parseBoolean(row[`test_case_${caseNumber}_hidden`] || ""),
                sort_order: caseNumber,
              };
            }).filter((testCase) => testCase.input_text && testCase.expected_output)
          : [];

      return {
        title: row.title || null,
        prompt: row.prompt,
        question_type: questionType,
        subject_id: subjectId,
        topic_id: topicId,
        subtopic_id: subtopicId,
        difficulty: row.difficulty || null,
        marks: Number(row.marks || 1),
        status: row.status || "draft",
        metadata,
        options,
        coding_test_cases,
      };
    });
  }

  async function importCsv() {
    setError(null);
    setBulkMessage(null);

    if (!bulkFile) {
      setBulkMessage("Choose a CSV file first");
      return;
    }

    try {
      const rows = parseCsv(await bulkFile.text());
      const questions = buildBulkPayload(rows, bulkQuestionType);
      const response = await api<{ created_count: number }>("/admin/questions/bulk", {
        method: "POST",
        body: JSON.stringify({ questions }),
      });
      setBulkMessage(`Imported ${response.created_count} questions`);
      setBulkFile(null);
      await load(filter);
    } catch (importError) {
      setBulkMessage(friendlyApiError(importError));
    }
  }

  function downloadTemplate() {
    const headers = bulkQuestionType === "mcq" ? mcqCsvColumns : codingCsvColumns;
    const example =
      bulkQuestionType === "mcq"
        ? [
            "Sample MCQ",
            "What is 2 + 2?",
            "aptitude",
            "",
            "",
            "easy",
            "1",
            "draft",
            "{}",
            "3",
            "4",
            "5",
            "6",
            "B",
          ]
        : [
            "Sample Coding Question",
            "Read two numbers and print their sum.",
            "coding",
            "",
            "",
            "easy",
            "1",
            "draft",
            "{\"languages\":[\"python\",\"javascript\"],\"evaluation_mode\":\"stdin_stdout\"}",
            "2 3",
            "5",
            "false",
            "10 15",
            "25",
            "true",
          ];
    const csv = `${headers.join(",")}\n${example.map(formatCsvValue).join(",")}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `question-bank-${bulkQuestionType}-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <header className="page-header">
        <h2>Question Bank</h2>
        <p>Create classified MCQ and coding questions with taxonomy mapping, sample cases, constraints, and judge test cases.</p>
      </header>

      <div className="split-grid">
        <form className="panel wide-panel" onSubmit={submit}>
          <div className="panel-header">
            <h3>{editingQuestionId ? "Edit Question" : "Create Question"}</h3>
            {editingQuestionId ? (
              <button className="ghost-button" type="button" onClick={() => resetForm(form.question_type)}>
                Cancel
              </button>
            ) : null}
          </div>
          <div className="inline-fields">
            <select
              value={form.question_type}
              onChange={(event) => resetForm(event.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="coding">Coding</option>
            </select>
            <select
              value={form.difficulty}
              onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="active">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Question title"
          />
          <textarea
            value={form.prompt}
            onChange={(event) => setForm({ ...form, prompt: event.target.value })}
            rows={6}
            placeholder="Question prompt"
          />

          <div className="settings-card">
            <h4>Taxonomy Mapping</h4>
            <div className="inline-fields">
              <select
                value={form.subject_id}
                onChange={(event) =>
                  setForm({ ...form, subject_id: event.target.value, topic_id: "", subtopic_id: "" })
                }
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                value={form.topic_id}
                onChange={(event) =>
                  setForm({ ...form, topic_id: event.target.value, subtopic_id: "" })
                }
              >
                <option value="">Select topic</option>
                {filteredTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              <select
                value={form.subtopic_id}
                onChange={(event) => setForm({ ...form, subtopic_id: event.target.value })}
              >
                <option value="">Select subtopic</option>
                {filteredSubtopics.map((subtopic) => (
                  <option key={subtopic.id} value={subtopic.id}>
                    {subtopic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="number"
            min={1}
            step={0.5}
            value={form.marks}
            onChange={(event) => setForm({ ...form, marks: Number(event.target.value) })}
            placeholder="Marks"
          />

          {form.question_type === "mcq" ? (
            <div className="option-stack">
              <h4>Options</h4>
              {form.options.map((option, index) => (
                <div key={option.option_key} className="option-card">
                  <div className="option-row">
                    <strong>{option.option_key}</strong>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={(event) => updateOption(index, "is_correct", event.target.checked)}
                      />
                      Correct
                    </label>
                  </div>
                  <textarea
                    value={option.option_text}
                    onChange={(event) => updateOption(index, "option_text", event.target.value)}
                    rows={2}
                    placeholder={`Option ${option.option_key}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="settings-card">
                <h4>Constraints</h4>
                <textarea
                  value={form.codingConstraintsText}
                  onChange={(event) => setForm({ ...form, codingConstraintsText: event.target.value })}
                  rows={4}
                  placeholder="1 <= n <= 10^5&#10;Array values are non-negative integers."
                />
              </div>

              <div className="settings-card">
                <div className="panel-header">
                  <h4>Sample Input / Output</h4>
                  <button className="ghost-button" type="button" onClick={addSampleCase}>
                    Add Sample
                  </button>
                </div>
                <div className="option-stack">
                  {form.codingSampleCases.map((sampleCase, index) => (
                    <div key={`sample-${index}`} className="option-card">
                      <strong>Sample {index + 1}</strong>
                      <textarea
                        value={sampleCase.input}
                        onChange={(event) => updateSampleCase(index, "input", event.target.value)}
                        rows={3}
                        placeholder="Sample input"
                      />
                      <textarea
                        value={sampleCase.output}
                        onChange={(event) => updateSampleCase(index, "output", event.target.value)}
                        rows={2}
                        placeholder="Sample output"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-card">
                <div className="panel-header">
                  <h4>Execution Test Cases</h4>
                  <button className="ghost-button" type="button" onClick={addTestCase}>
                    Add Test Case
                  </button>
                </div>
                <p className="helper-text">Use visible rows for public samples and hidden rows for judge-only evaluation.</p>
                <div className="option-stack">
                  {form.coding_test_cases.map((testCase, index) => (
                    <div key={`case-${index}`} className="option-card">
                      <div className="option-row">
                        <strong>Case {index + 1}</strong>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={testCase.is_hidden}
                            onChange={(event) => updateTestCase(index, "is_hidden", event.target.checked)}
                          />
                          Hidden judge case
                        </label>
                      </div>
                      <textarea
                        value={testCase.input_text}
                        onChange={(event) => updateTestCase(index, "input_text", event.target.value)}
                        rows={3}
                        placeholder="stdin / input"
                      />
                      <textarea
                        value={testCase.expected_output}
                        onChange={(event) => updateTestCase(index, "expected_output", event.target.value)}
                        rows={2}
                        placeholder="Expected output"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-card">
                <h4>Advanced Coding Metadata</h4>
                <textarea
                  value={form.metadataText}
                  onChange={(event) => setForm({ ...form, metadataText: event.target.value })}
                  rows={8}
                  placeholder='{"languages":["python","javascript"],"starter_mode":"function"}'
                />
              </div>
            </>
          )}

          {form.question_type === "mcq" ? (
            <textarea
              value={form.metadataText}
              onChange={(event) => setForm({ ...form, metadataText: event.target.value })}
              rows={8}
              placeholder="Metadata JSON"
            />
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit">{editingQuestionId ? "Update Question" : "Create Question"}</button>
        </form>

        <aside className="side-stack">
          <section className="panel">
            <div className="panel-header">
              <h3>Bulk CSV Import</h3>
              <button className="ghost-button" type="button" onClick={downloadTemplate}>
                Template
              </button>
            </div>
            <div className="option-stack">
              <select
                value={bulkQuestionType}
                onChange={(event) => {
                  setBulkQuestionType(event.target.value as BulkQuestionType);
                  setBulkMessage(null);
                }}
              >
                <option value="mcq">MCQ CSV</option>
                <option value="coding">Coding CSV</option>
              </select>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setBulkFile(event.target.files?.[0] || null)}
              />
              {bulkMessage ? <p className={bulkMessage.startsWith("Imported") ? "helper-text" : "error-text"}>{bulkMessage}</p> : null}
              <button type="button" onClick={importCsv}>
                Import CSV
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Recent Questions</h3>
              <select
                value={filter}
                onChange={async (event) => {
                  const nextFilter = event.target.value;
                  setFilter(nextFilter);
                  await load(nextFilter);
                }}
              >
                <option value="all">All</option>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
              </select>
            </div>
            <ul className="item-list">
            {questions.map((question) => (
              <li key={question.id}>
                <div className="list-row">
                  <div className="item-meta">
                    <strong>{question.title || "Untitled question"}</strong>
                    <span>{question.question_type} | {question.difficulty || "unset"} | {question.status || "draft"}</span>
                    <span>
                      {[question.subjects?.name, question.topics?.name, question.subtopics?.name].filter(Boolean).join(" / ") || "Unmapped taxonomy"}
                    </span>
                  </div>
                  <div className="action-row">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        const codingMeta = parseCodingMetadata(question.metadata);
                        setEditingQuestionId(question.id);
                        setForm({
                          title: question.title || "",
                          prompt: question.prompt,
                          question_type: question.question_type,
                          subject_id: question.subject_id || "",
                          topic_id: question.topic_id || "",
                          subtopic_id: question.subtopic_id || "",
                          difficulty: question.difficulty || "medium",
                          marks: Number(question.marks || 1),
                          status: question.status || "draft",
                          metadataText: JSON.stringify(question.question_type === "coding" ? JSON.parse(codingMeta.metadataText || "{}") : (question.metadata || {}), null, 2),
                          codingConstraintsText: codingMeta.constraintsText,
                          codingSampleCases: codingMeta.sampleCases,
                          options:
                            question.question_options?.length
                              ? question.question_options.map((option) => ({
                                  option_key: option.option_key,
                                  option_text: option.option_text,
                                  is_correct: option.is_correct,
                                  sort_order: option.sort_order,
                                }))
                              : defaultMcqOptions.map((option) => ({ ...option })),
                          coding_test_cases:
                            question.coding_test_cases?.length
                              ? question.coding_test_cases.map((testCase) => ({
                                  input_text: testCase.input_text,
                                  expected_output: testCase.expected_output,
                                  is_hidden: testCase.is_hidden,
                                  sort_order: testCase.sort_order,
                                }))
                              : defaultCodingTestCases.map((testCase) => ({ ...testCase })),
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={async () => {
                      await api(`/admin/questions/${question.id}`, { method: "DELETE" });
                      if (editingQuestionId === question.id) {
                        resetForm();
                      }
                      load(filter);
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
                <p>{question.prompt}</p>
                {question.question_options?.length ? (
                  <div className="tag-row">
                    {question.question_options.map((option) => (
                      <span
                        key={`${question.id}-${option.option_key}`}
                        className={option.is_correct ? "tag success" : "tag"}
                      >
                        {option.option_key}: {option.option_text}
                      </span>
                    ))}
                  </div>
                ) : null}
                {question.coding_test_cases?.length ? (
                  <div className="tag-row">
                    {question.coding_test_cases.map((testCase, index) => (
                      <span key={`${question.id}-case-${index}`} className={testCase.is_hidden ? "tag" : "tag success"}>
                        {testCase.is_hidden ? "Hidden" : "Sample"} case {index + 1}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
