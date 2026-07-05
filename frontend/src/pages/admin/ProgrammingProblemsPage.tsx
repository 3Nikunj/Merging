import { FormEvent, useEffect, useState } from "react";

import { api } from "../../services/api";
import type { ProgrammingProblem, QuestionItem } from "../../types/admin";

export function ProgrammingProblemsPage() {
  const [problems, setProblems] = useState<ProgrammingProblem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [form, setForm] = useState({
    question_id: "",
    slug: "",
    active: true,
    tags: "array,hash-table",
    expected_time: "O(n)",
    expected_space: "O(n)",
    constraints_text: "",
    starter_templates: JSON.stringify({ python: "def solve():\n    pass" }, null, 2),
    examples_json: JSON.stringify([{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }], null, 2),
  });

  async function load() {
    const [problemRes, questionRes] = await Promise.all([
      api<{ items: ProgrammingProblem[] }>("/admin/programming-problems"),
      api<{ items: QuestionItem[] }>("/admin/questions?question_type=coding"),
    ]);
    setProblems(problemRes.items);
    setQuestions(questionRes.items);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingProblemId(null);
    setForm({
      question_id: "",
      slug: "",
      active: true,
      tags: "array,hash-table",
      expected_time: "O(n)",
      expected_space: "O(n)",
      constraints_text: "",
      starter_templates: JSON.stringify({ python: "def solve():\n    pass" }, null, 2),
      examples_json: JSON.stringify([{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }], null, 2),
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      question_id: form.question_id,
      slug: form.slug,
      active: form.active,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      expected_time: form.expected_time,
      expected_space: form.expected_space,
      constraints_text: form.constraints_text,
      starter_templates: JSON.parse(form.starter_templates),
      examples_json: JSON.parse(form.examples_json),
    };

    await api(editingProblemId ? `/admin/programming-problems/${editingProblemId}` : "/admin/programming-problems", {
      method: editingProblemId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });

    resetForm();
    load();
  }

  return (
    <section>
      <header className="page-header">
        <h2>Coding Problems</h2>
        <p>Manage the dedicated coding problem catalog introduced for the scratch rebuild.</p>
      </header>

      <div className="split-grid">
        <form className="panel wide-panel" onSubmit={submit}>
          <div className="panel-header">
            <h3>{editingProblemId ? "Edit Coding Problem Entry" : "Create Coding Problem Entry"}</h3>
            {editingProblemId ? (
              <button className="ghost-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
          <select value={form.question_id} onChange={(e) => setForm({ ...form, question_id: e.target.value })}>
            <option value="">Select coding question</option>
            {questions.map((question) => (
              <option key={question.id} value={question.id}>
                {question.title || question.id}
              </option>
            ))}
          </select>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="two-sum" />
          <label className="checkbox">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="array,hash-table" />
          <input value={form.expected_time} onChange={(e) => setForm({ ...form, expected_time: e.target.value })} placeholder="Expected time" />
          <input value={form.expected_space} onChange={(e) => setForm({ ...form, expected_space: e.target.value })} placeholder="Expected space" />
          <textarea value={form.constraints_text} onChange={(e) => setForm({ ...form, constraints_text: e.target.value })} rows={4} placeholder="Constraints summary" />
          <textarea value={form.starter_templates} onChange={(e) => setForm({ ...form, starter_templates: e.target.value })} rows={8} />
          <textarea value={form.examples_json} onChange={(e) => setForm({ ...form, examples_json: e.target.value })} rows={8} />
          <button type="submit">{editingProblemId ? "Update Programming Problem" : "Create Programming Problem"}</button>
        </form>

        <section className="panel">
          <h3>Catalog</h3>
          <ul className="item-list">
            {problems.map((problem) => (
              <li key={problem.id}>
                <div className="list-row">
                  <div className="item-meta">
                    <strong>{problem.slug}</strong>
                    <span>{problem.questions?.title || "Untitled question"} | {problem.active ? "active" : "inactive"}</span>
                  </div>
                  <div className="action-row">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setEditingProblemId(problem.id);
                        setForm({
                          question_id: problem.question_id,
                          slug: problem.slug,
                          active: problem.active,
                          tags: problem.tags.join(","),
                          expected_time: problem.expected_time || "",
                          expected_space: problem.expected_space || "",
                          constraints_text: problem.constraints_text || "",
                          starter_templates: JSON.stringify(problem.starter_templates || {}, null, 2),
                          examples_json: JSON.stringify(problem.examples_json || [], null, 2),
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={async () => {
                      await api(`/admin/programming-problems/${problem.id}`, { method: "DELETE" });
                      if (editingProblemId === problem.id) {
                        resetForm();
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
      </div>
    </section>
  );
}
