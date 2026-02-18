import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CognitiveTestService } from '../../../../core/services/cognitive-tests/test.service';
import { TestResultService } from '../../../../core/services/cognitive-tests/result.service';
import { CognitiveTest } from '../../../../core/models/cognitive-tests/cognitive-test.model';
import { TestResult } from '../../../../core/models/cognitive-tests/test-result.model';
import { QuestionType } from '../../../../core/models/cognitive-tests/question-type.enum';

@Component({
    selector: 'app-test-take',
    imports: [FormsModule],
    templateUrl: './test-take.component.html',
    styleUrls: ['./test-take.component.css']
})
export class TestTakeComponent implements OnInit {
    testId?: number;
    test?: CognitiveTest;
    assignmentId?: number;
    currentQuestionIndex = 0;
    answers: any[] = [];
    startTime: number = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private testService: CognitiveTestService,
        private resultService: TestResultService
    ) { }

    ngOnInit(): void {
        const testId = this.route.snapshot.paramMap.get('testId');
        const aId = this.route.snapshot.paramMap.get('assignmentId');
        if (testId) {
            this.testId = +testId;
            this.loadTest(+testId);
            if (aId) {
                this.assignmentId = +aId;
            }
        }
        this.startTime = Date.now();
    }

    loadTest(id: number): void {
        this.testService.getTestById(id).subscribe((test: CognitiveTest) => {
            this.test = test;
            this.answers = test.questions.map((q: any) => ({
                question: { id: q.id },
                answerText: '',
                selectedOptionId: null
            }));
        });
    }

    nextQuestion(): void {
        if (this.test && this.currentQuestionIndex < this.test.questions.length - 1) {
            this.currentQuestionIndex++;
        }
    }

    prevQuestion(): void {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        }
    }

    submitTest(): void {
        // Transform answers: convert flat selectedOptionId to nested selectedOption object for backend
        const mappedAnswers = this.answers.map(a => ({
            question: { id: a.question.id },
            answerText: a.answerText || null,
            selectedOption: a.selectedOptionId ? { id: a.selectedOptionId } : null
        }));

        const result: TestResult = {
            responseTime: Date.now() - this.startTime,
            answers: mappedAnswers
        };

        if (this.assignmentId) {
            this.resultService.submitResult(this.assignmentId, result).subscribe((savedResult: any) => {
                this.router.navigate(['/results', savedResult.id]);
            });
        } else if (this.testId) {
            this.resultService.submitDirectResult(this.testId, result).subscribe((savedResult: any) => {
                this.router.navigate(['/results', savedResult.id]);
            });
        }
    }
}
