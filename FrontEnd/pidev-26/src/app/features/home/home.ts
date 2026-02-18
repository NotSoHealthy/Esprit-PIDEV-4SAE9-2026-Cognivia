import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NzAlertModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly keycloak = inject(KeycloakService);
  private readonly router = inject(Router);
  alertMessage: string | null = null;

  ngOnInit(): void {
    if (this.keycloak.isLoggedIn()) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    this.alertMessage = this.keycloak.getUnverifiedAlertMessage();
  }

  clearAlert(): void {
    this.keycloak.clearUnverifiedAlertMessage();
    this.alertMessage = null;
  }

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
