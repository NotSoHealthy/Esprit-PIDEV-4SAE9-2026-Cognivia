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
  selector: 'app-profile-doctor',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
  ],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private http = inject(HttpClient);
  private readonly keycloak = inject(KeycloakService);
  private apiBaseUrl = inject(API_BASE_URL);
  private oldDoctorInformation: any = {};
  validateForm: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    specialty: FormControl<string>;
    licenseNumber: FormControl<string>;
  }> = this.fb.group({
    firstName: this.fb.control('', Validators.required),
    lastName: this.fb.control('', Validators.required),
    specialty: this.fb.control('', Validators.required),
    licenseNumber: this.fb.control('', [Validators.required, Validators.pattern('^[A-Za-z0-9]+$')]),
  });

  submit(): void {
    if (this.validateForm.valid) {
      console.log('Doctor form:', this.validateForm.getRawValue());
      if (!this.oldDoctorInformation || !this.oldDoctorInformation.id) {
        this.http
          .post(
            `${this.apiBaseUrl}/care/doctor/register/${this.keycloak.getUserId()}`,
            this.validateForm.getRawValue(),
          )
          .subscribe((response) => {
            console.log('Doctor created:', response);
          });
      } else {
        this.http
          .put(
            `${this.apiBaseUrl}/care/doctor/${this.oldDoctorInformation.id}`,
            this.validateForm.getRawValue(),
          )
          .subscribe((response) => {
            console.log('Doctor updated:', response);
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
      .get(`${this.apiBaseUrl}/care/doctor/user/${this.keycloak.getUserId()}`)
      .subscribe((data) => {
        this.oldDoctorInformation = data;
        this.validateForm.patchValue({
          firstName: this.oldDoctorInformation.firstName!,
          lastName: this.oldDoctorInformation.lastName!,
          specialty: this.oldDoctorInformation.specialty!,
          licenseNumber: this.oldDoctorInformation.licenseNumber!,
        });
        console.log('Doctor information loaded:', this.oldDoctorInformation);
      });
  }
}
