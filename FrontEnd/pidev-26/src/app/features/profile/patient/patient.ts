import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { KeycloakService } from '../../../core/auth/keycloak.service';

@Component({
  selector: 'app-profile-patient',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
  ],
  templateUrl: './patient.html',
  styleUrl: './patient.css',
})
export class Patient implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private http = inject(HttpClient);
  private readonly keycloak = inject(KeycloakService);
  private apiBaseUrl = inject(API_BASE_URL);
  private oldPatientInformation: any = {};
  validateForm: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    dateOfBirth: FormControl<Date | null>;
  }> = this.fb.group({
    firstName: this.fb.control('', Validators.required),
    lastName: this.fb.control('', Validators.required),
    dateOfBirth: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });

  submit(): void {
    if (this.validateForm.valid) {
      console.log('Patient form:', this.validateForm.getRawValue());
      if (!this.oldPatientInformation || !this.oldPatientInformation.id) {
        this.http
          .post(
            `${this.apiBaseUrl}/care/patient/register/${this.keycloak.getUserId()}`,
            this.validateForm.getRawValue(),
          )
          .subscribe((response) => {
            console.log('Patient created:', response);
          });
      } else {
        this.http
          .put(
            `${this.apiBaseUrl}/care/patient/${this.oldPatientInformation.id}`,
            this.validateForm.getRawValue(),
          )
          .subscribe((response) => {
            console.log('Patient updated:', response);
          });
      }
      return;
    }

    Object.values(this.validateForm.controls).forEach((control) => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  ngOnInit(): void {
    this.http
      .get(`${this.apiBaseUrl}/care/patient/user/${this.keycloak.getUserId()}`)
      .subscribe((data) => {
        this.oldPatientInformation = data;
        this.validateForm.patchValue({
          firstName: this.oldPatientInformation.firstName,
          lastName: this.oldPatientInformation.lastName,
          dateOfBirth: new Date(this.oldPatientInformation.dateOfBirth),
        });
        console.log('Patient information loaded:', this.oldPatientInformation);
      });
  }
}
