import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CognitiveTestService } from '../../../../core/services/cognitive-tests/test.service';
import { CognitiveTest } from '../../../../core/models/cognitive-tests/cognitive-test.model';
import { QuestionType } from '../../../../core/models/cognitive-tests/question-type.enum';

@Component({
    selector: 'app-test-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './test-form.component.html',
    styleUrls: ['./test-form.component.css']
})
export class TestFormComponent implements OnInit {
    testForm: FormGroup;
    isEditMode = false;
    testId?: number;
    questionTypes = Object.values(QuestionType);

    constructor(
        private fb: FormBuilder,
        private testService: CognitiveTestService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.testForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
            questions: this.fb.array([])
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.testId = +id;
            this.loadTest(this.testId);
        }
    }

    get questions(): FormArray {
        return this.testForm.get('questions') as FormArray;
    }

    addQuestion(): void {
        const questionGroup = this.fb.group({
            questionText: ['', [Validators.required, Validators.minLength(5)]],
            questionType: [QuestionType.SIMPLE, Validators.required],
            correctAnswer: [''],
            options: this.fb.array([])
        });
        this.questions.push(questionGroup);
    }

    removeQuestion(index: number): void {
        this.questions.removeAt(index);
    }

    getOptions(questionIndex: number): FormArray {
        return this.questions.at(questionIndex).get('options') as FormArray;
    }

    addOption(questionIndex: number): void {
        const optionGroup = this.fb.group({
            optionText: ['', Validators.required],
            isCorrect: [false]
        });
        this.getOptions(questionIndex).push(optionGroup);
    }

    removeOption(questionIndex: number, optionIndex: number): void {
        this.getOptions(questionIndex).removeAt(optionIndex);
    }

    loadTest(id: number): void {
        this.testService.getTestById(id).subscribe((test: CognitiveTest) => {
            this.testForm.patchValue({
                title: test.title,
                description: test.description
            });

            // Clear and populate questions
            this.questions.clear();
            test.questions.forEach((q: any) => {
                const questionGroup = this.fb.group({
                    id: [q.id],
                    questionText: [q.questionText, [Validators.required, Validators.minLength(5)]],
                    questionType: [q.questionType, Validators.required],
                    correctAnswer: [q.correctAnswer || ''],
                    options: this.fb.array(q.options.map((opt: any) => this.fb.group({
                        id: [opt.id],
                        optionText: [opt.optionText, Validators.required],
                        isCorrect: [opt.isCorrect]
                    })))
                });
                this.questions.push(questionGroup);
            });
        });
    }

    onSubmit(): void {
        if (this.testForm.valid) {
            // Validate that each MULTIPLE_CHOICE question has at least one correct option
            const questions = this.testForm.value.questions || [];
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (q.questionType === QuestionType.MULTIPLE_CHOICE) {
                    const hasCorrect = (q.options || []).some((opt: any) => opt.isCorrect);
                    if (!hasCorrect) {
                        alert(`Question #${i + 1} is multiple choice but has no correct option marked. Please mark at least one option as correct.`);
                        return;
                    }
                }
            }

            const testData: CognitiveTest = this.testForm.value;
            if (this.isEditMode && this.testId) {
                this.testService.updateTest(this.testId, testData).subscribe(() => {
                    this.router.navigate(['/admin/tests']);
                });
            } else {
                this.testService.createTest(testData).subscribe(() => {
                    this.router.navigate(['/admin/tests']);
                });
            }
        }
    }
}
