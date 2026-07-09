import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { weakAreas } from "../../../data/practiceTests";
import { api, type WeakArea } from "../../../services/api";

function WeakAreasSection() {
  const [areas, setAreas] = useState<WeakArea[]>(weakAreas);

  useEffect(() => {
    api
      .getWeakAreas()
      .then((response) => setAreas(response.weakAreas))
      .catch(() => setAreas(weakAreas));
  }, []);

  return (
    <section className="relative overflow-hidden rounded-lg border border-practice-ink bg-practice-ink p-4 text-white shadow-dashboard">
      <div className="relative">
        <h4 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Target className="h-5 w-5 text-practice-amber" aria-hidden="true" />
          Weak Areas
        </h4>
        <p className="mb-6 text-xs italic text-white/60">Based on your last 3 attempts</p>

        <div className="space-y-6">
          {areas.map((area) => (
            <div key={area.topic}>
              <div className="mb-2 flex justify-between text-xs">
                <span>{area.topic}</span>
                <span className="font-extrabold text-practice-amber">
                  {area.accuracy}% Accuracy
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-practice-amber"
                  style={{ width: `${area.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="mt-8 w-full rounded border border-practice-amber py-2 text-xs font-extrabold text-practice-amber transition hover:bg-practice-amber hover:text-practice-amberDark">
          Generate Focused Test
        </button>
      </div>
    </section>
  );
}

export default WeakAreasSection;
