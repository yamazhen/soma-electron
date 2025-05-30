import { useRef, useState, useEffect } from "react";

interface StudySession {
	type: "quiz" | "flashcard" | "note";
	title: string;
	startTime: number;
}

interface RecentActivity {
	id: string;
	type: "note" | "quiz" | "flashcard";
	title: string;
	subtitle: string;
	timestamp: Date;
	icon: string;
	color: string;
}

export const useStudyTracking = () => {
	const [studyMinutes, setStudyMinutes] = useState(0);
	const [isStudying, setIsStudying] = useState(false);
	const [currentSession, setCurrentSession] = useState<StudySession | null>(
		null,
	);
	const studyStartTime = useRef<number | null>(null);
	const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const savedTime = localStorage.getItem("todayStudyTime");
		const lastSaveDate = localStorage.getItem("lastSaveDate");
		const today = new Date().toDateString();

		if (lastSaveDate === today && savedTime) {
			setStudyMinutes(Number.parseInt(savedTime, 10));
		} else {
			setStudyMinutes(0);
			localStorage.setItem("lastSaveDate", today);
			localStorage.setItem("todayStudyTime", "0");
		}
	}, []);

	const resetInactivityTimer = () => {
		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
		}

		if (isStudying) {
			inactivityTimer.current = setTimeout(
				() => {
					endStudySession();
				},
				5 * 60 * 1000,
			);
		}
	};

	const startStudySession = (
		type: "quiz" | "flashcard" | "note",
		title: string,
	) => {
		if (!isStudying) {
			setIsStudying(true);
			studyStartTime.current = Date.now();
			setCurrentSession({
				type,
				title,
				startTime: Date.now(),
			});
		}
	};

	const endStudySession = () => {
		if (isStudying && studyStartTime.current) {
			const sessionTime = Math.floor(
				(Date.now() - studyStartTime.current) / 60000,
			);
			setStudyMinutes((prev) => {
				const newTime = prev + sessionTime;
				localStorage.setItem("todayStudyTime", newTime.toString());
				return newTime;
			});

			setIsStudying(false);
			studyStartTime.current = null;
			setCurrentSession(null);

			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}
		}
	};

	const trackStudyActivity = (
		type: "quiz" | "flashcard" | "note",
		title: string,
	) => {
		startStudySession(type, title);

		const newActivity: RecentActivity = {
			id: `${type}-${Date.now()}`,
			type,
			title,
			subtitle: "Started",
			timestamp: new Date(),
			icon:
				type === "quiz"
					? "Brain"
					: type === "flashcard"
						? "WalletCards"
						: "NotebookText",
			color: "accent1",
		};

		const existingActivities = JSON.parse(
			localStorage.getItem("recentActivities") || "[]",
		);
		existingActivities.unshift(newActivity);
		localStorage.setItem(
			"recentActivities",
			JSON.stringify(existingActivities.slice(0, 10)),
		);

		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "recentActivities",
				newValue: JSON.stringify(existingActivities.slice(0, 10)),
			}),
		);
	};

	const getTodayStudyTime = () => {
		return studyMinutes;
	};

	useEffect(() => {
		const handleActivity = () => {
			resetInactivityTimer();
		};

		if (isStudying) {
			window.addEventListener("mousemove", handleActivity);
			window.addEventListener("keypress", handleActivity);
			window.addEventListener("click", handleActivity);
			resetInactivityTimer();
		}

		return () => {
			window.removeEventListener("mousemove", handleActivity);
			window.removeEventListener("keypress", handleActivity);
			window.removeEventListener("click", handleActivity);
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
			}
		};
	}, [isStudying, resetInactivityTimer]);

	return {
		studyMinutes,
		isStudying,
		currentSession,
		startStudySession,
		endStudySession,
		trackStudyActivity,
		getTodayStudyTime,
	};
};
