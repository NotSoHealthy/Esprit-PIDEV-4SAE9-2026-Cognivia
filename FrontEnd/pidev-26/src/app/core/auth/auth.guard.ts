import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';

import { KeycloakService } from './keycloak.service';

export const authGuard: CanMatchFn = () => {
  const router = inject(Router);
  const keycloak = inject(KeycloakService);

  return keycloak.isLoggedIn();
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
