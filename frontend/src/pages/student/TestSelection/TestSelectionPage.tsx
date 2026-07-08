import { Link, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../../components/student/layout/AppLayout";
import SelectionColumn from "../../../components/student/testFlow/SelectionColumn";
import StepIndicator from "../../../components/student/testFlow/StepIndicator";
import { api } from "../../../services/api";
import { useEffect, useState } from "react";
import type { SelectionItem } from "../../../types/testFlow";

function TestSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { testId?: string; title?: string } | null;
  const testId = state?.testId ?? "prime-factors";

  const [subjects, setSubjects] = useState<SelectionItem[]>([]);
  const [topics, setTopics] = useState<SelectionItem[]>([]);
  const [subtopics, setSubtopics] = useState<SelectionItem[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

  // Load initial subjects
  useEffect(() => {
    setLoadingSubjects(true);
    api.getSubjects()
      .then((data) => {
        setSubjects(data.subjects);
      })
      .catch(() => undefined)
      .finally(() => setLoadingSubjects(false));
  }, []);

  // Subject selection handler
  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setTopics([]);
    setSubtopics([]);

    setLoadingTopics(true);
    api.getTopics(subjectId)
      .then((data) => {
        setTopics(data.topics);
      })
      .catch(() => undefined)
      .finally(() => setLoadingTopics(false));
  };

  // Topic selection handler
  const handleSelectTopic = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedSubtopic(null);
    setSubtopics([]);

    setLoadingSubtopics(true);
    api.getSubtopics(topicId)
      .then((data) => {
        setSubtopics(data.subtopics);
      })
      .catch(() => undefined)
      .finally(() => setLoadingSubtopics(false));
  };

  // Subtopic selection handler
  const handleSelectSubtopic = (subtopicId: string) => {
    setSelectedSubtopic(subtopicId);
  };

  const currentSubject = subjects.find((item) => item.id === selectedSubject);
  const currentTopic = topics.find((item) => item.id === selectedTopic);
  const currentSubtopic = subtopics.find((item) => item.id === selectedSubtopic);

  let currentStep = 1;
  if (selectedSubject) {
    currentStep = 2;
    if (selectedTopic) {
      currentStep = 3;
      if (selectedSubtopic) {
        currentStep = 4;
      }
    }
  }

  const isContinueEnabled = !!selectedSubject && !!selectedTopic && !!selectedSubtopic;

  const handleContinue = () => {
    if (!isContinueEnabled) return;
    navigate("/practice-tests/instructions", {
      state: {
        testId,
        subjectId: selectedSubject,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        subtopicTitle: currentSubtopic?.title,
      },
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px] pb-24">
        <StepIndicator currentStep={currentStep} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SelectionColumn
            title="Select Subject"
            icon="S"
            items={subjects}
            selectedId={selectedSubject}
            onSelect={handleSelectSubject}
            loading={loadingSubjects}
          />
          <SelectionColumn
            title="Select Topic"
            icon="T"
            items={topics}
            selectedId={selectedTopic}
            onSelect={handleSelectTopic}
            loading={loadingTopics}
          />
          <SelectionColumn
            title="Select Subtopic"
            icon="ST"
            items={subtopics}
            selectedId={selectedSubtopic}
            onSelect={handleSelectSubtopic}
            loading={loadingSubtopics}
          />
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-practice-line bg-white px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] lg:left-[280px] lg:px-6">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-lg border border-practice-ink/20 px-5 py-3 text-sm font-bold text-practice-ink transition hover:bg-practice-muted"
            >
              Back
            </Link>
            <div>
              <p className="text-xs font-semibold text-practice-subdued">Selection Summary</p>
              <p className="font-extrabold text-practice-ink text-sm">
                {selectedSubject ? currentSubject?.title : "No Subject Selected"}
                {selectedTopic ? ` > ${currentTopic?.title}` : ""}
                {selectedSubtopic ? ` > ${currentSubtopic?.title}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden text-right lg:block">
              <p className="text-xs font-semibold text-practice-subdued">Estimated Duration</p>
              <p className="font-extrabold text-practice-ink">
                45 Minutes
              </p>
            </div>
            <button
              type="button"
              disabled={!isContinueEnabled}
              onClick={handleContinue}
              className={[
                "rounded-lg px-8 py-3 text-sm font-extrabold text-white shadow-lg transition-all duration-200",
                isContinueEnabled
                  ? "bg-practice-ink hover:bg-practice-sidebarActive cursor-pointer active:scale-[0.98]"
                  : "bg-practice-line cursor-not-allowed opacity-50",
              ].join(" ")}
            >
              Continue to Instructions
            </button>
          </div>
        </div>
      </footer>
    </AppLayout>
  );
}

export default TestSelectionPage;
