import type { Setting } from "../api/settingApi";
import SettingItem from "./SettingItem";

interface SettingListProps {
  settings: Setting[];
  onUpdated: () => void;
}

function SettingList({ settings, onUpdated }: SettingListProps) {
  return (
    <div>
      {settings.map((setting) => (
        <SettingItem
          key={setting.id}
          setting={setting}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

export default SettingList;