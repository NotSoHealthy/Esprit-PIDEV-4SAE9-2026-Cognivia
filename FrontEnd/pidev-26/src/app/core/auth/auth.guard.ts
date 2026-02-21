import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { KeycloakService } from './keycloak.service';

export const authGuard: CanMatchFn = () => {
  const router = inject(Router);
  const keycloak = inject(KeycloakService);

  return keycloak.isLoggedIn() ? true : router.parseUrl('/');
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
