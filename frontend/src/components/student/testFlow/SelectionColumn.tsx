import type { SelectionItem } from "../../../types/testFlow";

interface SelectionColumnProps {
  title: string;
  icon: string;
  items: SelectionItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function SelectionColumn({
  title,
  icon,
  items,
  selectedId,
  onSelect,
}: SelectionColumnProps) {
  return (
    <section className="flex min-h-[28rem] flex-col gap-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-practice-ink">
        <span className="text-practice-amberDark">{icon}</span>
        {title}
      </h2>
      <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[#E5DEC8] bg-white p-4">
        {items.map((item) => {
          const isSelected = selectedId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={[
                "rounded border p-4 text-left transition active:scale-[0.98]",
                isSelected
                  ? "border-practice-amberDark bg-[#FFFDF5] shadow-[inset_4px_0_0_0_#7d5700]"
                  : "border-transparent bg-white hover:border-practice-line",
              ].join(" ")}
              onClick={() => onSelect(item.id)}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-practice-text">{item.title}</h3>
                {item.badge ? (
                  <span className="rounded bg-practice-amberDark/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-practice-amberDark">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-practice-line">
                  <div
                    className="h-full rounded-full bg-practice-amberDark"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-practice-subdued">
                  <span>{item.progress}% Complete</span>
                  <span>Avg. {item.average}</span>
                </div>
                <p className="text-xs italic text-practice-subdued">
                  {item.questions.toLocaleString()} questions available
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default SelectionColumn;
