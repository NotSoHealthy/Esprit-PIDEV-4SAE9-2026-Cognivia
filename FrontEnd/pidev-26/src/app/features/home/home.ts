import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NzAlertModule, RouterLink, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly keycloak = inject(KeycloakService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  showLangDropdown = false;
  currentLang = 'en';

  languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' },
  ];

  alertMessage: string | null = null;

  protected readonly headerLogoUrl =
    'https://cdn.builder.io/api/v1/image/assets%2Fd3d69403f729419ab22b58accb7875b9%2F9db03c941d394af5b6ff65a035e69fd5?format=webp&width=800&height=1200';
  protected readonly logoUrl =
    'https://cdn.builder.io/api/v1/image/assets%2Fd3d69403f729419ab22b58accb7875b9%2F213a472db51145909716f52671b94f74?format=webp&width=800&height=1200';

  ngOnInit(): void {
    this.translate.addLangs(['en', 'fr', 'ar']);
    this.translate.setDefaultLang('en');
    this.translate.use('en');

    if (this.keycloak.isLoggedIn()) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    this.alertMessage = this.keycloak.getUnverifiedAlertMessage();
  }

  toggleLangDropdown(): void {
    this.showLangDropdown = !this.showLangDropdown;
  }

  switchLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    this.showLangDropdown = false;

    // Update document direction and lang attribute
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }

  getCurrentLangName(): string {
    return this.languages.find((l) => l.code === this.currentLang)?.name ?? 'English';
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
