import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { RouterModule } from '@angular/router';
import { CognitiveTestService } from '../../../../core/services/cognitive-tests/test.service';
import { CognitiveTest } from '../../../../core/models/cognitive-tests/cognitive-test.model';

@Component({
    selector: 'app-test-list',
    imports: [RouterModule],
    templateUrl: './test-list.component.html',
    styleUrls: ['./test-list.component.css']
})
export class TestListComponent implements OnInit {
    tests: CognitiveTest[] = [];

    constructor(
        private testService: CognitiveTestService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadTests();
    }

    loadTests(): void {
        console.log('Loading tests...');
        this.testService.getAllTests().subscribe({
            next: (data: CognitiveTest[]) => {
                console.log('Tests loaded:', data);
                this.tests = data;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error loading tests', err)
        });
    }

    deleteTest(id: number | undefined): void {
        if (id && confirm('Are you sure you want to delete this test?')) {
            this.testService.deleteTest(id).subscribe({
                next: () => this.loadTests(),
                error: (err: any) => console.error('Error deleting test', err)
            });
        }
    }
}
