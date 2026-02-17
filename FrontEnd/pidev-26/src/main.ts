import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { KeycloakService } from './app/core/auth/keycloak.service';
import { APP_INITIALIZER, Provider } from '@angular/core';

const keycloakProviders: Provider[] = [
  {
    provide: APP_INITIALIZER,
    deps: [KeycloakService],
    useFactory: (keycloak: KeycloakService) => () => keycloak.init(),
    multi: true,
  },
];

bootstrapApplication(App, {
  ...appConfig,
  providers: [...appConfig.providers!, ...keycloakProviders],
}).catch((err) => console.error(err));
