import { ipcRenderer } from "electron";

export const quizApi = {
  getAll: () => ipcRenderer.invoke("quiz:getAll"),
  get: (id: number) => ipcRenderer.invoke("quiz:get", id),
  create: (data: { title: string; questions: any[] }) =>
    ipcRenderer.invoke("quiz:create", data),
  update: (data: { id: number; title: string }) =>
    ipcRenderer.invoke("quiz:update", data),
  delete: (id: number) => ipcRenderer.invoke("quiz:delete", id),
  submitAttempt: (data: {
    quizId: number;
    answers: { questionId: number; answer: string }[];
  }) => ipcRenderer.invoke("quiz:submitAttempt", data),
  getAttemptHistory: (quizId: number) =>
    ipcRenderer.invoke("quiz:getAttemptHistory", quizId),
  getAttemptDetails: (attemptId: number) =>
    ipcRenderer.invoke("quiz:getAttemptDetails", attemptId),

  getAnalytics: () => ipcRenderer.invoke("quiz:getAnalytics"),
  getDailyActivity: () => ipcRenderer.invoke("quiz:getDailyActivity"),
  getSubjectPerformance: () => ipcRenderer.invoke("quiz:getSubjectPerformance"),
  submitAttemptWithScheduling: (data: {
    quizId: number;
    answers: { questionId: number; answer: string; responseTime?: number }[];
  }) => ipcRenderer.invoke("quiz:submitAttemptWithScheduling", data),

  getScheduledQuestions: (limit?: number) =>
    ipcRenderer.invoke("quiz:getScheduledQuestions", limit),

  getDueQuestionsCount: () => ipcRenderer.invoke("quiz:getDueQuestionsCount"),

  getQuestionsByScheduleStatus: (status: string) =>
    ipcRenderer.invoke("quiz:getQuestionsByScheduleStatus", status),
};

export const questionApi = {
  add: (data: { quizId: number; question: any }) =>
    ipcRenderer.invoke("question:add", data),
  update: (data: { id: number; question: any }) =>
    ipcRenderer.invoke("question:update", data),
  delete: (id: number) => ipcRenderer.invoke("question:delete", id),
  getScheduled: (id: number) => ipcRenderer.invoke("question:getScheduled", id),
  schedule: (id: number, scheduled: boolean) =>
    ipcRenderer.invoke("question:schedule", id, scheduled),
};
