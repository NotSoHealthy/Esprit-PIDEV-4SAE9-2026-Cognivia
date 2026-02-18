import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { RouterModule } from '@angular/router';
import { CognitiveTestService } from '../../../../core/services/cognitive-tests/test.service';
import { CognitiveTest } from '../../../../core/models/cognitive-tests/cognitive-test.model';

@Component({
    selector: 'app-patient-test-list',
    imports: [RouterModule],
    templateUrl: './patient-test-list.component.html',
    styleUrls: ['./patient-test-list.component.css']
})
export class PatientTestListComponent implements OnInit {
    tests: CognitiveTest[] = [];

    constructor(
        private testService: CognitiveTestService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadTests();
    }

    loadTests(): void {
        console.log('Loading patient tests...');
        this.testService.getAllTests().subscribe({
            next: (data: CognitiveTest[]) => {
                console.log('Patient tests loaded:', data);
                this.tests = data;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error loading tests', err)
        });
    }
}
