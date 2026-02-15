import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { KeycloakService } from '../../../core/auth/keycloak.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly keycloak = inject(KeycloakService);

  protected readonly token = signal<string | null>(null);
  protected readonly tokenError = signal<string | null>(null);

  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  username(): string | undefined {
    return this.keycloak.getUsername();
  }

  roles(): string[] {
    return this.keycloak.getRealmRoles();
  }

  async login(): Promise<void> {
    await this.keycloak.login(window.location.href);
  }

  async logout(): Promise<void> {
    await this.keycloak.logout(window.location.origin);
  }

  async refreshToken(): Promise<void> {
    this.tokenError.set(null);
    try {
      await this.keycloak.updateToken(30);
      const token = await this.keycloak.getToken();
      this.token.set(token);
    } catch (e) {
      this.token.set(null);
      this.tokenError.set('Failed to refresh/get token.');
    }
  }
}
