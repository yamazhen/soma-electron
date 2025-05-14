import React, { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import {
  X,
  Settings as SettingsIcon,
  FileText,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";

const Settings: React.FC = () => {
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

  const themeOptions = [
    { value: "system", label: "System", icon: Laptop },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
  ];

  return (
    <section className="flex h-full w-full bg-soma-darkest">
      {/* Draggable area */}
      <span
        id="settingsDragWindow"
        className="w-full block absolute h-10 drag z-10"
      />

      {/* Close button */}
      <button
        onClick={() => window.ipcRenderer.closeSettings()}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg hover:bg-soma-light/10 transition-colors no-drag"
      >
        <X
          size={20}
          className="text-soma-text-secondary hover:text-soma-text-primary"
        />
      </button>

      {/* Sidebar */}
      <aside className="w-64 bg-soma-dark border-r border-soma-light/10">
        <div className="p-6">
          <h1 className="text-soma-text-secondary uppercase text-xs font-semibold tracking-wider mb-4">
            Settings
          </h1>

          <nav className="space-y-1">
            <button
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  settingsPage === "general"
                    ? "bg-soma-accent1 text-white shadow-lg"
                    : "text-soma-text-secondary hover:text-soma-text-primary hover:bg-soma-light/10"
                }
              `}
              onClick={() => setSettingsPage("general")}
            >
              <SettingsIcon size={18} />
              General
            </button>

            <button
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  settingsPage === "editor"
                    ? "bg-soma-accent1 text-white shadow-lg"
                    : "text-soma-text-secondary hover:text-soma-text-primary hover:bg-soma-light/10"
                }
              `}
              onClick={() => setSettingsPage("editor")}
            >
              <FileText size={18} />
              Editor
            </button>
          </nav>
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 p-8">
        {settingsPage === "general" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-soma-text-primary mb-6">
              General Settings
            </h2>

            <div className="space-y-6">
              {/* Theme setting */}
              <div className="bg-soma-dark rounded-lg p-6">
                <label className="block text-sm font-medium text-soma-text-primary mb-3">
                  Appearance
                </label>

                <div className="relative">
                  <Listbox value={theme} onChange={changeTheme}>
                    <Listbox.Button className="w-full sm:w-64 bg-soma-darkest border border-soma-light/20 rounded-lg px-4 py-2.5 text-left text-soma-text-primary hover:border-soma-light/40 focus:outline-none focus:ring-2 focus:ring-soma-accent1 focus:ring-offset-2 focus:ring-offset-soma-dark transition-colors">
                      <span className="flex items-center gap-3">
                        {React.createElement(
                          themeOptions.find((opt) => opt.value === theme)
                            ?.icon || Laptop,
                          { size: 18 },
                        )}
                        {themeOptions.find((opt) => opt.value === theme)?.label}
                      </span>
                    </Listbox.Button>

                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-50 mt-2 w-full sm:w-64 bg-soma-dark rounded-lg shadow-xl border border-soma-light/10 py-1 focus:outline-none">
                        {themeOptions.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none py-2.5 px-4 flex items-center gap-3 transition-colors ${
                                active || selected
                                  ? "bg-soma-light/10 text-soma-text-primary"
                                  : "text-soma-text-secondary"
                              }`
                            }
                          >
                            <option.icon size={18} />
                            <span>{option.label}</span>
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </Listbox>
                </div>

                <p className="mt-3 text-sm text-soma-text-secondary">
                  Choose your preferred color theme or use system settings
                </p>
              </div>
            </div>
          </div>
        )}

        {settingsPage === "editor" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-soma-text-primary mb-6">
              Editor Settings
            </h2>

            <div className="bg-soma-dark rounded-lg p-6">
              <p className="text-soma-text-secondary">
                Editor settings coming soon...
              </p>
            </div>
          </div>
        )}
      </main>
    </section>
  );
};

export default Settings;
