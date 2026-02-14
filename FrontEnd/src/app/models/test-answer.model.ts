export interface TestAnswer {
    id?: number;
    answerText?: string;
    isCorrect?: boolean;
    questionId?: number;
    question?: { id: number };
    selectedOptionId?: number;
    selectedOption?: { id: number };
}
