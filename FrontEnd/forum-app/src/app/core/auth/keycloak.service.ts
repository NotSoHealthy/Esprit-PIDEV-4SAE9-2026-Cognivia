import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
    private keycloak: Keycloak;

    constructor() {
        this.keycloak = new Keycloak({
            url: 'http://localhost:8080',
            realm: 'pidev',
            clientId: 'pidev-frontend',
        });
    }

    async init(): Promise<boolean> {
        return await this.keycloak.init({
            onLoad: 'check-sso',
            pkceMethod: 'S256',
            checkLoginIframe: false,
        });
    }

    login(redirectUri = window.location.origin): Promise<void> {
        return this.keycloak.login({ redirectUri });
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
}
