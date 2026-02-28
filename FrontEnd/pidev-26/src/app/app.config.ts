import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
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
  SearchOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  ClearOutline,
  PlusCircleOutline,
} from '@ant-design/icons-angular/icons';

// ✅ ADD THESE
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

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
      SearchOutline,
      PlusOutline,
      EditOutline,
      DeleteOutline,
      ClearOutline,
      PlusCircleOutline,
    ]),

    // ✅ IMPORTANT: make NzModalService available
    importProvidersFrom(NzModalModule),
    NzModalService,
  ],
};