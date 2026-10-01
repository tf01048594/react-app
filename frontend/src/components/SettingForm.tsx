import { useState } from "react";
import {
  createSetting,
  type SettingInput
} from "../api/settingApi";

interface SettingFormProps {
  onCreated: () => void;
}

function SettingForm({ onCreated }: SettingFormProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const data: SettingInput = {
        name,
        key,
        value,
        description
      };

      await createSetting(data);

      setName("");
      setKey("");
      setValue("");
      setDescription("");

      onCreated();
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create setting");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Setting</h2>

      <div>
        <label>Name</label>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label>Key</label>

        <input
          value={key}
          onChange={(event) => setKey(event.target.value)}
        />
      </div>

      <div>
        <label>Value</label>

        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>

      <div>
        <label>Description</label>

        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>

      {error && <p>{error}</p>}
    </form>
  );
}

export default SettingForm;