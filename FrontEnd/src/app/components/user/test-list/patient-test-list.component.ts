import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { CognitiveTestService } from '../../../services/test.service';
import { CognitiveTest } from '../../../models/cognitive-test.model';

@Component({
    selector: 'app-patient-test-list',
    imports: [RouterModule],
    templateUrl: './patient-test-list.component.html',
    styleUrls: ['./patient-test-list.component.css']
})
export class PatientTestListComponent implements OnInit {
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
}
