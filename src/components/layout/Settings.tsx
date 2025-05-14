import React from "react";
import { X } from "lucide-react";
import SideMenuButton from "../ui/buttons/Button";
import { useAppContext } from "../../context/AppContext";
import GeneralSettings from "./settings/GeneralSettings";

const Settings: React.FC = () => {
  const { setSettingsPage, settingsPage } = useAppContext();

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
        {settingsPage === "general" && <GeneralSettings />}
      </div>
    </section>
  );
};

export default Settings;
