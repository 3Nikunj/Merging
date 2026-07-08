import type { SelectionItem } from "../../../types/testFlow";

interface SelectionColumnProps {
  title: string;
  icon: string;
  items: SelectionItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

function SelectionColumn({
  title,
  icon,
  items,
  selectedId,
  onSelect,
  loading = false,
}: SelectionColumnProps) {
  return (
    <section className="flex flex-col gap-4 h-[520px]">
      <h2 className="flex items-center gap-2 text-xl font-bold text-practice-ink">
        <span className="text-practice-amberDark">{icon}</span>
        {title}
      </h2>
      <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[#E5DEC8] bg-white p-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <span className="text-sm font-bold text-practice-subdued animate-pulse">Loading data...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <p className="text-xs font-bold text-practice-subdued">
              No items available.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={[
                  "rounded border p-4 text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber",
                  isSelected
                    ? "border-practice-amberDark bg-[#FFFDF5] shadow-[inset_4px_0_0_0_#7d5700] hover:bg-[#FFFDF5]"
                    : "border-transparent bg-white hover:border-practice-line hover:bg-practice-muted/40 hover:-translate-y-[1px] hover:shadow-sm",
                ].join(" ")}
                onClick={() => onSelect(item.id)}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-practice-text flex items-center gap-1.5">
                    {item.title}
                    {isSelected && (
                      <span className="text-xs text-practice-amberDark font-black">✓</span>
                    )}
                  </h3>
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
          })
        )}
      </div>
    </section>
  );
}

export default SelectionColumn;
