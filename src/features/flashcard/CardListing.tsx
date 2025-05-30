import React from "react";
import CardSet from "./CardSet";
import { useAppContext } from "../../context/AppContext";
import { Package, Plus } from "lucide-react";

const CardListing: React.FC<Props> = () => {
	const { getMessage, viewCardSet, decks, setCardView } = useAppContext();

	return (
		<section className="h-full w-full bg-soma-darkest overflow-auto">
			<div className="min-h-full flex items-center justify-center py-6">
				<div className="w-full max-w-4xl px-6">
					{/* Header */}
					<div className="mb-6">
						<h1 className="text-3xl font-bold text-soma-text-primary mb-2">
							{getMessage("flashcard.listing")}
						</h1>
						<p className="text-soma-text-secondary">
							Review and manage your flashcard decks
						</p>
					</div>

					{/* Deck Grid */}
					{!decks || decks.length === 0 ? (
						<div className="bg-soma-dark rounded-xl p-16">
							<div className="flex flex-col items-center gap-4 text-center">
								<div className="p-4 bg-soma-medium bg-opacity-30 rounded-full">
									<Package size={32} className="text-soma-text-secondary" />
								</div>
								<div>
									<h3 className="text-xl font-semibold text-soma-text-primary mb-2">
										No Decks Yet
									</h3>
									<p className="text-soma-text-secondary">
										Create your first deck to start learning
									</p>
								</div>
								<button
									className="mt-2 px-6 py-2.5 bg-soma-accent1 text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 font-medium cursor-pointer"
									onClick={() => setCardView("create")}
								>
									<Plus size={20} />
									Create New Deck
								</button>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{decks.map((deck) => (
								<div
									key={deck.id}
									onClick={() => viewCardSet(deck.id!)}
									className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
								>
									<CardSet
										cardSetName={deck.title}
										cardSetCount={deck.cards.length}
									/>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default CardListing;
