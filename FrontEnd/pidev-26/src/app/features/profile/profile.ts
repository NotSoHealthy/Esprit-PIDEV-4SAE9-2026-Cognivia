import { Component, inject, OnInit } from '@angular/core';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { Patient } from './patient/patient';
import { Caregiver } from './caregiver/caregiver';
import { Doctor } from './doctor/doctor';
import { Pharmacist } from './pharmacist/pharmacist';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [Patient, Caregiver, Doctor, Pharmacist, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly keycloak = inject(KeycloakService);
  public readonly userRole = this.keycloak.getUserRole();
}
