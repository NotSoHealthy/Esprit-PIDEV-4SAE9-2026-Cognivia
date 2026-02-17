import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { CognitiveTestService } from '../../../services/test.service';
import { CognitiveTest } from '../../../models/cognitive-test.model';

@Component({
    selector: 'app-test-list',
    imports: [RouterModule],
    templateUrl: './test-list.component.html',
    styleUrls: ['./test-list.component.css']
})
export class TestListComponent implements OnInit {
    tests: CognitiveTest[] = [];

    constructor(private testService: CognitiveTestService) { }

    ngOnInit(): void {
        this.loadTests();
    }

    loadTests(): void {
        this.testService.getAllTests().subscribe({
            next: (data) => this.tests = data,
            error: (err) => console.error('Error loading tests', err)
        });
    }

    deleteTest(id: number | undefined): void {
        if (id && confirm('Are you sure you want to delete this test?')) {
            this.testService.deleteTest(id).subscribe({
                next: () => this.loadTests(),
                error: (err) => console.error('Error deleting test', err)
            });
        }
    }
}
