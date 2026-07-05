interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  dark?: boolean;
}

function MetricCard({ label, value, icon, dark = false }: MetricCardProps) {
  return (
    <div
      className={[
        "rounded-lg border p-4 text-center shadow-dashboard",
        dark
          ? "border-practice-ink bg-practice-ink text-white"
          : "border-practice-line bg-white text-practice-ink",
      ].join(" ")}
    >
      <div className={["mb-2 text-2xl", dark ? "text-practice-amber" : "text-practice-amberDark"].join(" ")}>
        {icon}
      </div>
      <p className={["text-xs", dark ? "text-white/65" : "text-practice-subdued"].join(" ")}>
        {label}
      </p>
      <p className={["text-2xl font-extrabold", dark ? "text-practice-amber" : ""].join(" ")}>
        {value}
      </p>
    </div>
  );
}

export default MetricCard;
