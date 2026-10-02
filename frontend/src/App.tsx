import DashboardLayout from "./components/layout/DashboardLayout";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const path = window.location.pathname;

  const page = path === "/settings"
    ? <SettingsPage />
    : <HomePage />;

  return (
    <DashboardLayout>
      {page}
    </DashboardLayout>
  );
}

export default App;
