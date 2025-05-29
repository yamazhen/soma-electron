import { app } from "electron";
import "./config/config";
import { initializeApp } from "./app/appInitializer";

app.setAsDefaultProtocolClient("soma");

app.whenReady().then(initializeApp);
