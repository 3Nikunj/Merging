import { FormEvent, useEffect, useState } from "react";

import { api } from "../../services/api";
import type {
  QuestionItem,
  StructuredTestSettings,
  Subject,
  TestItem,
  TestQuestionLink,
  Topic,
} from "../../types/admin";

type TestSettingsEditorState = StructuredTestSettings & {
  extraJson: string;
};

const defaultStructuredSettings: StructuredTestSettings = {
  instructions: ["Each question has one correct answer."],
  scoring: {
    total_marks: 60,
    negative_marking: 0.25,
  },
  behavior: {
    auto_submit_on_timeout: true,
    allow_question_navigation: true,
    allow_review_before_submit: true,
  },
  category: "",
  difficulty: "Medium",
  questions: 0,
  is_premium: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildDefaultEditorState(): TestSettingsEditorState {
  return {
    ...defaultStructuredSettings,
    instructions: [...defaultStructuredSettings.instructions],
    scoring: { ...defaultStructuredSettings.scoring },
    behavior: { ...defaultStructuredSettings.behavior },
    extraJson: "{}",
  };
}

function parseSettingsForEditor(settings: Record<string, unknown> | undefined): TestSettingsEditorState {
  const source = settings ?? {};
  const scoring = isRecord(source.scoring) ? source.scoring : {};
  const behavior = isRecord(source.behavior) ? source.behavior : {};

  const knownKeys = new Set([
    "instructions",
    "scoring",
    "behavior",
    "category",
    "difficulty",
    "questions",
    "is_premium",
  ]);

  const extras = Object.fromEntries(
    Object.entries(source).filter(([key]) => !knownKeys.has(key)),
  );

  return {
    instructions: Array.isArray(source.instructions)
      ? source.instructions.map((item) => String(item))
      : [...defaultStructuredSettings.instructions],
    scoring: {
      total_marks:
        typeof scoring.total_marks === "number"
          ? scoring.total_marks
          : defaultStructuredSettings.scoring.total_marks,
      negative_marking:
        typeof scoring.negative_marking === "number"
          ? scoring.negative_marking
          : defaultStructuredSettings.scoring.negative_marking,
    },
    behavior: {
      auto_submit_on_timeout:
        typeof behavior.auto_submit_on_timeout === "boolean"
          ? behavior.auto_submit_on_timeout
          : defaultStructuredSettings.behavior.auto_submit_on_timeout,
      allow_question_navigation:
        typeof behavior.allow_question_navigation === "boolean"
          ? behavior.allow_question_navigation
          : defaultStructuredSettings.behavior.allow_question_navigation,
      allow_review_before_submit:
        typeof behavior.allow_review_before_submit === "boolean"
          ? behavior.allow_review_before_submit
          : defaultStructuredSettings.behavior.allow_review_before_submit,
    },
    category: typeof source.category === "string" ? source.category : "",
    difficulty: typeof source.difficulty === "string" ? source.difficulty : "Medium",
    questions: typeof source.questions === "number" ? source.questions : 0,
    is_premium: typeof source.is_premium === "boolean" ? source.is_premium : false,
    extraJson: JSON.stringify(extras, null, 2),
  };
}

function serializeSettings(editor: TestSettingsEditorState): StructuredTestSettings & Record<string, unknown> {
  const extraSettings = JSON.parse(editor.extraJson || "{}") as Record<string, unknown>;

  return {
    instructions: editor.instructions.filter((item) => item.trim()),
    scoring: {
      total_marks: Number(editor.scoring.total_marks),
      negative_marking: Number(editor.scoring.negative_marking),
    },
    behavior: {
      auto_submit_on_timeout: editor.behavior.auto_submit_on_timeout,
      allow_question_navigation: editor.behavior.allow_question_navigation,
      allow_review_before_submit: editor.behavior.allow_review_before_submit,
    },
    category: editor.category?.trim() || undefined,
    difficulty: editor.difficulty?.trim() || undefined,
    questions: Number(editor.questions || 0),
    is_premium: editor.is_premium,
    ...extraSettings,
  };
}

export function TestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testQuestions, setTestQuestions] = useState<TestQuestionLink[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    scope: "general",
    subject_id: "",
    topic_id: "",
    duration_minutes: 45,
    is_active: true,
  });
  const [settingsEditor, setSettingsEditor] = useState<TestSettingsEditorState>(buildDefaultEditorState);
  const [linkForm, setLinkForm] = useState({
    question_id: "",
    sort_order: 1,
    section_label: "Core Practice",
    marks: 1,
  });

  const filteredTopics = form.subject_id
    ? topics.filter((topic) => topic.subject_id === form.subject_id)
    : topics;

  async function load() {
    const [testsRes, subjectsRes, topicsRes, questionsRes] = await Promise.all([
      api<{ items: TestItem[] }>("/admin/tests"),
      api<{ items: Subject[] }>("/admin/subjects"),
      api<{ items: Topic[] }>("/admin/topics"),
      api<{ items: QuestionItem[] }>("/admin/questions"),
    ]);
    setTests(testsRes.items);
    setSubjects(subjectsRes.items);
    setTopics(topicsRes.items);
    setQuestions(questionsRes.items);

    const nextSelectedTestId = selectedTestId || testsRes.items[0]?.id || "";
    if (nextSelectedTestId) {
      setSelectedTestId(nextSelectedTestId);
      await loadTestQuestions(nextSelectedTestId);
    } else {
      setTestQuestions([]);
    }
  }

  async function loadTestQuestions(testId: string) {
    const response = await api<{ items: TestQuestionLink[] }>(`/admin/test-questions?test_id=${testId}`);
    setTestQuestions(response.items);
    setLinkForm((current) => ({
      ...current,
      sort_order: response.items.length + 1,
    }));
  }

  useEffect(() => {
    load();
  }, []);

  function resetTestForm() {
    setEditingTestId(null);
    setSettingsError(null);
    setForm({
      title: "",
      scope: "general",
      subject_id: "",
      topic_id: "",
      duration_minutes: 45,
      is_active: true,
    });
    setSettingsEditor(buildDefaultEditorState());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSettingsError(null);

    let serializedSettings: Record<string, unknown>;
    try {
      serializedSettings = serializeSettings(settingsEditor);
    } catch {
      setSettingsError("Extra settings JSON is invalid");
      return;
    }

    const payload = {
      ...form,
      duration_minutes: Number(form.duration_minutes),
      company_id: null,
      subject_id: form.subject_id || null,
      topic_id: form.topic_id || null,
      settings: serializedSettings,
      created_by: null,
    };

    await api(editingTestId ? `/admin/tests/${editingTestId}` : "/admin/tests", {
      method: editingTestId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });

    resetTestForm();
    await load();
  }

  async function submitLink(event: FormEvent) {
    event.preventDefault();
    if (!selectedTestId) {
      setLinkError("Select a test first");
      return;
    }

    setLinkError(null);

    try {
      await api("/admin/test-questions", {
        method: "POST",
        body: JSON.stringify({
          test_id: selectedTestId,
          question_id: linkForm.question_id,
          sort_order: Number(linkForm.sort_order),
          section_label: linkForm.section_label || null,
          marks: Number(linkForm.marks),
        }),
      });
      setLinkForm({
        question_id: "",
        sort_order: testQuestions.length + 2,
        section_label: linkForm.section_label,
        marks: 1,
      });
      await loadTestQuestions(selectedTestId);
    } catch (submitError) {
      setLinkError(submitError instanceof Error ? submitError.message : "Unable to attach question");
    }
  }

  const instructionsText = settingsEditor.instructions.join("\n");

  return (
    <section>
      <header className="page-header">
        <h2>Tests</h2>
        <p>Create, update, and compose assessments from the live question bank.</p>
      </header>

      <div className="split-grid">
        <form className="panel wide-panel" onSubmit={submit}>
          <div className="panel-header">
            <h3>{editingTestId ? "Edit Test" : "Create Test"}</h3>
            {editingTestId ? (
              <button className="ghost-button" type="button" onClick={resetTestForm}>
                Cancel
              </button>
            ) : null}
          </div>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Prime Numbers Practice"
          />
          <select
            value={form.scope}
            onChange={(event) => setForm({ ...form, scope: event.target.value })}
          >
            <option value="general">General</option>
            <option value="topic">Topic</option>
            <option value="company">Company</option>
            <option value="practice">Practice</option>
          </select>
          <select
            value={form.subject_id}
            onChange={(event) =>
              setForm({ ...form, subject_id: event.target.value, topic_id: "" })
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
            onChange={(event) => setForm({ ...form, topic_id: event.target.value })}
          >
            <option value="">Select topic</option>
            {filteredTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.duration_minutes}
            onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) })}
            placeholder="Duration"
          />
          <label className="checkbox">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Active
          </label>

          <div className="settings-card">
            <h4>Instructions</h4>
            <textarea
              rows={6}
              value={instructionsText}
              onChange={(event) =>
                setSettingsEditor({
                  ...settingsEditor,
                  instructions: event.target.value.split("\n"),
                })
              }
              placeholder="One instruction per line"
            />
          </div>

          <div className="settings-card">
            <h4>Scoring</h4>
            <div className="inline-fields">
              <input
                type="number"
                value={settingsEditor.scoring.total_marks}
                onChange={(event) =>
                  setSettingsEditor({
                    ...settingsEditor,
                    scoring: {
                      ...settingsEditor.scoring,
                      total_marks: Number(event.target.value),
                    },
                  })
                }
                placeholder="Total marks"
              />
              <input
                type="number"
                step={0.25}
                value={settingsEditor.scoring.negative_marking}
                onChange={(event) =>
                  setSettingsEditor({
                    ...settingsEditor,
                    scoring: {
                      ...settingsEditor.scoring,
                      negative_marking: Number(event.target.value),
                    },
                  })
                }
                placeholder="Negative marking"
              />
            </div>
          </div>

          <div className="settings-card">
            <h4>Behavior</h4>
            <div className="toggle-grid">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={settingsEditor.behavior.auto_submit_on_timeout}
                  onChange={(event) =>
                    setSettingsEditor({
                      ...settingsEditor,
                      behavior: {
                        ...settingsEditor.behavior,
                        auto_submit_on_timeout: event.target.checked,
                      },
                    })
                  }
                />
                Auto submit on timeout
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={settingsEditor.behavior.allow_question_navigation}
                  onChange={(event) =>
                    setSettingsEditor({
                      ...settingsEditor,
                      behavior: {
                        ...settingsEditor.behavior,
                        allow_question_navigation: event.target.checked,
                      },
                    })
                  }
                />
                Allow question navigation
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={settingsEditor.behavior.allow_review_before_submit}
                  onChange={(event) =>
                    setSettingsEditor({
                      ...settingsEditor,
                      behavior: {
                        ...settingsEditor.behavior,
                        allow_review_before_submit: event.target.checked,
                      },
                    })
                  }
                />
                Allow review before submit
              </label>
            </div>
          </div>

          <div className="settings-card">
            <h4>Catalog Meta</h4>
            <div className="inline-fields">
              <input
                value={settingsEditor.category || ""}
                onChange={(event) => setSettingsEditor({ ...settingsEditor, category: event.target.value })}
                placeholder="Category"
              />
              <input
                value={settingsEditor.difficulty || ""}
                onChange={(event) => setSettingsEditor({ ...settingsEditor, difficulty: event.target.value })}
                placeholder="Difficulty label"
              />
              <input
                type="number"
                value={settingsEditor.questions || 0}
                onChange={(event) => setSettingsEditor({ ...settingsEditor, questions: Number(event.target.value) })}
                placeholder="Suggested questions"
              />
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={Boolean(settingsEditor.is_premium)}
                onChange={(event) => setSettingsEditor({ ...settingsEditor, is_premium: event.target.checked })}
              />
              Premium test
            </label>
          </div>

          <div className="settings-card">
            <h4>Extra Settings JSON</h4>
            <textarea
              rows={6}
              value={settingsEditor.extraJson}
              onChange={(event) => setSettingsEditor({ ...settingsEditor, extraJson: event.target.value })}
              placeholder='{"custom_key": "custom value"}'
            />
          </div>

          {settingsError ? <p className="error-text">{settingsError}</p> : null}
          <button type="submit">{editingTestId ? "Update Test" : "Create Test"}</button>
        </form>

        <section className="panel wide-panel">
          <div className="panel-header">
            <h3>Test Composer</h3>
            <select
              value={selectedTestId}
              onChange={async (event) => {
                const nextTestId = event.target.value;
                setSelectedTestId(nextTestId);
                await loadTestQuestions(nextTestId);
              }}
            >
              <option value="">Select test</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>

          <form className="wide-panel" onSubmit={submitLink}>
            <select
              value={linkForm.question_id}
              onChange={(event) => setLinkForm({ ...linkForm, question_id: event.target.value })}
            >
              <option value="">Select question</option>
              {questions.map((question) => (
                <option key={question.id} value={question.id}>
                  {(question.title || question.prompt.slice(0, 60))} [{question.question_type}]
                </option>
              ))}
            </select>
            <div className="inline-fields">
              <input
                type="number"
                value={linkForm.sort_order}
                onChange={(event) => setLinkForm({ ...linkForm, sort_order: Number(event.target.value) })}
                placeholder="Sort order"
              />
              <input
                value={linkForm.section_label}
                onChange={(event) => setLinkForm({ ...linkForm, section_label: event.target.value })}
                placeholder="Section label"
              />
              <input
                type="number"
                step={0.5}
                value={linkForm.marks}
                onChange={(event) => setLinkForm({ ...linkForm, marks: Number(event.target.value) })}
                placeholder="Marks"
              />
            </div>
            {linkError ? <p className="error-text">{linkError}</p> : null}
            <button type="submit">Attach Question</button>
          </form>

          <ul className="item-list">
            {testQuestions.map((testQuestion) => (
              <li key={`${testQuestion.test_id}-${testQuestion.question_id}`}>
                <div className="list-row">
                  <div className="item-meta">
                    <strong>{testQuestion.questions?.title || "Untitled question"}</strong>
                    <span>
                      {testQuestion.section_label || "General"} | order {testQuestion.sort_order} | {testQuestion.marks} marks
                    </span>
                  </div>
                  <div className="action-row">
                    <button className="danger-button" type="button" onClick={async () => {
                      await api(`/admin/test-questions?test_id=${testQuestion.test_id}&question_id=${testQuestion.question_id}`, {
                        method: "DELETE",
                      });
                      await loadTestQuestions(testQuestion.test_id);
                    }}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h3>Existing Tests</h3>
        <ul className="item-list">
          {tests.map((test) => (
            <li key={test.id}>
              <div className="list-row">
                <div className="item-meta">
                  <strong>{test.title}</strong>
                  <span>
                    {test.scope} | {test.duration_minutes ?? "NA"} mins | {test.is_active ? "active" : "inactive"}
                  </span>
                </div>
                <div className="action-row">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setEditingTestId(test.id);
                      setForm({
                        title: test.title,
                        scope: test.scope,
                        subject_id: test.subject_id || "",
                        topic_id: test.topic_id || "",
                        duration_minutes: test.duration_minutes ?? 45,
                        is_active: test.is_active,
                      });
                      setSettingsEditor(parseSettingsForEditor(test.settings));
                    }}
                  >
                    Edit
                  </button>
                  <button className="danger-button" type="button" onClick={async () => {
                    await api(`/admin/tests/${test.id}`, { method: "DELETE" });
                    if (selectedTestId === test.id) {
                      setSelectedTestId("");
                      setTestQuestions([]);
                    }
                    if (editingTestId === test.id) {
                      resetTestForm();
                    }
                    load();
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
