import React, { useState, useEffect } from "react";
import {
  Brain,
  Calendar,
  Flame,
  NotebookText,
  WalletCards,
  TrendingUp,
  Target,
  Trophy,
  Clock,
  ChevronRight,
  BarChart3,
  Plus,
} from "lucide-react";
import { useCurrentDate } from "../../utils/DateUpdater";
import { useAppContext } from "../../context/AppContext";

type Props = {};

const Home: React.FC<Props> = () => {
  const currentDate = useCurrentDate();
  const { getMessage, currentLang } = useAppContext();
  const [studyMinutes, setStudyMinutes] = useState(45);

  useEffect(() => {
    const interval = setInterval(() => {
      setStudyMinutes((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    streak: 7,
    todayProgress: 65,
    weeklyGoal: 75,
    totalNotes: 48,
  };

  const recentActivities = [
    {
      id: 1,
      type: "note",
      subject: "Advanced Web Programming",
      title: "React Hooks Overview",
      timeAgo: "30 min",
      icon: NotebookText,
      color: "accent1",
    },
    {
      id: 2,
      type: "quiz",
      subject: "Mobile Programming",
      title: "Chapter 5 Quiz - Score: 85%",
      timeAgo: "2 hours",
      icon: Brain,
      color: "accent2",
    },
    {
      id: 3,
      type: "flashcard",
      subject: "Data Structures",
      title: "Binary Trees Review",
      timeAgo: "Yesterday",
      icon: WalletCards,
      color: "accent3",
    },
  ];

  const subjects = [
    {
      name: "Advanced Web Programming",
      progress: 85,
      notesCount: 24,
      quizAvg: 88,
    },
    { name: "Mobile Programming", progress: 70, notesCount: 15, quizAvg: 82 },
    { name: "Data Structures", progress: 60, notesCount: 18, quizAvg: 75 },
    { name: "Database Systems", progress: 45, notesCount: 12, quizAvg: 79 },
  ];

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
            <p className="text-sm text-soma-lightest mt-2">Keep it going!</p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent1/20 rounded-xl">
                <Target className="text-soma-accent1" size={28} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Today's Progress
              </span>
            </div>
            <p className="text-4xl font-bold text-soma-text-primary">
              {stats.todayProgress}%
            </p>
            <div className="w-full bg-soma-medium rounded-full h-3 mt-4">
              <div
                className="bg-soma-accent1 rounded-full h-3 transition-all duration-500"
                style={{ width: `${stats.todayProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent3/20 rounded-xl">
                <TrendingUp className="text-soma-accent3" size={28} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Weekly Goal
              </span>
            </div>
            <p className="text-4xl font-bold text-soma-text-primary">
              {stats.weeklyGoal}%
            </p>
            <p className="text-sm text-soma-lightest mt-2">Almost there!</p>
          </div>

          <div className="bg-soma-dark p-6 rounded-2xl hover:bg-soma-medium transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-soma-accent2/20 rounded-xl">
                <Trophy className="text-soma-accent2" size={28} />
              </div>
              <span className="text-soma-text-secondary font-medium">
                Total Notes
              </span>
            </div>
            <p className="text-4xl font-bold text-soma-text-primary">
              {stats.totalNotes}
            </p>
            <p className="text-sm text-soma-lightest mt-2">Great progress!</p>
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
                {recentActivities.map((activity) => (
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
                          <activity.icon
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
                            {activity.subject}
                          </h3>
                          <p className="text-soma-text-secondary">
                            {activity.title}
                          </p>
                          <p className="text-sm text-soma-lightest mt-1">
                            {activity.timeAgo}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className="text-soma-lightest group-hover:text-soma-text-primary transition-colors"
                        size={24}
                      />
                    </div>
                  </div>
                ))}
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
                <button className="w-full p-5 bg-soma-accent1/20 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent1">
                  <Plus size={24} />
                  Create Note
                </button>
                <button className="w-full p-5 bg-soma-accent2/20 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent2">
                  <Brain size={24} />
                  Start Quiz
                </button>
                <button className="w-full p-5 bg-soma-accent3/20  rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-3 text-lg font-medium cursor-pointer text-soma-accent3">
                  <WalletCards size={24} />
                  Review Cards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Progress */}
        <div className="mt-6">
          <div className="bg-soma-dark rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-soma-text-primary mb-6 flex items-center gap-3">
              <BarChart3 className="text-soma-accent2" size={26} />
              Subject Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {subjects.map((subject, index) => (
                <div
                  key={index}
                  className="bg-soma-medium p-5 rounded-xl hover:bg-soma-light transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-soma-text-primary text-lg">
                      {subject.name}
                    </h3>
                    <span className="text-soma-accent1 font-bold">
                      {subject.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-soma-dark rounded-full h-3 mb-4">
                    <div
                      className="bg-soma-accent1 rounded-full h-3 transition-all duration-500"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-soma-text-secondary">
                    <span>{subject.notesCount} notes</span>
                    <span>Avg: {subject.quizAvg}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
