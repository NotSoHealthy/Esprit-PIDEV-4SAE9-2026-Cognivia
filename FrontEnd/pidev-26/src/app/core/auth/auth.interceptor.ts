import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from './keycloak.service';
import { API_BASE_URL } from '../api/api.tokens';
import { catchError, from, mergeMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(KeycloakService);
  const apiBaseUrl = inject(API_BASE_URL);

  // Only attach token to your backend URLs (important!)
  const isApiCall = req.url.startsWith(apiBaseUrl) || req.url.startsWith('/api');
  if (!isApiCall) return next(req);

  if (!keycloak.isLoggedIn()) return next(req);

  return from(keycloak.updateToken(30).then(() => keycloak.getToken())).pipe(
    mergeMap((token) => {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(authReq);
    }),
    catchError(() => next(req)),
  );
};
