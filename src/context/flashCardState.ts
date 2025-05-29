import { useEffect, useState } from "react";

export const useFlashCardState = () => {
	const [cardView, setCardView] = useState<
		"listing" | "review" | "create" | "viewing" | "inReview"
	>("listing");
	const [decks, setDecks] = useState<Deck[] | undefined>([]);
	const [deckInView, setDeckInView] = useState<Deck | undefined>(undefined);

	const viewCardSet = (deckId: number) => {
		try {
			window.deckIpc.deckFindById(deckId).then((res) => {
				if (res.success) {
					setDeckInView(res.deck);
					setCardView("viewing");
				} else {
					console.error("Error fetching deck:", res.error);
				}
			});
		} catch (e) {
			console.error("Error fetching deck:", e);
		}
	};

	const fetchDecks = async () => {
		try {
			const response = await window.deckIpc.deckFindAll();
			if (response.success) {
				setDecks(response.decks);
			} else {
				console.error("Error fetching decks:", response.error);
			}
		} catch (e) {
			console.error("Error fetching decks:", e);
		}
	};

	useEffect(() => {
		fetchDecks();
	}, []);

	return {
		cardView,
		setCardView,
		decks,
		fetchDecks,
		deckInView,
		setDeckInView,
		viewCardSet,
	};
};
