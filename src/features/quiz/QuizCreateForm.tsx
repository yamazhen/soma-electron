import { CirclePlus, X, CheckCircle, ToggleLeft, PenTool } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { RadioGroup, Radio } from "@headlessui/react";

interface BaseQuestion {
	id: number;
	text: string;
	type: QuestionType;
}

interface MultipleChoiceQuestion extends BaseQuestion {
	type: "multiple-choice";
	options: { id: number; text: string; isCorrect: boolean }[];
}

interface TextAnswerQuestion extends BaseQuestion {
	type: "text-answer";
	answers: string[];
}

interface TrueFalseQuestion extends BaseQuestion {
	type: "true-false";
	correctAnswer: boolean;
}

type Question = MultipleChoiceQuestion | TextAnswerQuestion | TrueFalseQuestion;

const QuizCreateForm: React.FC = () => {
	const [quizTitle, setQuizTitle] = useState("");
	const [questions, setQuestions] = useState<Question[]>([]);
	const { setQuizView, fetchQuizzes } = useAppContext();

	const addQuestion = (type: QuestionType) => {
		const newQuestionId = questions.length + 1;

		let newQuestion: Question;

		switch (type) {
			case "multiple-choice":
				newQuestion = {
					id: newQuestionId,
					text: "",
					type: "multiple-choice",
					options: [
						{ id: 1, text: "", isCorrect: false },
						{ id: 2, text: "", isCorrect: false },
						{ id: 3, text: "", isCorrect: false },
						{ id: 4, text: "", isCorrect: false },
					],
				};
				break;
			case "text-answer":
				newQuestion = {
					id: newQuestionId,
					text: "",
					type: "text-answer",
					answers: [""],
				};
				break;
			case "true-false":
				newQuestion = {
					id: newQuestionId,
					text: "",
					type: "true-false",
					correctAnswer: true,
				};
				break;
		}

		setQuestions([...questions, newQuestion]);
	};

	const updateQuestionText = (id: number, text: string) => {
		setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
	};

	const removeQuestion = (id: number) => {
		setQuestions(questions.filter((q) => q.id !== id));
		setQuestions((prev) =>
			prev.map((q, index) => ({
				...q,
				id: index + 1,
			})),
		);
	};

	const updateOptionText = (
		questionId: number,
		optionId: number,
		text: string,
	) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "multiple-choice") {
					return {
						...q,
						options: q.options.map((o) =>
							o.id === optionId ? { ...o, text } : o,
						),
					};
				}
				return q;
			}),
		);
	};

	const setCorrectOption = (questionId: number, optionId: number) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "multiple-choice") {
					return {
						...q,
						options: q.options.map((o) => ({
							...o,
							isCorrect: o.id === optionId,
						})),
					};
				}
				return q;
			}),
		);
	};

	const addOption = (questionId: number) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "multiple-choice") {
					return {
						...q,
						options: [
							...q.options,
							{ id: q.options.length + 1, text: "", isCorrect: false },
						],
					};
				}
				return q;
			}),
		);
	};

	const removeOption = (questionId: number, optionId: number) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "multiple-choice") {
					return {
						...q,
						options: q.options
							.filter((o) => o.id !== optionId)
							.map((o, idx) => ({
								...o,
								id: idx + 1,
							})),
					};
				}
				return q;
			}),
		);
	};

	const updateTextAnswer = (
		questionId: number,
		index: number,
		text: string,
	) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "text-answer") {
					const newAnswers = [...q.answers];
					newAnswers[index] = text;
					return {
						...q,
						answers: newAnswers,
					};
				}
				return q;
			}),
		);
	};

	const addTextAnswer = (questionId: number) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "text-answer") {
					return {
						...q,
						answers: [...q.answers, ""],
					};
				}
				return q;
			}),
		);
	};

	const removeTextAnswer = (questionId: number, index: number) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "text-answer") {
					return {
						...q,
						answers: q.answers.filter((_, i) => i !== index),
					};
				}
				return q;
			}),
		);
	};

	const setTrueFalseAnswer = (questionId: number, value: boolean) => {
		setQuestions(
			questions.map((q) => {
				if (q.id === questionId && q.type === "true-false") {
					return {
						...q,
						correctAnswer: value,
					};
				}
				return q;
			}),
		);
	};

	const prepareQuestionsForBackend = () => {
		return questions.map((q) => {
			if (q.type === "multiple-choice") {
				return {
					text: q.text,
					type: q.type,
					options: q.options.map((opt) => ({
						text: opt.text,
						is_correct: opt.isCorrect,
					})),
				};
			}
			if (q.type === "text-answer") {
				return {
					text: q.text,
					type: q.type,
					answers: q.answers,
				};
			}
			if (q.type === "true-false") {
				return {
					text: q.text,
					type: q.type,
					boolean_answer: q.correctAnswer,
				};
			}
			return q;
		});
	};

	const submitQuiz = () => {
		let hasError: boolean = false;

		if (quizTitle.trim() === "") {
			console.error("Quiz title is required");
			hasError = true;
		}

		if (questions.length <= 0) {
			console.error("At least one question is required");
			hasError = true;
		}

		questions.forEach((question) => {
			if (question.text.trim() === "") {
				console.error(`Question ${question.id} text is required`);
				hasError = true;
			}

			if (question.type === "multiple-choice") {
				const hasCorrectAnswer = question.options.some(
					(option) => option.isCorrect,
				);
				if (!hasCorrectAnswer) {
					console.error(
						`Question ${question.id} must have at least one correct answer`,
					);
					hasError = true;
				}

				const emptyOptions = question.options.some(
					(opt) => opt.text.trim() === "",
				);
				if (emptyOptions) {
					console.error(`Question ${question.id} has empty options`);
					hasError = true;
				}
			}

			if (question.type === "text-answer") {
				if (question.answers.some((answer) => answer.trim() === "")) {
					console.error(`Question ${question.id} must have valid answers`);
					hasError = true;
				}
			}
		});

		if (hasError) {
			return;
		}

		const backendFormattedQuestions = prepareQuestionsForBackend();

		window.quizIpc
			.create({
				title: quizTitle,
				questions: backendFormattedQuestions,
			})
			.then((response) => {
				if (response.success) {
					setQuizView("listing");
					fetchQuizzes();
				} else {
					console.error("Error saving quiz:", response.error);
				}
			});
	};

	const getQuestionIcon = (type: QuestionType) => {
		switch (type) {
			case "multiple-choice":
				return <CheckCircle className="text-soma-accent1" size={20} />;
			case "text-answer":
				return <PenTool className="text-soma-accent2" size={20} />;
			case "true-false":
				return <ToggleLeft className="text-soma-accent3" size={20} />;
		}
	};

	const renderQuestionEditor = (question: Question) => {
		switch (question.type) {
			case "multiple-choice":
				return (
					<>
						<div className="flex flex-col gap-4">
							<p className="text-soma-text-secondary font-medium">
								Answer choices:
							</p>
							<RadioGroup
								by="id"
								value={question.options.find((o) => o.isCorrect)}
								onChange={(option) => setCorrectOption(question.id, option.id)}
								className="space-y-3"
							>
								{question.options.map((option) => (
									<div
										key={option.id}
										className="flex items-center w-full gap-3 group"
									>
										<Radio
											value={option}
											className="group flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-soma-light data-[checked]:bg-soma-accent1 data-[checked]:ring-soma-accent1 transition-all"
										>
											<span className="h-2.5 w-2.5 rounded-full bg-soma-darkest opacity-0 group-data-[checked]:opacity-100" />
										</Radio>
										<input
											type="text"
											value={option.text}
											onChange={(e) =>
												updateOptionText(question.id, option.id, e.target.value)
											}
											onKeyDown={(e) => {
												if (e.key === " ") {
													e.stopPropagation();
												}
											}}
											placeholder={`Option ${option.id}`}
											className="bg-soma-medium border border-soma-light rounded-xl p-3 w-full text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent1 focus:outline-none transition-colors"
										/>
										{question.options.length > 2 && (
											<button
												type="button"
												onClick={() => removeOption(question.id, option.id)}
												className="bg-soma-error/20 hover:bg-soma-error/30 p-2 rounded-lg transition-colors"
											>
												<X size={16} className="text-soma-error" />
											</button>
										)}
									</div>
								))}
							</RadioGroup>
							<div className="flex items-center justify-center mt-2">
								<button
									type="button"
									onClick={() => addOption(question.id)}
									className="bg-soma-accent1/20 p-3 rounded-xl hover:bg-soma-accent1/30 transition-colors duration-200 flex items-center gap-2 text-soma-accent1 font-medium"
								>
									<CirclePlus size={20} />
									Add Option
								</button>
							</div>
						</div>
					</>
				);

			case "text-answer":
				return (
					<div className="flex flex-col gap-4">
						<p className="text-soma-text-secondary font-medium">
							Acceptable answers:
						</p>
						{question.answers.map((answer, index) => (
							<div key={index} className="flex items-center w-full gap-3">
								<input
									type="text"
									value={answer}
									onChange={(e) =>
										updateTextAnswer(question.id, index, e.target.value)
									}
									placeholder={`Acceptable answer ${index + 1}`}
									className="bg-soma-medium border border-soma-light rounded-xl p-3 w-full text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent2 focus:outline-none transition-colors"
								/>
								{question.answers.length > 1 && (
									<button
										type="button"
										onClick={() => removeTextAnswer(question.id, index)}
										className="bg-soma-error/20 hover:bg-soma-error/30 p-2 rounded-lg transition-colors"
									>
										<X size={16} className="text-soma-error" />
									</button>
								)}
							</div>
						))}
						<div className="flex items-center justify-center">
							<button
								type="button"
								onClick={() => addTextAnswer(question.id)}
								className="bg-soma-accent2/20 p-3 rounded-xl hover:bg-soma-accent2/30 transition-colors duration-200 flex items-center gap-2 text-soma-accent2 font-medium"
							>
								<CirclePlus size={20} />
								Add Answer
							</button>
						</div>
					</div>
				);

			case "true-false":
				return (
					<div className="flex flex-col gap-4">
						<p className="text-soma-text-secondary font-medium">
							Correct answer:
						</p>
						<RadioGroup
							value={question.correctAnswer}
							onChange={(value) => setTrueFalseAnswer(question.id, value)}
							className="flex gap-4"
						>
							<div className="flex-1">
								<Radio
									value={true}
									className={`group flex w-full cursor-pointer items-center gap-3 bg-soma-medium p-4 rounded-xl transition-all hover:bg-soma-light ${
										question.correctAnswer === true
											? "ring-2 ring-soma-accent3"
											: ""
									}`}
								>
									<div className="flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-soma-light group-data-[checked]:bg-soma-accent3 group-data-[checked]:ring-soma-accent3 transition-all">
										<span className="h-2.5 w-2.5 rounded-full bg-soma-darkest opacity-0 group-data-[checked]:opacity-100" />
									</div>
									<span className="text-soma-text-primary font-medium">
										True
									</span>
								</Radio>
							</div>
							<div className="flex-1">
								<Radio
									value={false}
									className={`group flex w-full cursor-pointer items-center gap-3 bg-soma-medium p-4 rounded-xl transition-all hover:bg-soma-light ${
										question.correctAnswer === false
											? "ring-2 ring-soma-accent3"
											: ""
									}`}
								>
									<div className="flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-soma-light group-data-[checked]:bg-soma-accent3 group-data-[checked]:ring-soma-accent3 transition-all">
										<span className="h-2.5 w-2.5 rounded-full bg-soma-darkest opacity-0 group-data-[checked]:opacity-100" />
									</div>
									<span className="text-soma-text-primary font-medium">
										False
									</span>
								</Radio>
							</div>
						</RadioGroup>
					</div>
				);
		}
	};

	return (
		<section className="w-full min-h-screen bg-soma-darkest overflow-auto p-10">
			<div className="max-w-6xl mx-auto p-6 lg:p-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-soma-text-primary mb-3">
						Create New Quiz
					</h1>
					<p className="text-soma-text-secondary">
						Build an interactive quiz to test knowledge
					</p>
				</div>

				{/* Quiz Title */}
				<div className="bg-soma-dark rounded-2xl p-6 mb-8">
					<label
						htmlFor="quizTitle"
						className="text-xl font-semibold text-soma-text-primary mb-4 block"
					>
						Quiz Title
					</label>
					<input
						type="text"
						className="bg-soma-medium border border-soma-light rounded-xl p-4 w-full text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent1 focus:outline-none transition-colors"
						id="quizTitle"
						value={quizTitle}
						onChange={(e) => setQuizTitle(e.target.value)}
						placeholder="Enter an engaging quiz title"
					/>
				</div>

				{/* Add Question Buttons */}
				<div className="bg-soma-dark rounded-2xl p-6 mb-8">
					<h2 className="text-xl font-semibold text-soma-text-primary mb-6">
						Add Questions
					</h2>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
						<button
							className="bg-soma-accent1/20 p-4 rounded-xl hover:bg-soma-accent1/30 transition-all flex flex-col items-center gap-3 group"
							type="button"
							onClick={() => addQuestion("multiple-choice")}
						>
							<CheckCircle
								className="text-soma-accent1 group-hover:scale-110 transition-transform"
								size={24}
							/>
							<span className="text-soma-text-primary font-medium">
								Multiple Choice
							</span>
						</button>
						<button
							className="bg-soma-accent2/20 p-4 rounded-xl hover:bg-soma-accent2/30 transition-all flex flex-col items-center gap-3 group"
							type="button"
							onClick={() => addQuestion("text-answer")}
						>
							<PenTool
								className="text-soma-accent2 group-hover:scale-110 transition-transform"
								size={24}
							/>
							<span className="text-soma-text-primary font-medium">
								Text Answer
							</span>
						</button>
						<button
							className="bg-soma-accent3/20 p-4 rounded-xl hover:bg-soma-accent3/30 transition-all flex flex-col items-center gap-3 group"
							type="button"
							onClick={() => addQuestion("true-false")}
						>
							<ToggleLeft
								className="text-soma-accent3 group-hover:scale-110 transition-transform"
								size={24}
							/>
							<span className="text-soma-text-primary font-medium">
								True/False
							</span>
						</button>
					</div>
				</div>

				{/* Questions List */}
				{questions.length > 0 && (
					<div className="space-y-6 mb-8">
						{questions.map((question) => (
							<div
								key={question.id}
								className="bg-soma-dark rounded-2xl p-6 hover:bg-soma-medium/50 transition-colors"
							>
								<div className="flex items-center justify-between mb-6">
									<div className="flex gap-3 items-center">
										<div className="p-2 bg-soma-medium rounded-xl">
											{getQuestionIcon(question.type)}
										</div>
										<h3 className="text-lg font-semibold text-soma-text-primary">
											Question {question.id}
										</h3>
										<span className="bg-soma-medium px-3 py-1 rounded-lg text-sm text-soma-text-secondary">
											{question.type
												.replace("-", " ")
												.replace(/\b\w/g, (l) => l.toUpperCase())}
										</span>
									</div>
									<button
										type="button"
										onClick={() => removeQuestion(question.id)}
										className="bg-soma-error/20 p-2 rounded-xl hover:bg-soma-error/30 transition-colors"
									>
										<X size={20} className="text-soma-error" />
									</button>
								</div>

								<input
									type="text"
									value={question.text}
									className="bg-soma-medium border border-soma-light rounded-xl p-4 w-full mb-6 text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent1 focus:outline-none transition-colors"
									onChange={(e) =>
										updateQuestionText(question.id, e.target.value)
									}
									placeholder="Enter your question"
								/>

								{renderQuestionEditor(question)}
							</div>
						))}
					</div>
				)}

				{/* Submit Button */}
				{questions.length > 0 && (
					<div className="flex justify-center mb-3">
						<button
							className="bg-soma-accent1/30 text-soma-accent1 py-4 px-12 rounded-xl hover:bg-soma-accent1/90 transition-all font-semibold text-lg hover:text-soma-darkest"
							onClick={submitQuiz}
						>
							Create Quiz
						</button>
					</div>
				)}
			</div>
		</section>
	);
};

export default QuizCreateForm;
