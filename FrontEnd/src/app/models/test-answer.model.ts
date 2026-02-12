import { MultipleChoiceOption } from './multiple-choice-option.model';

export interface TestAnswer {
    id?: number;
    answerText?: string;
    isCorrect?: boolean;
    questionId: number;
    selectedOptionId?: number;
}
