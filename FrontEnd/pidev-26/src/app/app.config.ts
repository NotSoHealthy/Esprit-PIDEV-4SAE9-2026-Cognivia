import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { API_BASE_URL } from './core/api/api.tokens';
import { environment } from '../environments/environment';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  AppstoreOutline,
  UserOutline,
  UserAddOutline,
  BellOutline,
  UpOutline,
  DownOutline,
  MedicineBoxOutline,
  FileTextOutline,
  HeartOutline,
  HeartFill,
  MoreOutline,
  PlusOutline,
  MinusOutline,
  PictureOutline,
  ArrowLeftOutline,
  StarFill,
  GlobalOutline
} from '@ant-design/icons-angular/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: API_BASE_URL,
      useValue: environment.apiBaseUrl,
    },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNzIcons([
      AppstoreOutline,
      UserOutline,
      UserAddOutline,
      BellOutline,
      UpOutline,
      DownOutline,
      MedicineBoxOutline,
      FileTextOutline,
      HeartOutline,
      HeartFill,
      MoreOutline,
      ArrowLeftOutline,
      PictureOutline,
      PlusOutline,
      MinusOutline,
      StarFill,
      GlobalOutline
    ]),
  ],
};
