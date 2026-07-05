import { useEffect, useState } from "react";

import { api } from "../../services/api";
import type { Overview } from "../../types/admin";

export function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api<Overview>("/admin/overview").then(setData);
  }, []);

  const cards = data
    ? [
        ["Subjects", data.subjects],
        ["Topics", data.topics],
        ["Subtopics", data.subtopics],
        ["Tests", data.tests],
        ["Questions", data.questions],
        ["Coding Problems", data.coding_problems],
        ["Attempts", data.latest_attempts],
      ]
    : [];

  return (
    <section>
      <header className="page-header">
        <h2>Overview</h2>
        <p>CMS-first admin dashboard for the scratch rebuild.</p>
      </header>
      <div className="card-grid">
        {cards.map(([label, value]) => (
          <article key={label} className="stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

