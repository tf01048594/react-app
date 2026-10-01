import { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard.tsx/DashboardCard";
import { countSettings } from "../api/settingApi";

function HomePage() {
   const [settingsCount, setSettingsCount] = useState(0);

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   
   async function getCountSettings() {
    try {
      setLoading(true);
      const count = await countSettings();
      setSettingsCount(count);
    } catch (error) {
      console.error(error);
  
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete setting");
      }
    } finally {
      setLoading(false);
    }
     // Fetch the count of settings from the API and update the state
     // For now, we will just set it to a static value for demonstration
   }

   useEffect(() => {
    getCountSettings();
   }, []);
  
  return (
    <div>
      <h1>Welcome to PowerEgg Wiki</h1>

      <p>
        Search and explore your software knowledge.
      </p>

      <div className="dashboard-cards">
        <DashboardCard
          title="Software"
          value={0}
        />

        <DashboardCard
          title="Modules"
          value={0}
        />

        <DashboardCard
          title="Settings"
          value={settingsCount}
        />
      </div>
    </div>
  );
}

export default HomePage;