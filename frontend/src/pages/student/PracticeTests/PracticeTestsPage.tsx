import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../../components/student/layout/AppLayout";
import PracticeFilterBar from "../../../components/student/practiceTests/PracticeFilterBar";
import PracticeTabs from "../../../components/student/practiceTests/PracticeTabs";
import PracticeTestCard from "../../../components/student/practiceTests/PracticeTestCard";
import RecommendedSection from "../../../components/student/practiceTests/RecommendedSection";
import StudyBuddyButton from "../../../components/student/practiceTests/StudyBuddyButton";
import WeakAreasSection from "../../../components/student/practiceTests/WeakAreasSection";
import { practiceTests } from "../../../data/practiceTests";
import { api } from "../../../services/api";
import type { PracticeTestCardData } from "../../../types/practiceTest";

type SelectableDifficulty = PracticeTestCardData["difficulty"] | "All";
type SelectableStatus = PracticeTestCardData["status"] | "All";

function PracticeTestsPage() {
  const [activeTab, setActiveTab] = useState("Subject Wise");
  const [searchTerm, setSearchTerm] = useState("");
  const [subject, setSubject] = useState("All");
  const [difficulty, setDifficulty] = useState<SelectableDifficulty>("All");
  const [status, setStatus] = useState<SelectableStatus>("All");
  const [tests, setTests] = useState<PracticeTestCardData[]>(practiceTests);

  useEffect(() => {
    api
      .getPracticeTests()
      .then((response) => setTests(response.tests))
      .catch(() => setTests(practiceTests));
  }, []);

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          tests
            .filter((test) => !test.isPremium)
            .map((test) => test.category),
        ),
      ),
    [tests],
  );

  const filteredTests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tests.filter((test) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        test.title.toLowerCase().includes(normalizedSearch);
      const matchesSubject = subject === "All" || test.category === subject;
      const matchesDifficulty = difficulty === "All" || test.difficulty === difficulty;
      const matchesStatus = status === "All" || test.status === status;

      if (test.isPremium && normalizedSearch.length === 0) {
        return subject === "All" && difficulty === "All" && status === "All";
      }

      return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
    });
  }, [difficulty, searchTerm, status, subject, tests]);

  return (
    <AppLayout>
      <section className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-practice-ink sm:text-4xl">
          Practice Tests
        </h2>
        <p className="mt-1 text-base text-practice-subdued">
          Hone your skills with curated assessments from industry experts.
        </p>
      </section>

      <PracticeTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-8 lg:col-span-9">
          <PracticeFilterBar
            searchTerm={searchTerm}
            subject={subject}
            difficulty={difficulty}
            status={status}
            subjects={subjects}
            onSearchTermChange={setSearchTerm}
            onSubjectChange={setSubject}
            onDifficultyChange={setDifficulty}
            onStatusChange={setStatus}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredTests.map((test) => (
              <PracticeTestCard key={test.id} test={test} />
            ))}
          </div>

          {filteredTests.length === 0 ? (
            <div className="rounded-lg border border-practice-line bg-white p-10 text-center shadow-dashboard">
              <p className="text-sm font-bold text-practice-subdued">
                No practice tests match the selected filters.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="col-span-12 space-y-8 lg:col-span-3">
          <RecommendedSection />
          <WeakAreasSection />
          <div className="rounded-lg bg-practice-amber p-4 text-practice-amberDark">
            <span className="mb-2 block text-3xl font-black opacity-20">"</span>
            <p className="text-sm italic leading-relaxed">
              The expert in anything was once a beginner. Consistency is the only secret.
            </p>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider opacity-80">
              Mentor Daily Tip
            </p>
          </div>
        </aside>
      </div>

      <StudyBuddyButton />
    </AppLayout>
  );
}

export default PracticeTestsPage;
