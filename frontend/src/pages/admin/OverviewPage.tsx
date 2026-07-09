import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Code2,
  Layers3,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../services/api";
import type { Overview } from "../../types/admin";

const emptyOverview: Overview = {
  subjects: 0,
  topics: 0,
  subtopics: 0,
  tests: 0,
  questions: 0,
  coding_problems: 0,
  latest_attempts: 0,
};

function getReadiness(data: Overview) {
  return [
    {
      label: "Taxonomy mapped",
      helper: `${data.subjects} subjects, ${data.topics} topics, ${data.subtopics} subtopics`,
      status: data.subjects > 0 && data.topics > 0 && data.subtopics > 0 ? "good" : "warn",
    },
    {
      label: "Assessments available",
      helper: `${data.tests} tests composed from ${data.questions} questions`,
      status: data.tests > 0 && data.questions > 0 ? "good" : "warn",
    },
    {
      label: "Coding catalog",
      helper: `${data.coding_problems} coding problems configured`,
      status: data.coding_problems > 0 ? "good" : "warn",
    },
    {
      label: "Learner activity",
      helper: `${data.latest_attempts} recent attempts captured`,
      status: data.latest_attempts > 0 ? "good" : "warn",
    },
  ] as const;
}

export function OverviewPage() {
  const [data, setData] = useState<Overview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api<Overview>("/admin/overview")
      .then((response) => {
        if (active) {
          setData(response);
          setError(null);
        }
      })
      .catch((overviewError) => {
        if (active) {
          setError(
            overviewError instanceof Error
              ? overviewError.message
              : "Unable to load admin overview.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "Subjects",
        value: data.subjects,
        helper: "Top-level learning domains",
        icon: Layers3,
      },
      {
        label: "Topics",
        value: data.topics,
        helper: "Mapped assessment areas",
        icon: ClipboardList,
      },
      {
        label: "Subtopics",
        value: data.subtopics,
        helper: "Fine-grained practice units",
        icon: Boxes,
      },
      {
        label: "Tests",
        value: data.tests,
        helper: "Live and draft assessments",
        icon: CheckCircle2,
      },
      {
        label: "Questions",
        value: data.questions,
        helper: "MCQ and coding prompts",
        icon: ClipboardList,
      },
      {
        label: "Coding Problems",
        value: data.coding_problems,
        helper: "Judge-ready programming tasks",
        icon: Code2,
      },
      {
        label: "Attempts",
        value: data.latest_attempts,
        helper: "Recent learner submissions",
        icon: UsersRound,
      },
    ],
    [data],
  );

  const readiness = getReadiness(data);
  const contentRatio = data.tests > 0 ? Math.round(data.questions / data.tests) : 0;

  return (
    <section className="admin-dashboard">
      <header className="admin-hero-panel">
        <div>
          <p className="admin-kicker">Operational Snapshot</p>
          <h2>Assessment CMS Control Center</h2>
          <p>
            Monitor catalog depth, test readiness, learner activity, and the content
            workflows that feed the student practice experience.
          </p>
        </div>
        <div className="admin-hero-actions">
          <Link className="admin-primary-button" to="/admin/questions">
            Add Question
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link className="admin-secondary-button" to="/admin/tests">
            Compose Test
          </Link>
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="admin-metric-grid" aria-busy={loading}>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="stat-card">
              <div className="panel-header">
                <span>{card.label}</span>
                <Icon className="h-5 w-5 text-practice-amberDark" aria-hidden="true" />
              </div>
              <strong>{loading ? "-" : card.value}</strong>
              <p>{card.helper}</p>
            </article>
          );
        })}
      </div>

      <div className="admin-insight-grid">
        <section className="admin-insight-card">
          <div className="panel-header">
            <h3>Readiness Checklist</h3>
            <span className="tag success">Live data</span>
          </div>
          <ul className="admin-checklist">
            {readiness.map((item) => (
              <li key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p className="helper-text">{item.helper}</p>
                </div>
                <span className={`admin-status-dot ${item.status}`} aria-label={item.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-insight-card">
          <div className="panel-header">
            <h3>Content Quality Signals</h3>
          </div>
          <div className="item-list">
            <div className="settings-card">
              <h4>Question Density</h4>
              <p className="helper-text">
                {contentRatio > 0
                  ? `${contentRatio} questions per test on average.`
                  : "Create tests and attach questions to establish coverage."}
              </p>
            </div>
            <div className="settings-card">
              <h4>Next Best Action</h4>
              <p className="helper-text">
                {data.coding_problems === 0
                  ? "Configure coding problems with starter templates and judge cases."
                  : "Review test composition and keep taxonomy mappings current."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Primary Workflows</h3>
          <span className="helper-text">Jump into the highest-frequency admin tasks.</span>
        </div>
        <div className="admin-action-strip">
          <Link className="admin-secondary-button" to="/admin/taxonomy">
            Maintain Taxonomy
          </Link>
          <Link className="admin-secondary-button" to="/admin/batches">
            Manage Batches
          </Link>
          <Link className="admin-secondary-button" to="/admin/questions">
            Review Question Bank
          </Link>
          <Link className="admin-secondary-button" to="/admin/programming-problems">
            Coding Catalog
          </Link>
        </div>
      </section>
    </section>
  );
}
