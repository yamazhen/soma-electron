import { useState } from "react";

export const useSettingState = () => {
  const [settingsPage, setSettingsPage] = useState<
    "general" | "editor" | "account"
  >("general");

  return {
    settingsPage,
    setSettingsPage,
  };
};
