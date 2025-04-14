import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "tippy.js/dist/tippy.css";
import "./styles/global.css";
import { AppProvider } from "./context/AppContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
