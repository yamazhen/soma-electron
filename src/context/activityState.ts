// src/context/activityState.ts
import { useCallback, useState } from "react";

export const useActivityState = () => {
	const [lastActivityUpdate, setLastActivityUpdate] = useState(Date.now());

	const recordActivity = useCallback(
		async (type: "quiz" | "note" | "flashcard", details: any) => {
			try {
				// Use the new dashboard API instead of localStorage
				await window.dashboardApi.logActivity(
					type,
					details.title || `${type} activity`,
					details.entityId || `${type}-${Date.now()}`,
					details,
				);

				// Trigger dashboard refresh
				setLastActivityUpdate(Date.now());
			} catch (error) {
				console.error("Error recording activity:", error);
			}
		},
		[],
	);

	return {
		lastActivityUpdate,
		recordActivity,
	};
};
