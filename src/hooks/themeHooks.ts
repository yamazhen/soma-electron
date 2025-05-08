import { useEffect } from "react";

export function useThemeListener() {
  useEffect(() => {
    // @ts-ignore
    const handleThemeUpdate = (e: Event, theme: string) => {
      document.documentElement.setAttribute("data-theme", theme);
    };

    window.ipcRenderer?.on("theme-updated", handleThemeUpdate);

    return () => {
      window.ipcRenderer?.off("theme-updated", handleThemeUpdate);
    };
  }, []);
}

export function setInitialTheme() {
  useEffect(() => {
    window.ipcRenderer
      .getTheme()
      .then((theme) => {
        document.documentElement.setAttribute("data-theme", theme);
      })
      .catch((e) => console.error("Error getting theme:", e));
  }, []);
}
