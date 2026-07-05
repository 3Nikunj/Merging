interface StatusBadgeProps {
  status: "Correct" | "Incorrect" | "Skipped";
}

const statusStyles = {
  Correct: "text-emerald-700",
  Incorrect: "text-red-600",
  Skipped: "text-practice-subdued",
};

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={["font-bold", statusStyles[status]].join(" ")}>
      {status}
    </span>
  );
}

export default StatusBadge;
