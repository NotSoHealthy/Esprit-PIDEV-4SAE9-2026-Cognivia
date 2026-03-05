import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient.html',
  styleUrl: './patient.css',
})
export class Patient implements OnInit {
  private http = inject(HttpClient);
  private readonly keycloak = inject(KeycloakService);
  private apiBaseUrl = inject(API_BASE_URL);
  private router = inject(Router);

  patientInformation: any = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: ''
  };

  isLoading = true;
  isSaving = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    const userId = this.keycloak.getUserId();
    if (userId) {
      this.http
        .get(`${this.apiBaseUrl}/care/patient/user/${userId}`)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.patientInformation = data;
              console.log('Patient information loaded:', this.patientInformation);
            }
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading profile:', err);
            this.isLoading = false;
          }
        });
    } else {
      console.error('UserId missing in loadProfile');
      this.isLoading = false;
    }
  }

  saveProfile(): void {
    if (!this.patientInformation.id) {
      console.error('Missing patient ID. Cannot update.');
      return;
    }

    this.isSaving = true;
    const payload = {
      firstName: this.patientInformation.firstName,
      lastName: this.patientInformation.lastName,
      dateOfBirth: this.patientInformation.dateOfBirth,
      gender: this.patientInformation.gender?.toUpperCase()
    };

    console.log('Updating profile with payload:', payload);

    this.http.put(`${this.apiBaseUrl}/care/patient/${this.patientInformation.id}`, payload)
      .subscribe({
        next: (response) => {
          console.log('Profile updated successfully:', response);
          this.isSaving = false;
          alert('Profile updated successfully!');
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          this.isSaving = false;
          alert('Failed to update profile. Please check the console.');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
