import { ipcRenderer } from "electron";

export const deckApi = {
	deckSave: (deckData: Deck) => ipcRenderer.invoke("deck-save", deckData),
	deckFindById: (deckId: number) =>
		ipcRenderer.invoke("deck-find-by-id", deckId),
	deckFindAll: () => ipcRenderer.invoke("deck-find-all"),
};
