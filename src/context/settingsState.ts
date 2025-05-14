import { useState } from "react";

export const useSettingState = () => {
  const [settingsPage, setSettingsPage] = useState<"general" | "editor">(
    "general",
  );

  return {
    settingsPage,
    setSettingsPage,
  };
};
