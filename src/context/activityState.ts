import { useCallback, useState } from "react";

export const useActivityState = () => {
	const [lastActivityUpdate, setLastActivityUpdate] = useState(Date.now());

	const recordActivity = useCallback(
		async (type: "quiz" | "note" | "flashcard", details: any) => {
			// Record the activity timestamp
			const activities = JSON.parse(
				localStorage.getItem("recentActivities") || "[]",
			);
			const newActivity = {
				id: `${type}-${Date.now()}`,
				type,
				timestamp: new Date().toISOString(),
				details,
			};

			activities.unshift(newActivity);
			// Keep only last 20 activities
			localStorage.setItem(
				"recentActivities",
				JSON.stringify(activities.slice(0, 20)),
			);

			// Trigger dashboard refresh
			setLastActivityUpdate(Date.now());
		},
		[],
	);

	return {
		lastActivityUpdate,
		recordActivity,
	};
};
