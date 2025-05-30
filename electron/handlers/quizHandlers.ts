import { ipcMain } from "electron";
import { QuizService } from "../service";

export function setupQuizHandlers() {
	const quizService = new QuizService();

	ipcMain.handle("quiz:getAll", () => {
		try {
			const quizzes = quizService.getAllQuizzes();
			return { success: true, quizzes };
		} catch (error: any) {
			console.error("Error getting quizzes:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("quiz:get", (_, id: number) => {
		try {
			const quiz = quizService.getQuizDetails(id);
			if (!quiz) {
				return { success: false, error: "Quiz not found" };
			}
			return { success: true, quiz };
		} catch (error: any) {
			console.error(`Error getting quiz ${id}:`, error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle(
		"quiz:create",
		(_, data: { title: string; questions: any[] }) => {
			try {
				const quizId = quizService.createQuiz(data.title, data.questions);
				return { success: true, quizId };
			} catch (error: any) {
				console.error("Error creating quiz:", error);
				return { success: false, error: error.message };
			}
		},
	);

	ipcMain.handle("quiz:update", (_, data: { id: number; title: string }) => {
		try {
			const result = quizService.updateQuiz(data.id, data.title);
			return { success: result };
		} catch (error: any) {
			console.error("Error updating quiz:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("quiz:delete", (_, id: number) => {
		console.log("Deleting quiz with ID:", id);
		try {
			const result = quizService.deleteQuiz(id);
			return { success: result };
		} catch (error: any) {
			console.error(`Error deleting quiz ${id}:`, error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle(
		"question:add",
		(_, data: { quizId: number; question: any }) => {
			try {
				const questionId = quizService.addQuestion(data.quizId, data.question);
				return { success: true, questionId };
			} catch (error: any) {
				console.error("Error adding question:", error);
				return { success: false, error: error.message };
			}
		},
	);

	ipcMain.handle(
		"question:update",
		(_, data: { id: number; question: any }) => {
			try {
				const result = quizService.updateQuestion(data.id, data.question);
				return { success: result };
			} catch (error: any) {
				console.error("Error updating question:", error);
				return { success: false, error: error.message };
			}
		},
	);

	ipcMain.handle("question:delete", (_, id: number) => {
		try {
			const result = quizService.deleteQuestion(id);
			return { success: result };
		} catch (error: any) {
			console.error(`Error deleting question ${id}:`, error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("question:getScheduled", () => {
		try {
			const questions = quizService.getScheduledQuestions();
			return { success: true, questions };
		} catch (error: any) {
			console.error("Error getting scheduled questions:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle(
		"question:schedule",
		(_, data: { id: number; scheduled: boolean }) => {
			try {
				const result = quizService.scheduleQuestion(data.id, data.scheduled);
				return { success: result };
			} catch (error: any) {
				console.error("Error scheduling question:", error);
				return { success: false, error: error.message };
			}
		},
	);

	ipcMain.handle(
		"quiz:submitAttempt",
		(
			_,
			data: {
				quizId: number;
				answers: { questionId: number; answer: string }[];
			},
		) => {
			try {
				const review = quizService.submitQuizAttempt(data.quizId, data.answers);
				return { success: true, review };
			} catch (error: any) {
				console.error("Error submitting attempt:", error);
				return { success: false, error: error.message };
			}
		},
	);

	ipcMain.handle("quiz:scheduleTopFailedQuestions", (_) => {
		try {
			const result = quizService.scheduleTopFailedQuestions();
			return { success: result };
		} catch (error: any) {
			console.error("Error scheduling top failed questions:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("quiz:getAttemptHistory", (_, quizId: number) => {
		try {
			const history = quizService.getQuizAttemptHistory(quizId);
			return { success: true, history };
		} catch (error: any) {
			console.error(`Error getting attempt history for quiz ${quizId}:`, error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("quiz:getAttemptDetails", (_, attemptId: number) => {
		try {
			const details = quizService.getAttemptDetails(attemptId);
			return { success: true, details };
		} catch (error: any) {
			console.error(`Error getting attempt details ${attemptId}:`, error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("quiz:getAnalytics", () => {
		try {
			const analytics = quizService.getAnalytics();
			return { success: true, analytics };
		} catch (error: any) {
			console.error("Error getting analytics:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("quiz:getDailyActivity", () => {
		try {
			const activity = quizService.getDailyActivity();
			return { success: true, activity };
		} catch (error: any) {
			console.error("Error getting daily activity:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("quiz:getSubjectPerformance", () => {
		try {
			const performance = quizService.getSubjectPerformance();
			return { success: true, performance };
		} catch (error: any) {
			console.error("Error getting subject performance:", error);
			return { success: false, error: error.message };
		}
	});
}
