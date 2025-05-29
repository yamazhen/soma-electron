import {
	Lightbulb,
	Brain,
	Calendar,
	TrendingUp,
	BarChart3,
	Target,
	Clock,
	CheckCircle,
	Play,
	Sparkles,
	AlertCircle,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

type ReviewFilter = "all" | "due-today" | "overdue" | "upcoming";

interface Props {
	setQuizInReview: (quiz: QuizDetails) => void;
}

const QuizReview: React.FC<Props> = ({ setQuizInReview }) => {
	const { quizzes, setQuizView } = useAppContext();
	const [filter, setFilter] = useState<ReviewFilter>("all");

	const analytics = {
		totalReviews: 342,
		streakDays: 14,
		accuracy: 87,
		cardsToday: 25,
		cardsDue: 12,
		cardsOverdue: 3,
		weakQuestions: 8,
	};

	const scheduledQuizzes =
		quizzes?.map((quiz) => ({
			...quiz,
			dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
			lastReviewed: new Date(
				Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
			),
			accuracy: Math.floor(Math.random() * 40) + 60,
			reviewCount: Math.floor(Math.random() * 20),
		})) || [];

	const filterQuizzes = () => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		switch (filter) {
			case "due-today":
				return scheduledQuizzes.filter(
					(quiz) => quiz.dueDate.toDateString() === today.toDateString(),
				);
			case "overdue":
				return scheduledQuizzes.filter((quiz) => quiz.dueDate < now);
			case "upcoming":
				return scheduledQuizzes.filter((quiz) => quiz.dueDate > now);
			default:
				return scheduledQuizzes;
		}
	};

	const filteredQuizzes = filterQuizzes();

	const startGeneralReview = () => {
		setQuizView("generalReview");
	};

	const startWeakQuestionsReview = () => {
		setQuizView("weakReview");
	};

	const startReview = (quizId: number) => {
		const quiz = quizzes?.find((q) => q.id === quizId);
		if (quiz) {
			setQuizInReview(quiz);
			setQuizView("inReview");
		}
	};

	return (
		<section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
			<div className="max-w-6xl mx-auto pb-12">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-soma-text-primary mb-3">
						Quiz Reviews
					</h1>
					<p className="text-soma-text-secondary">
						Track your progress and review scheduled quizzes
					</p>
				</div>

				{/* Info Banner */}
				<div className="bg-soma-dark p-5 rounded-xl mb-8 flex items-center gap-3">
					<div className="p-2.5 bg-yellow-500/20 rounded-lg flex-shrink-0">
						<Lightbulb className="text-soma-warning" size={20} />
					</div>
					<p className="text-soma-text-primary text-sm leading-relaxed">
						Soma Review uses spaced repetition to help you learn and retain
						information effectively. Questions will appear based on how well you
						know them.
					</p>
				</div>

				{/* Quick Actions - NEW SECTION */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div
						className="bg-soma-dark rounded-2xl p-6 hover:bg-soma-medium transition-all group cursor-pointer"
						onClick={startGeneralReview}
					>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-soma-accent1/20 rounded-xl">
									<Sparkles className="text-soma-accent1" size={28} />
								</div>
								<div>
									<h3 className="text-xl font-semibold text-soma-text-primary">
										Start General Review
									</h3>
									<p className="text-soma-text-secondary text-sm mt-1">
										Review all due questions across all quizzes
									</p>
								</div>
							</div>
							<Play
								className="text-soma-accent1 group-hover:translate-x-1 transition-transform"
								size={24}
							/>
						</div>
						<div className="flex items-center gap-6 text-sm">
							<div className="flex items-center gap-2">
								<Clock size={16} className="text-soma-lightest" />
								<span className="text-soma-text-secondary">
									{analytics.cardsToday} due today
								</span>
							</div>
							<div className="flex items-center gap-2">
								<AlertCircle size={16} className="text-soma-error" />
								<span className="text-soma-text-secondary">
									{analytics.cardsOverdue} overdue
								</span>
							</div>
						</div>
					</div>

					<div
						className="bg-soma-dark rounded-2xl p-6 hover:bg-soma-medium transition-all group cursor-pointer"
						onClick={startWeakQuestionsReview}
					>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-soma-warning/20 rounded-xl">
									<Target className="text-soma-warning" size={28} />
								</div>
								<div>
									<h3 className="text-xl font-semibold text-soma-text-primary">
										Review Weak Questions
									</h3>
									<p className="text-soma-text-secondary text-sm mt-1">
										Focus on questions with low accuracy
									</p>
								</div>
							</div>
							<Play
								className="text-soma-warning group-hover:translate-x-1 transition-transform"
								size={24}
							/>
						</div>
						<div className="flex items-center gap-6 text-sm">
							<div className="flex items-center gap-2">
								<AlertCircle size={16} className="text-soma-warning" />
								<span className="text-soma-text-secondary">
									{analytics.weakQuestions} weak questions
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Target size={16} className="text-soma-lightest" />
								<span className="text-soma-text-secondary">
									Below 70% accuracy
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Analytics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					<div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-soma-warning/20 rounded-xl">
								<Calendar className="text-soma-warning" size={24} />
							</div>
							<span className="text-soma-text-secondary font-medium">
								Study Streak
							</span>
						</div>
						<p className="text-3xl font-bold text-soma-text-primary">
							{analytics.streakDays} days
						</p>
						<p className="text-sm text-soma-lightest mt-2">Keep it going!</p>
					</div>

					<div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-soma-accent1/20 rounded-xl">
								<Target className="text-soma-accent1" size={24} />
							</div>
							<span className="text-soma-text-secondary font-medium">
								Accuracy Rate
							</span>
						</div>
						<p className="text-3xl font-bold text-soma-text-primary">
							{analytics.accuracy}%
						</p>
						<div className="w-full bg-soma-medium rounded-full h-2 mt-3">
							<div
								className="bg-soma-accent1 rounded-full h-2 transition-all duration-500"
								style={{ width: `${analytics.accuracy}%` }}
							/>
						</div>
					</div>

					<div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-soma-accent3/20 rounded-xl">
								<Brain className="text-soma-accent3" size={24} />
							</div>
							<span className="text-soma-text-secondary font-medium">
								Total Reviews
							</span>
						</div>
						<p className="text-3xl font-bold text-soma-text-primary">
							{analytics.totalReviews}
						</p>
						<p className="text-sm text-soma-lightest mt-2">Lifetime total</p>
					</div>
				</div>

				{/* Review Summary */}
				<div className="bg-soma-dark rounded-2xl p-6 mb-8">
					<h2 className="text-xl font-semibold text-soma-text-primary mb-4 flex items-center gap-3">
						<Clock className="text-soma-accent2" size={24} />
						Today's Overview
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-soma-medium/50 rounded-xl p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-soma-text-secondary">Due Today</span>
								<span className="px-2 py-1 bg-soma-accent1/20 text-soma-accent1 rounded-lg text-sm font-medium">
									{analytics.cardsToday}
								</span>
							</div>
							<p className="text-sm text-soma-lightest">
								Questions scheduled for today
							</p>
						</div>
						<div className="bg-soma-medium/50 rounded-xl p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-soma-text-secondary">Overdue</span>
								<span className="px-2 py-1 bg-soma-error/20 text-soma-error rounded-lg text-sm font-medium">
									{analytics.cardsOverdue}
								</span>
							</div>
							<p className="text-sm text-soma-lightest">
								Questions waiting for review
							</p>
						</div>
						<div className="bg-soma-medium/50 rounded-xl p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-soma-text-secondary">Completed</span>
								<span className="px-2 py-1 bg-soma-success/20 text-soma-success rounded-lg text-sm font-medium">
									{analytics.cardsDue}
								</span>
							</div>
							<p className="text-sm text-soma-lightest">Reviews done today</p>
						</div>
					</div>
				</div>

				{/* Quiz List with Filters */}
				<div className="bg-soma-dark rounded-2xl p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-semibold text-soma-text-primary flex items-center gap-3">
							<BarChart3 className="text-soma-accent2" size={24} />
							Review by Quiz Set
						</h2>

						{/* Filter Buttons */}
						<div className="flex gap-2">
							{(["all", "due-today", "overdue", "upcoming"] as const).map(
								(filterType) => (
									<button
										type="button"
										key={filterType}
										onClick={() => setFilter(filterType)}
										className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
											filter === filterType
												? "bg-soma-accent1 text-white"
												: "bg-soma-medium text-soma-text-secondary hover:bg-soma-light"
										}`}
									>
										{filterType.charAt(0).toUpperCase() +
											filterType.slice(1).replace("-", " ")}
									</button>
								),
							)}
						</div>
					</div>

					<div className="space-y-3">
						{filteredQuizzes.length > 0 ? (
							filteredQuizzes.map((quiz) => (
								<div
									key={quiz.id}
									className="bg-soma-medium/50 rounded-xl p-5 hover:bg-soma-medium transition-colors"
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<h3 className="text-lg font-semibold text-soma-text-primary">
													{quiz.title}
												</h3>
												<span className="text-sm text-soma-text-secondary">
													{quiz.questions.length} questions
												</span>
											</div>

											<div className="flex items-center gap-6 text-sm">
												<div className="flex items-center gap-1.5">
													<Clock size={14} className="text-soma-lightest" />
													<span className="text-soma-text-secondary">
														Due {quiz.dueDate.toLocaleDateString()}
													</span>
												</div>
												<div className="flex items-center gap-1.5">
													<CheckCircle
														size={14}
														className="text-soma-success"
													/>
													<span className="text-soma-text-secondary">
														{quiz.accuracy}% accuracy
													</span>
												</div>
												<div className="flex items-center gap-1.5">
													<TrendingUp size={14} className="text-soma-accent3" />
													<span className="text-soma-text-secondary">
														{quiz.reviewCount} reviews
													</span>
												</div>
											</div>
										</div>

										<button
											type="button"
											onClick={() => quiz.id && startReview(quiz.id)}
											className="px-4 py-2.5 bg-soma-accent1 text-white rounded-lg hover:bg-soma-accent1/90 transition-all flex items-center gap-2 font-medium"
										>
											<Play size={18} />
											Start Review
										</button>
									</div>
								</div>
							))
						) : (
							<div className="text-center py-12">
								<div className="flex flex-col items-center gap-4">
									<div className="p-4 bg-soma-medium/30 rounded-full">
										<CheckCircle
											size={32}
											className="text-soma-text-secondary"
										/>
									</div>
									<div>
										<h3 className="text-lg font-semibold text-soma-text-primary mb-2">
											{filter === "all"
												? "No quizzes available"
												: "No quizzes in this category"}
										</h3>
										<p className="text-soma-text-secondary">
											{filter === "all"
												? "Create and schedule quizzes to see them here"
												: "Try changing the filter to see more quizzes"}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

export default QuizReview;
