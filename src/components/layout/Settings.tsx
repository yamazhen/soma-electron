import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { X } from "lucide-react";
import SideMenuButton from "../ui/buttons/SideMenuButton";
import { Select } from "@headlessui/react";

type Props = {};

const Settings: React.FC<Props> = () => {
  const { setSettingsPage, settingsPage } = useAppContext();
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
    <section className="flex h-full w-full">
      <span
        id="settingsDragWindow"
        className="w-full block absolute h-8 drag z-10"
      />
      <div
        id="closeSettings"
        className="absolute top-3 right-3 z-20 pointer-events-auto no-drag"
      >
        <SideMenuButton onClick={() => window.ipcRenderer.closeSettings()}>
          <X size={20} strokeWidth={1.5} />
        </SideMenuButton>
      </div>
      <div className="bg-soma-dark w-60 min-w-60 flex flex-col gap-1 p-4 border border-soma-medium">
        <h1 className="text-soma-lightest uppercase font-mono text-xs my-1 ml-2 tracking-wider font-bold">
          Options
        </h1>
        <button
          className={`settingsButton ${settingsPage === "general" ? "bg-soma-accent2 hover:!bg-soma-accent2" : ""}`}
          onClick={() => setSettingsPage("general")}
        >
          General
        </button>
        <button
          className={`settingsButton ${settingsPage === "editor" ? "bg-soma-accent2 hover:!bg-soma-accent2" : ""}`}
          onClick={() => setSettingsPage("editor")}
        >
          Editor
        </button>
      </div>
      <div className="bg-soma-darkest flex-1 px-4 pt-5 pb-4 text-sm">
        <div id="theme" className="flex items-center gap-2">
          <label>Theme</label>
          <Select
            name="theme"
            aria-label="App Theme"
            className="bg-soma-light border border-soma-medium py-0.5 rounded-md no-drag z-50"
            value={theme}
            onChange={(e) => changeTheme(e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default Settings;
