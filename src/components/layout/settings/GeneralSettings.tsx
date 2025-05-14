import { Select } from "@headlessui/react";
import React, { useEffect, useState } from "react";

const GeneralSettings: React.FC = () => {
  const [theme, setTheme] = useState<string>("system");
  useEffect(() => {
    window.ipcRenderer.getTheme().then(setTheme);
  }, []);

  const changeTheme = (theme: string) => {
    switch (theme) {
      case "dark":
        document.documentElement.setAttribute("data-theme", "dark");
        window.ipcRenderer.changeTheme("dark");
        setTheme("dark");
        break;
      case "light":
        document.documentElement.setAttribute("data-theme", "light");
        window.ipcRenderer.changeTheme("light");
        setTheme("light");
        break;
      case "system":
        document.documentElement.removeAttribute("data-theme");
        window.ipcRenderer.changeTheme("system");
        setTheme("system");
        break;
      default:
        console.error("Invalid theme selected");
        break;
    }
  };

  return (
    <div id="theme" className="flex items-center gap-2">
      <label>Theme</label>
      <Select
        name="theme"
        aria-label="App Theme"
        className="bg-soma-light border border-soma-medium py-0.5 rounded-md no-drag z-50"
        value={theme}
        onChange={(e) => changeTheme(e.target.value)}
      >
        <option value="system">System</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </Select>
    </div>
  );
};

export default GeneralSettings;
