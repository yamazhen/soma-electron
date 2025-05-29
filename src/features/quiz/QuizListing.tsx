import {
	CalendarCheck2,
	ChevronDown,
	ChevronRight,
	Lightbulb,
	Play,
	FileQuestion,
	Clock,
	Plus,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatMessageWithTags } from "../../utils/message";

interface Props {
	setQuizInReview: (quizData: QuizDetails | undefined) => void;
}

const QuizListing: React.FC<Props> = ({ setQuizInReview }) => {
	const { getMessage, quizzes, setQuizView, fetchQuizzes } = useAppContext();
	const [expandedQuizzes, setExpandedQuizzes] = useState<number[]>([]);

	const reviewQuiz = async (quizId: number) => {
		try {
			const response = await window.quizIpc.get(quizId);
			if (response.success) {
				setQuizInReview(response.quiz);
				setQuizView("inReview");
			} else {
				console.error("Error fetching quiz:", response.error);
			}
		} catch (e) {
			console.error("Exception while fetching quiz:", e);
		}
	};

	const toggleQuizExpansion = (id: number) => {
		setExpandedQuizzes((prev) =>
			prev.includes(id)
				? prev.filter((quizId) => quizId !== id)
				: [...prev, id],
		);
	};

	return (
		<section className="h-full w-full bg-soma-darkest overflow-auto">
			<div className="min-h-full flex items-center justify-center py-6">
				<div className="w-full max-w-4xl px-6">
					{/* Header */}
					<div className="mb-6">
						<h1 className="text-3xl font-bold text-soma-text-primary mb-2">
							{getMessage("quiz.listing")}
						</h1>
						<p className="text-soma-text-secondary">
							Manage and review your quizzes
						</p>
					</div>

					{/* Info Banner */}
					<div className="bg-soma-dark p-5 rounded-xl mb-6 flex items-center gap-3">
						<div className="p-2.5 bg-yellow-500/20 rounded-lg">
							<Lightbulb className="text-soma-warning" size={20} />
						</div>
						<p className="text-soma-text-primary text-sm leading-relaxed">
							{formatMessageWithTags(getMessage("quiz.listingInfo"))}
						</p>
					</div>

					{/* Quiz Cards */}
					<div className="space-y-3 pb-6">
						{quizzes && quizzes.length > 0 ? (
							quizzes.map((quiz) => (
								<div
									key={quiz.id}
									className="bg-soma-dark rounded-xl p-5 hover:bg-soma-medium transition-colors"
								>
									{/* Quiz Header */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={() => quiz.id && toggleQuizExpansion(quiz.id)}
												className="p-1.5 hover:bg-soma-light hover:bg-opacity-20 rounded-lg transition-colors"
											>
												{quiz.id && expandedQuizzes.includes(quiz.id) ? (
													<ChevronDown
														className="text-soma-text-secondary"
														size={20}
													/>
												) : (
													<ChevronRight
														className="text-soma-text-secondary"
														size={20}
													/>
												)}
											</button>
											<div>
												<h3 className="text-xl font-semibold text-soma-text-primary">
													{quiz.title}
												</h3>
												<span className="text-soma-text-secondary text-sm">
													{quiz.questions.length} questions
												</span>
											</div>
										</div>

										<button
											type="button"
											onClick={() => quiz.id && reviewQuiz(quiz.id)}
											className="px-4 py-2.5 bg-soma-success text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 text-sm font-medium"
										>
											<Play size={18} />
											Start Review
										</button>
									</div>

									{/* Expanded Questions */}
									{quiz.id && expandedQuizzes.includes(quiz.id) && (
										<div className="mt-4 border-t border-soma-light border-opacity-20 pt-4">
											{quiz.questions && quiz.questions.length > 0 ? (
												<div className="space-y-2">
													<div className="flex items-center justify-between mb-3">
														<h4 className="text-sm font-semibold text-soma-text-secondary uppercase tracking-wider">
															Questions
														</h4>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<button
																	type="button"
																	className="px-3 py-1.5 bg-soma-error/20 text-soma-error rounded-lg hover:bg-soma-error/30 transition-all flex items-center gap-2 text-sm font-medium cursor-pointer"
																>
																	<Trash2 size={16} />
																	Delete Quiz
																</button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Are you absolutely sure?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		This action cannot be undone. This will
																		permanently delete "{quiz.title}" and all
																		its questions.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() => {
																			window.quizIpc.delete(quiz.id);
																			fetchQuizzes();
																		}}
																		className="bg-soma-error text-white hover:bg-soma-error/90 cursor-pointer"
																	>
																		Delete Quiz
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
													{quiz.questions.map((question, _index) => (
														<div
															key={question.id}
															className="bg-soma-medium bg-opacity-50 p-4 rounded-lg hover:bg-soma-medium transition-colors"
														>
															<div className="flex items-center justify-between gap-4">
																<p className="text-soma-text-primary text-sm flex-1">
																	{question.text}
																</p>
																<div className="flex-shrink-0">
																	{question.scheduled ? (
																		<div className="flex items-center gap-1.5 text-soma-success text-sm">
																			<CalendarCheck2 size={14} />
																			<span>Scheduled</span>
																		</div>
																	) : (
																		<div className="flex items-center gap-1.5 text-soma-lightest text-sm">
																			<Clock size={14} />
																			<span>Not Scheduled</span>
																		</div>
																	)}
																</div>
															</div>
														</div>
													))}
												</div>
											) : (
												<p className="text-soma-text-secondary italic text-center py-6 text-sm">
													No questions available
												</p>
											)}
										</div>
									)}
								</div>
							))
						) : (
							<div className="bg-soma-dark rounded-xl p-12">
								<div className="flex flex-col items-center gap-4 text-center">
									<div className="p-4 bg-soma-medium bg-opacity-30 rounded-full">
										<FileQuestion
											size={32}
											className="text-soma-text-secondary"
										/>
									</div>
									<div>
										<h3 className="text-xl font-semibold text-soma-text-primary mb-2">
											No Quizzes Yet
										</h3>
										<p className="text-soma-text-secondary">
											Create your first quiz to get started
										</p>
									</div>
									<button
										type="button"
										className="mt-2 px-6 py-2.5 bg-soma-accent1 text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 font-medium cursor-pointer"
										onClick={() => setQuizView("create")}
									>
										<Plus size={20} />
										Create New Quiz
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

export default QuizListing;
