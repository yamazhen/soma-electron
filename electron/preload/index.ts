import { contextBridge } from "electron";
import { fileSystemApi } from "./api/fileSystem";
import { deckApi } from "./api/deck";
import { questionApi, quizApi } from "./api/quiz";
import { oAuthApi } from "./api/oAuth";
import { secureStoreApi } from "./api/secureStore";
import { userDataApi } from "./api/userData";
import { serverApi } from "./api/serverApi";
import { windowApi } from "./api/window";

contextBridge.exposeInMainWorld("fileSystem", fileSystemApi);

contextBridge.exposeInMainWorld("deckIpc", deckApi);
contextBridge.exposeInMainWorld("quizIpc", quizApi);

contextBridge.exposeInMainWorld("oauthIpc", oAuthApi);

contextBridge.exposeInMainWorld("questionIpc", questionApi);

contextBridge.exposeInMainWorld("secureStore", secureStoreApi);

contextBridge.exposeInMainWorld("userData", userDataApi);

contextBridge.exposeInMainWorld("serverApi", serverApi);

contextBridge.exposeInMainWorld("ipcRenderer", windowApi);
