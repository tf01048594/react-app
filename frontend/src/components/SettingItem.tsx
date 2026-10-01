import { useState } from "react";
import {
  updateSetting,
  type Setting,
  type SettingInput,
  deleteSetting
} from "../api/settingApi";

interface SettingItemProps {
  setting: Setting;
  onUpdated: () => void;
}

function SettingItem({ setting, onUpdated }: SettingItemProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(setting.name);
  const [key, setKey] = useState(setting.key);
  const [value, setValue] = useState(setting.value ?? "");
  const [description, setDescription] = useState(
    setting.description ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    setLoading(true);
    setError(null);

    try {
      const data: SettingInput = {
        name,
        key,
        value,
        description
      };

      await updateSetting(setting.id, data);

      setEditing(false);

      onUpdated();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update setting");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setName(setting.name);
    setKey(setting.key);
    setValue(setting.value ?? "");
    setDescription(setting.description ?? "");

    setError(null);
    setEditing(false);
    setDeleting(false);
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
  
    try {
      await deleteSetting(setting.id);
      onUpdated();
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
  }

  if (editing) {
    return (
      <div>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <input
          value={key}
          onChange={(event) => setKey(event.target.value)}
        />

        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <button
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>

        <button
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </button>

        {error && <p>{error}</p>}
      </div>
    );
  }

  if (deleting) {
    return (
      <div>
        <p>Are you sure you want to delete this setting?</p>

        <button
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
        </button>

        <button
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </button>
        </div>)
   }

  return (
    <div>
      <h2>{setting.name}</h2>

      <p>Key: {setting.key}</p>
      <p>Value: {setting.value}</p>
      <p>Description: {setting.description}</p>

      <button onClick={() => setEditing(true)}>
        Edit
      </button>
      <button onClick={() => setDeleting(true)} disabled={loading}>
        {loading ? "Deleting..." : "Delete"}
    </button>
        {error && <p>{error}</p>}
    </div>
  );
}

export default SettingItem;