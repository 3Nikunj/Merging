import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-practice-background text-practice-text">
      <Sidebar />
      <Topbar />
      <main className="min-h-screen px-4 pb-10 pt-[96px] sm:px-6 lg:ml-[280px] lg:px-6">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;
