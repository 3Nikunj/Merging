import { Link } from "react-router-dom";
import PracticeShell from "../../../components/student/testFlow/PracticeShell";
import SelectionColumn from "../../../components/student/testFlow/SelectionColumn";
import StepIndicator from "../../../components/student/testFlow/StepIndicator";
import { selectedTest, subjects, subtopics, topics } from "../../../data/testFlow";
import { api, type SelectionDataResponse } from "../../../services/api";
import { useEffect, useState } from "react";

function TestSelectionPage() {
  const [selectionData, setSelectionData] = useState<SelectionDataResponse>({
    subjects,
    topics,
    subtopics,
    selectedTest,
  });
  const [selectedSubject, setSelectedSubject] = useState(subjects[0].id);
  const [selectedTopic, setSelectedTopic] = useState(topics[0].id);
  const [selectedSubtopic, setSelectedSubtopic] = useState(subtopics[0].id);

  useEffect(() => {
    api
      .getSelectionData()
      .then((data) => {
        setSelectionData(data);
        setSelectedSubject(data.subjects[0]?.id ?? subjects[0].id);
        setSelectedTopic(data.topics[0]?.id ?? topics[0].id);
        setSelectedSubtopic(data.subtopics[0]?.id ?? subtopics[0].id);
      })
      .catch(() => undefined);
  }, []);

  const currentSubject = selectionData.subjects.find((item) => item.id === selectedSubject);
  const currentTopic = selectionData.topics.find((item) => item.id === selectedTopic);
  const currentSubtopic = selectionData.subtopics.find((item) => item.id === selectedSubtopic);

  return (
    <PracticeShell title="Test Selection">
      <div className="mx-auto max-w-[1280px]">
        <StepIndicator currentStep={2} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SelectionColumn
            title="Select Subject"
            icon="S"
            items={selectionData.subjects}
            selectedId={selectedSubject}
            onSelect={setSelectedSubject}
          />
          <SelectionColumn
            title="Select Topic"
            icon="T"
            items={selectionData.topics}
            selectedId={selectedTopic}
            onSelect={setSelectedTopic}
          />
          <SelectionColumn
            title="Select Subtopic"
            icon="ST"
            items={selectionData.subtopics}
            selectedId={selectedSubtopic}
            onSelect={setSelectedSubtopic}
          />
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-practice-line bg-white px-4 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] lg:left-[280px] lg:px-6">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/practice-tests"
              className="rounded-lg border border-practice-ink/20 px-5 py-3 text-sm font-bold text-practice-ink transition hover:bg-practice-muted"
            >
              Back
            </Link>
            <div>
              <p className="text-xs font-semibold text-practice-subdued">Selection Summary</p>
              <p className="font-extrabold text-practice-ink">
                {currentSubject?.title} &gt; {currentTopic?.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden text-right lg:block">
              <p className="text-xs font-semibold text-practice-subdued">Estimated Duration</p>
              <p className="font-extrabold text-practice-ink">
                {selectionData.selectedTest.duration} Minutes
              </p>
            </div>
            <Link
              to="/practice-tests/instructions"
              className="rounded-lg bg-practice-ink px-8 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-practice-sidebarActive"
              state={{ subtopic: currentSubtopic?.title }}
            >
              Continue to Instructions
            </Link>
          </div>
        </div>
      </footer>
    </PracticeShell>
  );
}

export default TestSelectionPage;
