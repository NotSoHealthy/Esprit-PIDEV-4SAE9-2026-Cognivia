import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { KeycloakService } from '../../core/auth/keycloak.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly keycloak = inject(KeycloakService);

  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  async login(): Promise<void> {
    await this.keycloak.login(window.location.href);
  }

  async signup(): Promise<void> {
    await this.keycloak.register(window.location.href);
  }

  async signout(): Promise<void> {
    await this.keycloak.logout(window.location.origin);
  }
}
