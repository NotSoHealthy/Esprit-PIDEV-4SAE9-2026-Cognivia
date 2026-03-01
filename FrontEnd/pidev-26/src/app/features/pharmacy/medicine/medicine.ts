import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-medicine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medicine.html',
  styleUrl: './medicine.css',
})
export class Medicine {
  private readonly route = inject(ActivatedRoute);
  pharmacyId = this.route.snapshot.paramMap.get('pharmacyId');
}