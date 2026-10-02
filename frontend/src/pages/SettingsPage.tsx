import { useCallback, useEffect, useState } from "react";
import {
  getSettings,
  type Setting
} from "../api/settingApi";
import SettingForm from "../components/SettingForm";
import SettingList from "../components/SettingList";

function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadInitialSettings() {
      try {
        setLoading(true);
        setError(null);

        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error(error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to load settings");
        }
      } finally {
        setLoading(false);
      }
    }

    loadInitialSettings();
  }, []);

  return (
    <div>
      <h1>Settings</h1>

      <SettingForm onCreated={loadSettings} />

      {loading && <p>Loading settings...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && settings.length === 0 && (
        <p>No settings found.</p>
      )}

      {!loading && (
        <SettingList
          settings={settings}
          onUpdated={loadSettings}
        />
      )}
    </div>
  );
}

export default SettingsPage;
