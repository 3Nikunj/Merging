import { FormEvent, useEffect, useState } from "react";

import { api } from "../../services/api";
import type { Subject, Subtopic, Topic } from "../../types/admin";

export function TaxonomyPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingSubtopicId, setEditingSubtopicId] = useState<string | null>(null);

  const [subjectForm, setSubjectForm] = useState({ name: "", slug: "", active: true });
  const [topicForm, setTopicForm] = useState({ subject_id: "", name: "", slug: "" });
  const [subtopicForm, setSubtopicForm] = useState({ topic_id: "", name: "", slug: "" });

  async function load() {
    const [subjectRes, topicRes, subtopicRes] = await Promise.all([
      api<{ items: Subject[] }>("/admin/subjects"),
      api<{ items: Topic[] }>("/admin/topics"),
      api<{ items: Subtopic[] }>("/admin/subtopics"),
    ]);
    setSubjects(subjectRes.items);
    setTopics(topicRes.items);
    setSubtopics(subtopicRes.items);
  }

  useEffect(() => {
    load();
  }, []);

  function resetSubjectForm() {
    setEditingSubjectId(null);
    setSubjectForm({ name: "", slug: "", active: true });
  }

  function resetTopicForm() {
    setEditingTopicId(null);
    setTopicForm({ subject_id: "", name: "", slug: "" });
  }

  function resetSubtopicForm() {
    setEditingSubtopicId(null);
    setSubtopicForm({ topic_id: "", name: "", slug: "" });
  }

  async function submitSubject(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...subjectForm,
      sort_order:
        subjects.find((subject) => subject.id === editingSubjectId)?.sort_order ?? subjects.length,
    };

    if (editingSubjectId) {
      await api(`/admin/subjects/${editingSubjectId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/admin/subjects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    resetSubjectForm();
    load();
  }

  async function submitTopic(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...topicForm,
      sort_order: topics.find((topic) => topic.id === editingTopicId)?.sort_order ?? topics.length,
    };

    if (editingTopicId) {
      await api(`/admin/topics/${editingTopicId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/admin/topics", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    resetTopicForm();
    load();
  }

  async function submitSubtopic(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...subtopicForm,
      sort_order:
        subtopics.find((subtopic) => subtopic.id === editingSubtopicId)?.sort_order ?? subtopics.length,
    };

    if (editingSubtopicId) {
      await api(`/admin/subtopics/${editingSubtopicId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/admin/subtopics", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    resetSubtopicForm();
    load();
  }

  return (
    <section>
      <header className="page-header">
        <h2>Taxonomy</h2>
        <p>Manage subjects, topics, and subtopics for the practice test flow.</p>
      </header>

      <div className="split-grid">
        <form className="panel" onSubmit={submitSubject}>
          <div className="panel-header">
            <h3>{editingSubjectId ? "Edit Subject" : "New Subject"}</h3>
            {editingSubjectId ? (
              <button className="ghost-button" type="button" onClick={resetSubjectForm}>
                Cancel
              </button>
            ) : null}
          </div>
          <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Name" />
          <input value={subjectForm.slug} onChange={(e) => setSubjectForm({ ...subjectForm, slug: e.target.value })} placeholder="Slug" />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={subjectForm.active}
              onChange={(e) => setSubjectForm({ ...subjectForm, active: e.target.checked })}
            />
            Active
          </label>
          <button type="submit">{editingSubjectId ? "Update Subject" : "Create Subject"}</button>
        </form>

        <form className="panel" onSubmit={submitTopic}>
          <div className="panel-header">
            <h3>{editingTopicId ? "Edit Topic" : "New Topic"}</h3>
            {editingTopicId ? (
              <button className="ghost-button" type="button" onClick={resetTopicForm}>
                Cancel
              </button>
            ) : null}
          </div>
          <select value={topicForm.subject_id} onChange={(e) => setTopicForm({ ...topicForm, subject_id: e.target.value })}>
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <input value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} placeholder="Name" />
          <input value={topicForm.slug} onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })} placeholder="Slug" />
          <button type="submit">{editingTopicId ? "Update Topic" : "Create Topic"}</button>
        </form>

        <form className="panel" onSubmit={submitSubtopic}>
          <div className="panel-header">
            <h3>{editingSubtopicId ? "Edit Subtopic" : "New Subtopic"}</h3>
            {editingSubtopicId ? (
              <button className="ghost-button" type="button" onClick={resetSubtopicForm}>
                Cancel
              </button>
            ) : null}
          </div>
          <select value={subtopicForm.topic_id} onChange={(e) => setSubtopicForm({ ...subtopicForm, topic_id: e.target.value })}>
            <option value="">Select topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <input value={subtopicForm.name} onChange={(e) => setSubtopicForm({ ...subtopicForm, name: e.target.value })} placeholder="Name" />
          <input value={subtopicForm.slug} onChange={(e) => setSubtopicForm({ ...subtopicForm, slug: e.target.value })} placeholder="Slug" />
          <button type="submit">{editingSubtopicId ? "Update Subtopic" : "Create Subtopic"}</button>
        </form>
      </div>

      <div className="table-grid">
        <section className="panel">
          <h3>Subjects</h3>
          <ul className="item-list">
            {subjects.map((item) => (
              <li key={item.id}>
                <div className="list-row">
                  <div className="item-meta">
                    <strong>{item.name}</strong>
                    <span>{item.slug} | {item.active ? "active" : "inactive"}</span>
                  </div>
                  <div className="action-row">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setEditingSubjectId(item.id);
                        setSubjectForm({ name: item.name, slug: item.slug, active: item.active });
                      }}
                    >
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={async () => {
                      await api(`/admin/subjects/${item.id}`, { method: "DELETE" });
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
        <section className="panel">
          <h3>Topics</h3>
          <ul className="item-list">
            {topics.map((item) => (
              <li key={item.id}>
                <div className="list-row">
                  <div className="item-meta">
                    <strong>{item.name}</strong>
                    <span>{item.slug} | {item.subjects?.name || "Unassigned"}</span>
                  </div>
                  <div className="action-row">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setEditingTopicId(item.id);
                        setTopicForm({ subject_id: item.subject_id, name: item.name, slug: item.slug });
                      }}
                    >
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={async () => {
                      await api(`/admin/topics/${item.id}`, { method: "DELETE" });
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
        <section className="panel">
          <h3>Subtopics</h3>
          <ul className="item-list">
            {subtopics.map((item) => (
              <li key={item.id}>
                <div className="list-row">
                  <div className="item-meta">
                    <strong>{item.name}</strong>
                    <span>{item.slug} | {item.topics?.name || "Unassigned"}</span>
                  </div>
                  <div className="action-row">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setEditingSubtopicId(item.id);
                        setSubtopicForm({ topic_id: item.topic_id, name: item.name, slug: item.slug });
                      }}
                    >
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={async () => {
                      await api(`/admin/subtopics/${item.id}`, { method: "DELETE" });
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
