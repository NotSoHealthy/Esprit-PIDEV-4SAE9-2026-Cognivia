import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TestAssignmentService } from '../../../services/assignment.service';
import { TestAssignment } from '../../../models/test-assignment.model';

@Component({
    selector: 'app-result-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './result-view.component.html',
    styleUrls: ['./result-view.component.css']
})
export class ResultViewComponent implements OnInit {
    assignment?: TestAssignment;

    constructor(
        private route: ActivatedRoute,
        private assignmentService: TestAssignmentService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadAssignment(+id);
        }
    }

    loadAssignment(id: number): void {
        this.assignmentService.getAssignmentById(id).subscribe(data => {
            this.assignment = data;
        });
    }
}
