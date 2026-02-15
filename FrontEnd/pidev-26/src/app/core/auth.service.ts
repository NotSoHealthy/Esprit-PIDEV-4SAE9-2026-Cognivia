import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'pidev_demo_auth_email';

  constructor() {}

  login(email: string, password: string): Observable<void> {
    if (!email || !password) {
      return throwError(() => new Error('Email and password are required.'));
    }

    localStorage.setItem(this.storageKey, email);
    return of(void 0).pipe(delay(400));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem(this.storageKey));
  }
}
