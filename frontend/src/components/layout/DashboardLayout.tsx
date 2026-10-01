import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DashboardLayout.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main">
        <Header />

        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;