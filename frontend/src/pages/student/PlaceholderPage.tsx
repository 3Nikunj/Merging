import { Link } from "react-router-dom";
import AppLayout from "../../components/student/layout/AppLayout";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <AppLayout>
      <div className="rounded-lg border border-practice-line bg-white p-10 shadow-dashboard">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-practice-amberDark">
          Coming Soon
        </p>
        <h1 className="text-3xl font-extrabold text-practice-ink">{title}</h1>
        <p className="mt-3 max-w-2xl text-practice-subdued">
          {description ??
            "This section is connected in the navigation and ready for the next implementation pass."}
        </p>
        <Link
          to="/practice-tests"
          className="mt-8 inline-flex rounded-lg bg-practice-ink px-5 py-3 text-sm font-extrabold text-white"
        >
          Back to Practice Tests
        </Link>
      </div>
    </AppLayout>
  );
}

export default PlaceholderPage;
