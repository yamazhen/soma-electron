import { Routes, Route, HashRouter } from "react-router-dom";
import Search from "./features/notes/search/Search";
import MainWindow from "./components/layout/MainWindow";
import Settings from "./components/layout/Settings";
import { setInitialTheme, useThemeListener } from "./hooks/themeHooks";

function App() {
  setInitialTheme();
  useThemeListener();

  window.addEventListener(
    "click",
    (e) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      e.preventDefault();

      let href = anchor.getAttribute("href")!;
      if (!href.match(/^[a-z]+:/i)) {
        href = "https://" + href;
      }
      window.ipcRenderer.openExternalLink(href);
    },
    { capture: true },
  );

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainWindow />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
