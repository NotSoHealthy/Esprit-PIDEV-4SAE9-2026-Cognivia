import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  AppstoreOutline,
  UserOutline,
  UserAddOutline,
  BellOutline,
  UpOutline,
  DownOutline,
} from '@ant-design/icons-angular/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNzIcons([
      AppstoreOutline,
      UserOutline,
      UserAddOutline,
      BellOutline,
      UpOutline,
      DownOutline,
    ]),
  ],
};
