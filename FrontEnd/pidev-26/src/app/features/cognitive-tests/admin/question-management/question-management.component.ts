import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CognitiveTestService } from '../../../../core/services/cognitive-tests/test.service';
import { CognitiveTest } from '../../../../core/models/cognitive-tests/cognitive-test.model';
import { TestQuestion } from '../../../../core/models/cognitive-tests/test-question.model';
import { QuestionType } from '../../../../core/models/cognitive-tests/question-type.enum';

@Component({
    selector: 'app-question-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="container mt-4">
        <h2>Manage Questions for: {{test?.title}}</h2>
        <div class="card p-3 mb-4">
            <h4>Add New Question</h4>
            <div class="mb-3">
                <label>Question Text</label>
                <input type="text" class="form-control" [(ngModel)]="newQuestion.questionText">
            </div>
            <div class="mb-3">
                <label>Type</label>
                <select class="form-control" [(ngModel)]="newQuestion.questionType">
                    <option value="SIMPLE">Simple</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                </select>
            </div>
            <button class="btn btn-primary" (click)="addQuestion()">Add Question</button>
        </div>

        <h4>Existing Questions</h4>
        <ul class="list-group">
            <li *ngFor="let q of test?.questions" class="list-group-item d-flex justify-content-between">
                {{q.questionText}}
                <span class="badge bg-secondary">{{q.questionType}}</span>
            </li>
        </ul>
        <div class="mt-3">
            <a routerLink="/admin/tests" class="btn btn-secondary">Back to List</a>
        </div>
    </div>
    `,
    styles: [`.container { max-width: 800px; }`]
})
export class QuestionManagementComponent implements OnInit {
    testId: number = 0;
    test?: CognitiveTest;
    newQuestion: Partial<TestQuestion> = {
        questionText: '',
        questionType: QuestionType.SIMPLE
    };

    constructor(
        private route: ActivatedRoute,
        private testService: CognitiveTestService
    ) { }

    ngOnInit(): void {
        this.testId = Number(this.route.snapshot.paramMap.get('id'));
        this.loadTest();
    }

    loadTest(): void {
        this.testService.getTestById(this.testId).subscribe((data: CognitiveTest) => this.test = data);
    }

    addQuestion(): void {
        if (this.newQuestion.questionText) {
            this.testService.addQuestionToTest(this.testId, this.newQuestion as TestQuestion).subscribe(() => {
                this.loadTest();
                this.newQuestion = { questionText: '', questionType: QuestionType.SIMPLE };
            });
        }
    }
}
