import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "tippy.js/dist/tippy.css";
import { PageProvider } from "./context/PageContext.tsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PageProvider>
      <App />
    </PageProvider>
  </React.StrictMode>,
);
