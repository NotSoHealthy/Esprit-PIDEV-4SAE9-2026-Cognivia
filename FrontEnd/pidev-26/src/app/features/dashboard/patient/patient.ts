import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient',
  imports: [CommonModule],
  templateUrl: './patient.html',
  styleUrl: './patient.css',
})
export class Patient implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Redirect patients straight to the tasks page
    this.router.navigate(['/tasks']);
  }
}
