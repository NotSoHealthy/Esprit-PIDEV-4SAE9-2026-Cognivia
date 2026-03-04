import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TestResultService } from '../../../../core/services/cognitive-tests/result.service';
import { TestResult } from '../../../../core/models/cognitive-tests/test-result.model';

@Component({
    selector: 'app-result-view',
    imports: [CommonModule, RouterModule],
    templateUrl: './result-view.component.html',
    styleUrls: ['./result-view.component.css']
})
export class ResultViewComponent implements OnInit {
    result?: TestResult;

    constructor(
        private route: ActivatedRoute,
        private resultService: TestResultService,
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ) { }

    ngOnInit(): void {
        this.zone.run(() => {
            const id = this.route.snapshot.paramMap.get('id');
            if (id) {
                this.loadResult(+id);
            }
        });
    }

    loadResult(id: number): void {
        this.resultService.getResultById(id).subscribe((data: TestResult) => {
            this.zone.run(() => {
                this.result = data;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            });
        });
    }

    getScoreClass(): string {
        if (!this.result?.score) return '';
        if (this.result.score >= 70) return 'score-high';
        if (this.result.score >= 40) return 'score-medium';
        return 'score-low';
    }
}
