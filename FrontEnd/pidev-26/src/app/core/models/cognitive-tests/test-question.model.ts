import { QuestionType } from './question-type.enum';
import { MultipleChoiceOption } from './multiple-choice-option.model';

export interface TestQuestion {
    id?: number;
    questionText: string;
    questionType: QuestionType;
    createdAt?: string | Date;
    correctAnswer?: string;
    options: MultipleChoiceOption[];
}
