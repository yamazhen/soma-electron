import React, { useState, useEffect, useRef } from "react";
import {
	Brain,
	Calendar,
	Flame,
	NotebookText,
	WalletCards,
	Clock,
	ChevronRight,
	Plus,
	BookOpen,
} from "lucide-react";
import { useCurrentDate } from "../../utils/DateUpdater";
import { useAppContext } from "../../context/AppContext";

const Home: React.FC = () => {
	const currentDate = useCurrentDate();
	const {
		getMessage,
		currentLang,
		getAllNotesOnly,
		setActivePage,
		setNoteView,
		setQuizView,
		setCardView,
		handleCreateNote,
		recordActivity,
		lastActivityUpdate,
	} = useAppContext();

	const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
	const [loading, setLoading] = useState(true);
	const [studyMinutes, setStudyMinutes] = useState(0);
	const [isStudying, setIsStudying] = useState(false);
	const studyStartTime = useRef<number | null>(null);

	// Track real study activities
	useEffect(() => {
		// Load saved study time for today
		const savedTime = localStorage.getItem("todayStudyTime");
		const lastSaveDate = localStorage.getItem("lastSaveDate");
		const today = new Date().toDateString();

		if (lastSaveDate === today && savedTime) {
			setStudyMinutes(parseInt(savedTime));
		} else {
			setStudyMinutes(0);
			localStorage.setItem("lastSaveDate", today);
			localStorage.setItem("todayStudyTime", "0");
		}
	}, []);

	// Start study session when user interacts with study features
	const startStudySession = () => {
		if (!isStudying) {
			setIsStudying(true);
			studyStartTime.current = Date.now();
		}
	};

	// End study session and add time
	const endStudySession = () => {
		if (isStudying && studyStartTime.current) {
			const sessionTime = Math.floor(
				(Date.now() - studyStartTime.current) / 60000,
			); // minutes
			setStudyMinutes((prev) => {
				const newTime = prev + sessionTime;
				localStorage.setItem("todayStudyTime", newTime.toString());
				return newTime;
			});
			setIsStudying(false);
			studyStartTime.current = null;
		}
	};

	// Auto-end session after inactivity
	useEffect(() => {
		let inactivityTimer: NodeJS.Timeout;

		const handleActivity = () => {
			if (isStudying) {
				clearTimeout(inactivityTimer);
				inactivityTimer = setTimeout(endStudySession, 5 * 60 * 1000); // 5 min inactivity
			}
		};

		if (isStudying) {
			window.addEventListener("mousemove", handleActivity);
			window.addEventListener("keypress", handleActivity);
			handleActivity(); // Start the timer
		}

		return () => {
			window.removeEventListener("mousemove", handleActivity);
			window.removeEventListener("keypress", handleActivity);
			clearTimeout(inactivityTimer);
		};
	}, [isStudying]);

	// Load real analytics data
	useEffect(() => {
		const loadAnalytics = async () => {
			try {
				setLoading(true);

				// Get dashboard analytics
				const analyticsResult = await window.dashboardApi.getAnalytics();
				if (analyticsResult.success) {
					setAnalytics(analyticsResult.analytics);
				}

				// Get recent activity
				const activityResult = await window.dashboardApi.getRecentActivity();
				if (activityResult.success) {
					setRecentActivity(activityResult.activity);
				}

				// Calculate study time from localStorage
				const savedTime = localStorage.getItem("todayStudyTime");
				const lastSaveDate = localStorage.getItem("lastSaveDate");
				const today = new Date().toDateString();

				if (lastSaveDate === today && savedTime) {
					setStudyMinutes(parseInt(savedTime));
				} else {
					setStudyMinutes(0);
					localStorage.setItem("lastSaveDate", today);
					localStorage.setItem("todayStudyTime", "0");
				}
			} catch (error) {
				console.error("Error loading analytics:", error);
			} finally {
				setLoading(false);
			}
		};

		loadAnalytics();
	}, [lastActivityUpdate]);

	// Update study time periodically (only when app is active)
	useEffect(() => {
		const interval = setInterval(() => {
			if (!document.hidden) {
				setStudyMinutes((prev) => {
					const newTime = prev + 1;
					localStorage.setItem("todayStudyTime", newTime.toString());
					return newTime;
				});
			}
		}, 60000); // Update every minute

		return () => clearInterval(interval);
	}, []);

	const allNotes = getAllNotesOnly();

	// Calculate stats with real data
	const stats = {
		streak: analytics?.studyStreak || 0,
		totalNotes: allNotes.length, // Use real notes count
		totalQuizzes: analytics?.totalQuizzes || 0,
		totalFlashcards: analytics?.totalFlashcards || 0,
		weeklyActivity:
			(analytics?.quizzesCompletedThisWeek || 0) +
			(analytics?.flashcardsReviewedThisWeek || 0),
		averageScore: analytics?.averageQuizScore || 0,
	};

	// Combine recent activities with notes data
	const combinedRecentActivities = [
		...recentActivity,
		// Add recent notes
		...allNotes.slice(0, 3).map((note, index) => ({
			id: `note-${index}`,
			type: "note" as const,
			title: note.name,
			subtitle: `Modified ${getTimeAgo(note.modifiedAt)}`,
			timestamp: note.modifiedAt,
			icon: "NotebookText",
			color: "accent1",
		})),
	]
		.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
		.slice(0, 5);

	// Helper function to calculate time ago
	function getTimeAgo(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMins < 60) return `${diffMins} min ago`;
		if (diffHours < 24) return `${diffHours} hours ago`;
		if (diffDays === 1) return "Yesterday";
		return `${diffDays} days ago`;
	}

	const getActivityIcon = (iconName: string) => {
		switch (iconName) {
			case "Brain":
				return Brain;
			case "WalletCards":
				return WalletCards;
			case "NotebookText":
				return NotebookText;
			default:
				return NotebookText;
		}
	};

	const handleQuickAction = (action: string) => {
		switch (action) {
			case "note":
				handleCreateNote();
				setActivePage("notes");
				setNoteView("note");
				break;
			case "quiz":
				setActivePage("quiz");
				setQuizView("create");
				break;
			case "flashcard":
				setActivePage("flashcard");
				setCardView("create");
				break;
		}
	};

	if (loading) {
		return (
			<section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soma-accent1"></div>
				</div>
			</section>
		);
	}

	return (
		<section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
			<div className="p-6 lg:p-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-soma-text-primary mb-3">
						{getMessage("home.welcome")}
					</h1>
					<div className="flex flex-wrap items-center gap-6 text-soma-text-secondary">
						<div className="flex items-center gap-2">
							<Calendar className="text-soma-accent1" size={20} />
							<span>
								{currentDate.toLocaleDateString(currentLang, {
									weekday: "long",
									month: "long",
									day: "numeric",
								})}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="text-soma-accent3" size={20} />
							<span>
								{/* Fix: Use proper hours and minutes calculation */}
								{Math.floor(studyMinutes / 60)}h {studyMinutes % 60}m today
							</span>
						</div>
					</div>
				</div>

				{/* Main Stats */}
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
					<div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-soma-warning/20 rounded-xl">
								<Flame className="text-soma-warning" size={28} />
							</div>
							<span className="text-soma-text-secondary font-medium">
								Study Streak
							</span>
						</div>
						<p className="text-4xl font-bold text-soma-text-primary">
							{stats.streak} days
						</p>
						<p className="text-sm text-soma-lightest mt-2">
							{stats.streak > 0 ? "Keep it going!" : "Start your streak today!"}
						</p>
					</div>

					<div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-soma-accent1/20 rounded-xl">
								<BookOpen className="text-soma-accent1" size={28} />
							</div>
							<span className="text-soma-text-secondary font-medium">
								Total Notes
							</span>
						</div>
						<p className="text-4xl font-bold text-soma-text-primary">
							{stats.totalNotes}
						</p>
						<p className="text-sm text-soma-lightest mt-2">
							{stats.totalNotes > 0 ? "Great collection!" : "Start writing!"}
						</p>
					</div>

					<div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-soma-accent2/20 rounded-xl">
								<Brain className="text-soma-accent2" size={28} />
							</div>
							<span className="text-soma-text-secondary font-medium">
								Quiz Average
							</span>
						</div>
						<p className="text-4xl font-bold text-soma-text-primary">
							{stats.averageScore}%
						</p>
						<div className="w-full bg-soma-medium rounded-full h-3 mt-4">
							<div
								className="bg-soma-accent2 rounded-full h-3 transition-all duration-500"
								style={{ width: `${stats.averageScore}%` }}
							/>
						</div>
					</div>

					<div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-soma-accent3/20 rounded-xl">
								<WalletCards className="text-soma-accent3" size={28} />
							</div>
							<span className="text-soma-text-secondary font-medium">
								Flashcards
							</span>
						</div>
						<p className="text-4xl font-bold text-soma-text-primary">
							{stats.totalFlashcards}
						</p>
						<p className="text-sm text-soma-lightest mt-2">
							{stats.totalFlashcards > 0
								? "Ready to review!"
								: "Create some cards!"}
						</p>
					</div>
				</div>

				{/* Content Grid */}
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					{/* Recent Activity */}
					<div className="xl:col-span-2">
						<div className="bg-soma-dark rounded-2xl p-6 h-full">
							<h2 className="text-2xl font-bold text-soma-text-primary mb-6 flex items-center gap-3">
								<Clock className="text-soma-accent1" size={26} />
								Recent Activity
							</h2>
							<div className="space-y-4">
								{combinedRecentActivities.length > 0 ? (
									combinedRecentActivities.map((activity) => {
										const IconComponent = getActivityIcon(activity.icon);
										return (
											<div
												key={activity.id}
												className="bg-soma-medium p-5 rounded-xl hover:bg-soma-light transition-all cursor-pointer group"
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4">
														<div
															className={`p-3 rounded-xl ${
																activity.color === "accent1"
																	? "bg-soma-accent1/20"
																	: activity.color === "accent2"
																		? "bg-soma-accent2/20"
																		: "bg-soma-accent3/20"
															}`}
														>
															<IconComponent
																className={`${
																	activity.color === "accent1"
																		? "text-soma-accent1"
																		: activity.color === "accent2"
																			? "text-soma-accent2"
																			: "text-soma-accent3"
																}`}
																size={24}
															/>
														</div>
														<div>
															<h3 className="font-semibold text-soma-text-primary text-lg">
																{activity.title}
															</h3>
															<p className="text-soma-text-secondary">
																{activity.subtitle}
															</p>
															<p className="text-sm text-soma-lightest mt-1">
																{getTimeAgo(activity.timestamp)}
															</p>
														</div>
													</div>
													<ChevronRight
														className="text-soma-lightest group-hover:text-soma-text-primary transition-colors"
														size={24}
													/>
												</div>
											</div>
										);
									})
								) : (
									<div className="text-center py-8">
										<p className="text-soma-text-secondary">
											No recent activity. Start studying to see your progress
											here!
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div>
						<div className="bg-soma-dark rounded-2xl p-6 h-full">
							<h2 className="text-2xl font-bold text-soma-text-primary mb-6">
								Quick Actions
							</h2>
							<div className="space-y-4">
								<button
									onClick={() => handleQuickAction("note")}
									className="w-full p-5 bg-soma-accent1/20 rounded-xl hover:bg-soma-accent1/30 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent1"
								>
									<Plus size={24} />
									Create Note
								</button>
								<button
									onClick={() => handleQuickAction("quiz")}
									className="w-full p-5 bg-soma-accent2/20 rounded-xl hover:bg-soma-accent2/30 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent2"
								>
									<Brain size={24} />
									Create Quiz
								</button>
								<button
									onClick={() => handleQuickAction("flashcard")}
									className="w-full p-5 bg-soma-accent3/20 rounded-xl hover:bg-soma-accent3/30 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent3"
								>
									<WalletCards size={24} />
									Create Flashcards
								</button>
							</div>

							{/* Weekly Summary */}
							<div className="mt-6 pt-6 border-t border-soma-light/20">
								<h3 className="text-lg font-semibold text-soma-text-primary mb-4">
									This Week
								</h3>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-soma-text-secondary">
											Quizzes Completed
										</span>
										<span className="text-soma-accent2 font-semibold">
											{analytics?.quizzesCompletedThisWeek || 0}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-soma-text-secondary">
											Cards Reviewed
										</span>
										<span className="text-soma-accent3 font-semibold">
											{analytics?.flashcardsReviewedThisWeek || 0}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-soma-text-secondary">
											Notes Created
										</span>
										<span className="text-soma-accent1 font-semibold">
											{analytics?.notesCreatedThisWeek || 0}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Home;
