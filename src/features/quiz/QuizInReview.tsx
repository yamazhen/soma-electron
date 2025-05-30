import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { CircleHelp, Timer, CheckCircle, XCircle } from "lucide-react";

type Props = {
	quiz: QuizDetails;
};

const QuizInReview: React.FC<Props> = ({ quiz }) => {
	const [index, setIndex] = useState(0);
	const [time, setTime] = useState(10);
	const [userAnswer, setUserAnswer] = useState<string | null>(null);
	const [feedback, setFeedback] = useState(false);
	const [score, setScore] = useState(0);
	const [answers, setAnswers] = useState<
		{ questionId: number; answer: string }[]
	>([]);
	const [review, setReview] = useState<QuizReview | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { setQuizView, fetchQuizzes, recordActivity, trackStudyActivity } =
		useAppContext();

	useEffect(() => {
		trackStudyActivity("quiz", quiz.title);
	}, [quiz.title, trackStudyActivity]);

	const question = quiz?.questions?.[index];

	useEffect(() => {
		if (!question || error) return;

		setTime(30);
		setUserAnswer(null);
		setFeedback(false);

		let timeoutIds: ReturnType<typeof setTimeout>[] = [];

		const timer = setInterval(() => {
			setTime((prevTime) => {
				if (prevTime <= 1) {
					clearInterval(timer);

					setFeedback(true);

					setAnswers((prev) => {
						if (prev.some((a) => a.questionId === question.id)) {
							return prev;
						}

						return [...prev, { questionId: question.id, answer: "TIMEOUT" }];
					});

					const nextQuestionTimeout = setTimeout(() => {
						setIndex(index + 1);
					}, 2000);

					timeoutIds.push(nextQuestionTimeout);
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);

		return () => {
			clearInterval(timer);
			timeoutIds.forEach((id) => clearTimeout(id));
		};
	}, [index, question, error]);

	useEffect(() => {
		if (answers.length === quiz.questions.length && !submitting && !review) {
			handleSubmit();
		}
	}, [answers]);

	const checkCorrect = (q: QuestionWithDetails | null, a: string): boolean => {
		if (!q) return false;

		if (a === "TIMEOUT") return false;

		if (q.type === "true-false") {
			return (a === "true") === !!q.boolean_answer;
		}

		if (q.type === "multiple-choice" && q.options) {
			const correct = q.options.find((opt) => opt.is_correct);
			return a === correct?.text;
		}

		if (q.type === "text-answer" && q.answers) {
			const normalizedAnswer = normalizeText(a);
			return q.answers.some(
				(ans) => normalizeText(ans.text) === normalizedAnswer,
			);
		}

		return false;
	};

	const normalizeText = (text: string): string => {
		return String(text)
			.toLowerCase()
			.trim()
			.replace(/\s+/g, " ")
			.replace(/[^\w\s]/g, "");
	};

	const handleSelect = (a: string) => {
		if (time === 0 || userAnswer !== null || !question || feedback) return;

		setUserAnswer(a);
		setFeedback(true);

		setAnswers((prev) => {
			const exists = prev.some((a) => a.questionId === question.id);
			if (exists) {
				return prev;
			}

			return [...prev, { questionId: question.id, answer: a }];
		});

		if (checkCorrect(question, a)) {
			setScore((s) => s + 1);
		}

		setTimeout(() => {
			setIndex(index + 1);
		}, 2000);
	};

	const handleSubmit = async () => {
		if (!quiz.id || !answers.length || submitting) return;
		setSubmitting(true);

		try {
			const result = await window.quizIpc.submitAttempt({
				quizId: quiz.id,
				answers,
			});

			if (result.success && result.review) {
				setReview(result.review);
				recordActivity("quiz", {
					quizTitle: quiz.title,
					score: result.review.percentage,
					questionsCount: quiz.questions.length,
				});
			} else {
				setError(`Failed to submit review: ${result.error || "Unknown error"}`);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			setError(`Submission error: ${msg}`);
		} finally {
			setSubmitting(false);
		}
	};

	const renderOptions = () => {
		if (!question) return null;

		if (question.type === "multiple-choice") {
			return (
				<div className="flex flex-col space-y-3">
					{question.options?.map((opt) => (
						<button
							key={opt.id}
							className={`p-4 rounded-xl text-left transition-all ${
								feedback
									? opt.is_correct
										? "bg-soma-success/20 border-2 border-soma-success text-soma-text-primary"
										: userAnswer === opt.text
											? "bg-soma-error/20 border-2 border-soma-error text-soma-text-primary"
											: "bg-soma-dark/50 text-soma-text-secondary opacity-50"
									: "bg-soma-dark hover:bg-soma-medium text-soma-text-primary cursor-pointer"
							}`}
							onClick={() => handleSelect(opt.text)}
							disabled={feedback}
						>
							{opt.text || "No text"}
						</button>
					))}
				</div>
			);
		}

		if (question.type === "true-false") {
			return (
				<div className="flex flex-col space-y-3">
					{["true", "false"].map((val) => (
						<button
							key={val}
							className={`p-4 rounded-xl text-left transition-all ${
								feedback
									? val === String(!!question.boolean_answer)
										? "bg-soma-success/20 border-2 border-soma-success text-soma-text-primary"
										: userAnswer === val
											? "bg-soma-error/20 border-2 border-soma-error text-soma-text-primary"
											: "bg-soma-dark/50 text-soma-text-secondary opacity-50"
									: "bg-soma-dark hover:bg-soma-medium text-soma-text-primary cursor-pointer"
							}`}
							onClick={() => handleSelect(val)}
							disabled={feedback}
						>
							{val.charAt(0).toUpperCase() + val.slice(1)}
						</button>
					))}
				</div>
			);
		}

		if (question.type === "text-answer") {
			return (
				<div className="space-y-3">
					<input
						type="text"
						placeholder="Type your answer"
						disabled={feedback}
						className="w-full p-4 rounded-xl bg-soma-dark text-soma-text-primary placeholder-soma-text-secondary focus:outline-none focus:ring-2 focus:ring-soma-accent1 disabled:opacity-50"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								const value = e.currentTarget.value.trim();
								handleSelect(value);
							}
						}}
					/>
					<button
						className="w-full p-4 rounded-xl bg-soma-accent1 text-white hover:bg-opacity-90 transition-all disabled:opacity-50"
						onClick={(e) => {
							const input = e.currentTarget
								.previousElementSibling as HTMLInputElement;
							handleSelect(input?.value?.trim() || "");
						}}
						disabled={feedback}
					>
						Submit Answer
					</button>
					{feedback && (
						<div className="p-4 rounded-xl bg-soma-dark">
							<p className="text-soma-text-primary">
								<span className="font-semibold">Correct answers:</span>{" "}
								{question.answers?.map((a) => a.text).join(", ") || "None"}
							</p>
						</div>
					)}
				</div>
			);
		}

		return <p className="text-soma-error">Unsupported question type</p>;
	};

	if (error) {
		return (
			<section className="h-full w-full bg-soma-darkest flex items-center justify-center">
				<div className="bg-soma-dark rounded-xl p-8 max-w-md">
					<h2 className="text-2xl font-bold text-soma-error mb-4">Error</h2>
					<p className="text-soma-text-primary mb-6">{error}</p>
					<button
						className="w-full p-3 rounded-xl bg-soma-accent1 text-white hover:bg-opacity-90 transition-all cursor-pointer"
						onClick={() => setQuizView("listing")}
					>
						Back to Quizzes
					</button>
				</div>
			</section>
		);
	}

	if (index >= quiz.questions.length) {
		return (
			<section className="h-full w-full bg-soma-darkest flex items-center justify-center">
				<div className="bg-soma-dark rounded-xl p-8 max-w-md w-full">
					<h2 className="text-3xl font-bold text-soma-text-primary mb-6 text-center">
						Quiz Complete!
					</h2>

					<div className="bg-soma-medium rounded-xl p-6 mb-6">
						<p className="text-4xl font-bold text-soma-text-primary text-center mb-2">
							{Math.round((score / quiz.questions.length) * 100)}%
						</p>
						<p className="text-soma-text-secondary text-center">
							Score: {score}/{quiz.questions.length}
						</p>
					</div>

					{submitting ? (
						<div className="text-center py-4">
							<p className="text-soma-text-secondary">Submitting...</p>
						</div>
					) : review ? (
						<div className="bg-soma-medium rounded-xl p-4 mb-6">
							<p className="text-soma-text-primary text-center mb-3">
								Review saved!
							</p>
							<div className="flex justify-around">
								<div className="text-center">
									<p className="text-2xl font-bold text-soma-success">
										{review.correct_questions.length}
									</p>
									<p className="text-soma-text-secondary text-sm">Correct</p>
								</div>
								<div className="text-center">
									<p className="text-2xl font-bold text-soma-error">
										{review.wrong_questions.length}
									</p>
									<p className="text-soma-text-secondary text-sm">Wrong</p>
								</div>
							</div>
						</div>
					) : (
						<button
							onClick={handleSubmit}
							className="w-full p-3 rounded-xl bg-soma-success text-white hover:bg-opacity-90 transition-all mb-4"
						>
							Save Results
						</button>
					)}

					<button
						onClick={() => {
							fetchQuizzes();
							setQuizView("listing");
						}}
						className="w-full p-3 rounded-xl bg-soma-accent1 text-white hover:bg-opacity-90 transition-all cursor-pointer"
					>
						Back to Quizzes
					</button>
				</div>
			</section>
		);
	}

	return (
		<section className="h-full w-full bg-soma-darkest flex items-center justify-center">
			<div className="w-full max-w-2xl p-6">
				{/* Progress Bar */}
				<div className="bg-soma-dark rounded-xl p-5 mb-6">
					<div className="flex justify-between items-center mb-3">
						<p className="text-soma-text-secondary">
							Question {index + 1} of {quiz.questions.length}
						</p>
						<div className="flex items-center gap-2">
							<Timer className="text-soma-accent1" size={20} />
							<span
								className={`text-lg font-semibold ${time <= 10 ? "text-soma-error" : "text-soma-text-primary"}`}
							>
								{time}s
							</span>
						</div>
					</div>
					<div className="w-full bg-soma-medium rounded-full h-2">
						<div
							className="bg-soma-accent1 rounded-full h-2 transition-all duration-300"
							style={{
								width: `${((index + 1) / quiz.questions.length) * 100}%`,
							}}
						/>
					</div>
				</div>

				{/* Question Card */}
				<div className="bg-soma-dark rounded-xl p-8">
					<div className="mb-8 text-center">
						<div className="flex items-center justify-center gap-3 mb-4">
							<p className="text-2xl font-semibold text-soma-text-primary">
								{question?.text || "No question text"}
							</p>
							<CircleHelp className="text-soma-text-secondary" size={24} />
						</div>
					</div>

					{renderOptions()}

					{feedback && (
						<div
							className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
								userAnswer === null
									? "bg-soma-warning/20"
									: checkCorrect(question, userAnswer)
										? "bg-soma-success/20"
										: "bg-soma-error/20"
							}`}
						>
							{userAnswer === null ? (
								<>
									<Timer className="text-soma-warning" size={24} />
									<span className="text-soma-warning font-semibold">
										Time's up!
									</span>
								</>
							) : checkCorrect(question, userAnswer) ? (
								<>
									<CheckCircle className="text-soma-success" size={24} />
									<span className="text-soma-success font-semibold">
										Correct!
									</span>
								</>
							) : (
								<>
									<XCircle className="text-soma-error" size={24} />
									<span className="text-soma-error font-semibold">
										Incorrect
									</span>
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default QuizInReview;
