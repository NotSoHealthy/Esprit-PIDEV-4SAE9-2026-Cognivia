import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { API_BASE_URL } from './core/api/api.tokens';
import { IMGBB_API_KEY } from './core/media/imgbb.tokens';
import { GEMINI_API_KEY, GEMINI_MODEL } from './core/ai/gemini.tokens';
import { environment } from '../environments/environment';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  AppstoreOutline,
  UserOutline,
  UserAddOutline,
  BellOutline,
  UpOutline,
  DownOutline,
  CalendarOutline,
} from '@ant-design/icons-angular/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: API_BASE_URL,
      useValue: environment.apiBaseUrl,
    },
    {
      provide: IMGBB_API_KEY,
      useValue: environment.imgbbApiKey,
    },
    {
      provide: GEMINI_API_KEY,
      useValue: environment.geminiApiKey,
    },
    {
      provide: GEMINI_MODEL,
      useValue: environment.geminiModel,
    },
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
