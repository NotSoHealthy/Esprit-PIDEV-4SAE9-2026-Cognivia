import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly form: FormGroup;

  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.get('email')?.value ?? '';
    const password = this.form.get('password')?.value ?? '';

    this.loading = true;
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Logged in successfully.';
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage =
          err instanceof Error ? err.message : 'Login failed.';
      },
    });
  }
}
