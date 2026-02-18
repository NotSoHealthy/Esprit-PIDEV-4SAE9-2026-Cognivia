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
  selector: 'app-profile-caregiver',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
  ],
  templateUrl: './caregiver.html',
  styleUrl: './caregiver.css',
})
export class Caregiver implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private http = inject(HttpClient);
  private readonly keycloak = inject(KeycloakService);
  private apiBaseUrl = inject(API_BASE_URL);
  private oldCaregiverInformation: any = {};
  validateForm: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
  }> = this.fb.group({
    firstName: this.fb.control('', Validators.required),
    lastName: this.fb.control('', Validators.required),
  });

  submit(): void {
    if (this.validateForm.valid) {
      console.log('Caregiver form:', this.validateForm.getRawValue());
      if (!this.oldCaregiverInformation || !this.oldCaregiverInformation.id) {
        this.http
          .post(
            `${this.apiBaseUrl}/care/caregiver/register/${this.keycloak.getUserId()}`,
            this.validateForm.getRawValue(),
          )
          .subscribe((response) => {
            console.log('Caregiver created:', response);
          });
      } else {
        this.http
          .put(
            `${this.apiBaseUrl}/care/caregiver/${this.oldCaregiverInformation.id}`,
            this.validateForm.getRawValue(),
          )
          .subscribe((response) => {
            console.log('Caregiver updated:', response);
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
      .get(`${this.apiBaseUrl}/care/caregiver/user/${this.keycloak.getUserId()}`)
      .subscribe((data) => {
        this.oldCaregiverInformation = data;
        this.validateForm.patchValue({
          firstName: this.oldCaregiverInformation.firstName,
          lastName: this.oldCaregiverInformation.lastName,
        });
        console.log('Caregiver information loaded:', this.oldCaregiverInformation);
      });
  }
}
