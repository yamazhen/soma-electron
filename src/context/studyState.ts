// src/context/studyState.ts
import { useRef, useState, useEffect } from "react";

interface StudySession {
	type: "quiz" | "flashcard" | "note";
	title: string;
	startTime: number;
}

export const useStudyTracking = () => {
	const [studyMinutes, setStudyMinutes] = useState(0);
	const [isStudying, setIsStudying] = useState(false);
	const [currentSession, setCurrentSession] = useState<StudySession | null>(
		null,
	);
	const studyStartTime = useRef<number | null>(null);
	const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

	// Load today's study time on mount
	useEffect(() => {
		const today = new Date().toDateString();
		const savedDate = localStorage.getItem("studyTrackingDate");
		const savedTime = localStorage.getItem("studyTrackingMinutes");

		if (savedDate === today && savedTime) {
			setStudyMinutes(Number.parseInt(savedTime));
		} else {
			setStudyMinutes(0);
			localStorage.setItem("studyTrackingDate", today);
			localStorage.setItem("studyTrackingMinutes", "0");
		}
	}, []);

	// Save study time whenever it changes
	useEffect(() => {
		const today = new Date().toDateString();
		localStorage.setItem("studyTrackingDate", today);
		localStorage.setItem("studyTrackingMinutes", studyMinutes.toString());
	}, [studyMinutes]);

	// ADD THE MISSING FUNCTIONS:
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
			); // 5 minutes
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
			setStudyMinutes((prev) => prev + sessionTime);

			setIsStudying(false);
			studyStartTime.current = null;
			setCurrentSession(null);

			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}
		}
	};

	// Alias for compatibility
	const trackStudyActivity = startStudySession;

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
	}, [isStudying]); // Remove resetInactivityTimer from deps since it's defined in this component

	return {
		studyMinutes,
		isStudying,
		currentSession,
		startStudySession,
		trackStudyActivity,
		endStudySession,
		getTodayStudyTime,
	};
};
