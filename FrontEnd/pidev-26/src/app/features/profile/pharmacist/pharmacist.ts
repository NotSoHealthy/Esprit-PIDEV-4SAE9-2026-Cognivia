import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { PharmacistService, Pharmacist as PharmacistModel } from '../../../core/services/pharmacy/pharmacist.service';

@Component({
  selector: 'app-profile-pharmacist',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './pharmacist.html',
  styleUrl: './pharmacist.css',
})
export class Pharmacist implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private readonly keycloak = inject(KeycloakService);
  private readonly pharmacistService = inject(PharmacistService);
  private msg = inject(NzMessageService);
  private oldPharmacistInformation: PharmacistModel | null = null;
  
  validateForm: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    licenseNumber: FormControl<string>;
    phoneNumber: FormControl<string>;
  }> = this.fb.group({
    firstName: this.fb.control('', Validators.required),
    lastName: this.fb.control('', Validators.required),
    licenseNumber: this.fb.control('', [Validators.required, Validators.pattern('^[A-Za-z0-9]+$')]),
    phoneNumber: this.fb.control('', [Validators.required, Validators.pattern('^[0-9]{8}$')]),
  });

  submit(): void {
    if (this.validateForm.valid) {
      const userId = this.keycloak.getUserId();
      if (!userId) {
        this.msg.error('User ID not found');
        return;
      }

      console.log('Pharmacist form:', this.validateForm.getRawValue());
      if (!this.oldPharmacistInformation || !this.oldPharmacistInformation.id) {
        this.pharmacistService
          .registerPharmacist(userId, this.validateForm.getRawValue())
          .subscribe({
            next: (response: any) => {
              console.log('Pharmacist created:', response);
              this.msg.success('Profile created successfully');
              this.oldPharmacistInformation = response;
            },
            error: (error: any) => {
              console.error('Error creating pharmacist:', error);
              this.msg.error('Failed to create profile');
            }
          });
      } else {
        this.pharmacistService
          .updatePharmacist(this.oldPharmacistInformation.id, this.validateForm.getRawValue())
          .subscribe({
            next: (response: any) => {
              console.log('Pharmacist updated:', response);
              this.msg.success('Profile updated successfully');
              this.oldPharmacistInformation = response;
            },
            error: (error: any) => {
              console.error('Error updating pharmacist:', error);
              this.msg.error('Failed to update profile');
            }
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
    const userId = this.keycloak.getUserId();
    if (!userId) {
      return;
    }

    this.pharmacistService
      .getPharmacistByUserId(userId)
      .subscribe({
        next: (data: any) => {
          this.oldPharmacistInformation = data;
          if (this.oldPharmacistInformation) {
            this.validateForm.patchValue({
              firstName: this.oldPharmacistInformation.firstName,
              lastName: this.oldPharmacistInformation.lastName,
              licenseNumber: this.oldPharmacistInformation.licenseNumber,
              phoneNumber: this.oldPharmacistInformation.phoneNumber,
            });
            console.log('Pharmacist information loaded:', this.oldPharmacistInformation);
          }
        },
        error: (error: any) => {
          console.log('No existing pharmacist profile found, showing empty form');
          this.oldPharmacistInformation = null;
        },
      });
  }
}