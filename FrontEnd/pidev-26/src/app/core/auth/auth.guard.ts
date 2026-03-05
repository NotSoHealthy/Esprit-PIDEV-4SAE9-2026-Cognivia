import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';

import { KeycloakService } from './keycloak.service';

export const authGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);

  if (keycloak.isLoggedIn()) {
    return true;
  }

  // Redirect to login
  keycloak.login(window.location.href);
  return false;
};

export const homeRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const keycloak = inject(KeycloakService);

  return keycloak.isLoggedIn() ? router.parseUrl('/dashboard') : true;
};

export const roleGuard = (roles: string[]): CanMatchFn => {
  return () => {
    const router = inject(Router);
    const keycloak = inject(KeycloakService);

    return keycloak.isLoggedIn() && roles.includes(keycloak.getUserRole() ?? '')
      ? true
      : router.parseUrl('/');
  };
};
