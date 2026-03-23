import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { KeycloakService } from './app/core/auth/keycloak.service';
import { APP_INITIALIZER, Provider } from '@angular/core';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { CurrentUserService } from './app/core/user/current-user.service';
import { EnvironmentOutline } from '@ant-design/icons-angular/icons';

registerLocaleData(en);

const keycloakProviders: Provider[] = [
  {
    provide: APP_INITIALIZER,
    deps: [KeycloakService, CurrentUserService],
    useFactory: (keycloak: KeycloakService, currentUser: CurrentUserService) => async () => {
      const authenticated = await keycloak.init();
      if (authenticated && keycloak.isLoggedIn()) {
        await currentUser.loadFromApi(keycloak.getUserRole(), keycloak.getUserId());
      } else {
        currentUser.clear();
      }
    },
    multi: true,
  },
];

bootstrapApplication(App, {
  ...appConfig,
  providers: [...appConfig.providers!, ...keycloakProviders, provideNzI18n(en_US) ],
}).catch((err) => console.error(err));
