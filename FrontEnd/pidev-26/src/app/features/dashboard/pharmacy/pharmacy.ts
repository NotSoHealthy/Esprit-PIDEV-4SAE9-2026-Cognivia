import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-pharmacy',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './pharmacy.html',
  styleUrl: './pharmacy.css',
})
export class DashboardPharmacy {}
