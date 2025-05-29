import React, { useState } from "react";
import { CirclePlus, X, CreditCard, ArrowRight } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

interface Card {
	front: string;
	back: string;
}

const CardCreateForm: React.FC = () => {
	const { setCardView, fetchDecks } = useAppContext();
	const [title, setTitle] = useState("");
	const [cards, setCards] = useState<Card[]>([{ front: "", back: "" }]);

	const handleCardChange = (
		index: number,
		field: keyof Card,
		value: string,
	) => {
		setCards((prev) =>
			prev.map((card, i) => (i === index ? { ...card, [field]: value } : card)),
		);
	};

	const addCard = () => setCards((prev) => [...prev, { front: "", back: "" }]);

	const removeCard = (index: number) =>
		setCards((prev) => prev.filter((_, i) => i !== index));

	const getPayload = () => ({ title, cards });

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) {
			console.error("Set title is required");
			return;
		}
		if (cards.some((card) => !card.front.trim() || !card.back.trim())) {
			console.error("All cards must have a question and an answer");
			return;
		}
		window.deckIpc.deckSave(getPayload()).then((res) => {
			if (res.success) {
				fetchDecks();
				setCardView("listing");
			} else {
				console.error("Failed to save deck:", res.error);
			}
		});
	};

	return (
		<section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
			<form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 lg:p-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-soma-text-primary mb-3">
						Create Card Set
					</h1>
					<p className="text-soma-text-secondary">
						Build a flashcard deck for effective studying
					</p>
				</div>

				{/* Title Input */}
				<div className="bg-soma-dark rounded-2xl p-6 mb-8">
					<label
						htmlFor="setTitle"
						className="text-xl font-semibold text-soma-text-primary mb-4 block"
					>
						Set Title
					</label>
					<input
						id="setTitle"
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
						className="bg-soma-medium border border-soma-light rounded-xl p-4 w-full text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent2 focus:outline-none transition-colors"
						placeholder="Enter an engaging title for your card set"
					/>
				</div>

				{/* Cards Section */}
				<div className="bg-soma-dark rounded-2xl p-6 mb-8">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-2 bg-soma-accent3/20 rounded-xl">
							<CreditCard className="text-soma-accent3" size={24} />
						</div>
						<h2 className="text-xl font-semibold text-soma-text-primary">
							Flashcards
						</h2>
						<span className="bg-soma-medium px-3 py-1 rounded-lg text-sm text-soma-text-secondary">
							{cards.length} {cards.length === 1 ? "card" : "cards"}
						</span>
					</div>

					<div className="space-y-6">
						{cards.map((card, idx) => (
							<div
								key={idx}
								className="bg-soma-medium rounded-xl p-6 hover:bg-soma-light transition-colors group"
							>
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-3">
										<span className="text-soma-accent3 font-semibold">
											Card {idx + 1}
										</span>
									</div>
									{cards.length > 1 && (
										<button
											type="button"
											onClick={() => removeCard(idx)}
											className="bg-soma-error/20 p-2 rounded-xl hover:bg-soma-error/30 transition-colors opacity-0 group-hover:opacity-100"
										>
											<X size={20} className="text-soma-error" />
										</button>
									)}
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<div>
										<label className="text-sm font-medium text-soma-text-secondary mb-2 block">
											Front Side
										</label>
										<input
											type="text"
											value={card.front}
											onChange={(e) =>
												handleCardChange(idx, "front", e.target.value)
											}
											placeholder="Enter question or prompt"
											className="bg-soma-dark border border-soma-light rounded-xl p-4 w-full text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent3 focus:outline-none transition-colors"
										/>
									</div>

									<div>
										<label className="text-sm font-medium text-soma-text-secondary mb-2 block">
											Back Side
										</label>
										<input
											type="text"
											value={card.back}
											onChange={(e) =>
												handleCardChange(idx, "back", e.target.value)
											}
											placeholder="Enter answer or definition"
											className="bg-soma-dark border border-soma-light rounded-xl p-4 w-full text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent3 focus:outline-none transition-colors"
										/>
									</div>
								</div>

								{/* Visual indicator showing front to back */}
								<div className="flex items-center justify-center mt-4 text-soma-lightest">
									<span className="text-xs">Front</span>
									<ArrowRight size={16} className="mx-2" />
									<span className="text-xs">Back</span>
								</div>
							</div>
						))}
					</div>

					{/* Add Card Button */}
					<div className="flex justify-center mt-6">
						<button
							type="button"
							onClick={addCard}
							className="bg-soma-accent3/20 p-4 rounded-xl hover:bg-soma-accent3/30 transition-all flex items-center gap-3 text-soma-accent3 font-medium"
						>
							<CirclePlus size={20} />
							Add Another Card
						</button>
					</div>
				</div>

				{/* Submit Button */}
				<div className="flex justify-center mb-3">
					<button
						type="submit"
						className="bg-soma-accent2/20 text-soma-accent2 py-4 px-12 rounded-xl hover:bg-soma-accent2/90 transition-all font-semibold text-lg hover:text-soma-darkest"
					>
						Create Card Set
					</button>
				</div>
			</form>
		</section>
	);
};

export default CardCreateForm;
