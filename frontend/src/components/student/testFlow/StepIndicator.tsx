interface StepIndicatorProps {
  currentStep: number;
}

const steps = ["Subject", "Topic", "Subtopic", "Instructions"];

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav className="mx-auto mb-8 flex max-w-4xl items-center px-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm",
                  isDone || isActive
                    ? "bg-practice-amberDark text-white"
                    : "bg-practice-line text-practice-subdued",
                  isActive ? "ring-4 ring-practice-amber/30" : "",
                ].join(" ")}
              >
                {isDone ? "ok" : stepNumber}
              </div>
              <span
                className={[
                  "text-xs font-bold sm:text-sm",
                  isDone || isActive ? "text-practice-amberDark" : "text-practice-subdued",
                ].join(" ")}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={[
                  "mx-3 h-1 flex-1 rounded-full",
                  stepNumber < currentStep ? "bg-practice-amberDark" : "bg-practice-line",
                ].join(" ")}
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export default StepIndicator;
