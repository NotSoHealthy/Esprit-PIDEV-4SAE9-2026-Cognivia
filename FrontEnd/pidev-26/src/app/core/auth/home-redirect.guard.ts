import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

export const homeRedirectGuard: CanActivateFn = () => {
    const router = inject(Router);
    const keycloak = inject(KeycloakService);

    if (keycloak.isLoggedIn()) {
        router.navigate(['/posts']);
        return false;
    }

    return true;
};
