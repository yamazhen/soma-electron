import { app } from "electron";
import "./config";
import { initializeApp } from "./app/appInitializer.js";

app.setAsDefaultProtocolClient("soma");

app.whenReady().then(initializeApp);
