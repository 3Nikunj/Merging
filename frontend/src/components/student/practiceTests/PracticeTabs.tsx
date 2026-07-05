const tabs = ["Subject Wise"];

interface PracticeTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

function PracticeTabs({ activeTab, onChange }: PracticeTabsProps) {
  return (
    <div className="mb-8 overflow-x-auto border-b border-practice-line">
      <div className="flex min-w-max items-center gap-6 sm:gap-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              className={[
                "border-b-2 px-2 pb-4 text-sm font-bold transition",
                isActive
                  ? "border-practice-amber text-practice-ink"
                  : "border-transparent text-practice-subdued hover:text-practice-ink",
              ].join(" ")}
              onClick={() => onChange(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PracticeTabs;
