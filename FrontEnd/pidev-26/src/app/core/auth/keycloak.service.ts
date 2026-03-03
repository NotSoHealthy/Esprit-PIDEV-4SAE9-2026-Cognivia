import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak: Keycloak;
  private readonly unverifiedAlertKey = 'pidev.auth.alert.unverified';
  private readonly unverifiedLogoutAttemptAtKey = 'pidev.auth.unverified.logout.at';

  constructor() {
    this.keycloak = new Keycloak({
      url: 'http://localhost:8180',
      realm: 'pidev',
      clientId: 'pidev-frontend',
    });
  }

  async init(): Promise<boolean> {
    const authenticated = await this.keycloak.init({
      onLoad: 'check-sso', // or 'login-required'
      pkceMethod: 'S256',
      checkLoginIframe: false, // simpler for dev
    });

    if (authenticated && this.hasRealmRole('ROLE_UNVERIFIED')) {
      // Persist message across the Keycloak logout redirect, then send user back to home.
      sessionStorage.setItem(
        this.unverifiedAlertKey,
        'Your account is not verified yet. Please verify your account before logging in.',
      );

      // Prevent rapid logout redirect loops if Keycloak SSO re-authenticates immediately.
      const lastAttempt = Number(sessionStorage.getItem(this.unverifiedLogoutAttemptAtKey) ?? '0');
      const now = Date.now();
      if (!Number.isFinite(lastAttempt) || now - lastAttempt > 10_000) {
        sessionStorage.setItem(this.unverifiedLogoutAttemptAtKey, String(now));
        // Important: do NOT clearToken before logout, otherwise Keycloak won't get `id_token_hint`
        // and can show a logout confirmation screen.
        try {
          await this.logout(`${window.location.origin}/`);
        } finally {
          // Best-effort local cleanup (may not run if the browser navigates away immediately).
          this.keycloak.clearToken();
        }
      } else {
        // If we're throttling logout, at least drop local auth state so the app treats the user as logged out.
        this.keycloak.clearToken();
      }
      return false;
    }

    return authenticated;
  }

  login(redirectUri = window.location.origin): Promise<void> {
    return this.keycloak.login({ redirectUri });
  }

  register(redirectUri = window.location.origin): Promise<void> {
    return this.keycloak.register({ redirectUri });
  }

  logout(redirectUri = window.location.origin): Promise<void> {
    return this.keycloak.logout({ redirectUri });
  }

  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  getToken(): Promise<string> {
    return this.keycloak.token
      ? Promise.resolve(this.keycloak.token)
      : this.keycloak.updateToken(0).then(() => this.keycloak.token!);
  }

  async updateToken(minValiditySeconds = 30): Promise<void> {
    await this.keycloak.updateToken(minValiditySeconds);
  }

  getUserId(): string | undefined {
    return this.keycloak.tokenParsed?.sub;
  }

  getNumericUserId(): number | null {
    const tokenParsed = this.keycloak.tokenParsed as Record<string, unknown> | undefined;
    if (!tokenParsed) return null;

    const candidateValues = [
      tokenParsed['id'],
      tokenParsed['userId'],
      tokenParsed['adminId'],
      tokenParsed['sub'],
    ];

    for (const value of candidateValues) {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue) && parsedValue > 0) {
        return parsedValue;
      }
    }

    return null;
  }

  getUsername(): string | undefined {
    return this.keycloak.tokenParsed?.['preferred_username'] as string | undefined;
  }

  getEmail(): string | undefined {
    return this.keycloak.tokenParsed?.['email'] as string | undefined;
  }

  getPhoneNumber(): string | undefined {
    return this.keycloak.tokenParsed?.['phone_number'] as string | undefined;
  }

  getRealmRoles(): string[] {
    const realmAccess = this.keycloak.tokenParsed?.realm_access as any;
    return realmAccess?.roles ?? [];
  }

  hasRealmRole(role: string): boolean {
    return this.getRealmRoles().includes(role);
  }

  getUnverifiedAlertMessage(): string | null {
    return sessionStorage.getItem(this.unverifiedAlertKey);
  }

  clearUnverifiedAlertMessage(): void {
    sessionStorage.removeItem(this.unverifiedAlertKey);
  }

  getUserRole(): string | undefined {
    const roles = this.getRealmRoles();
    if (roles.length > 0 && roles.includes('ROLE_UNVERIFIED')) return 'ROLE_UNVERIFIED';
    return roles[0] || undefined;
  }

  formatRoles(role: string): string {
    return role.replace('ROLE_', '').toLowerCase();
  }
}
