import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';

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
  FormOutline,
  HistoryOutline,
  PlusOutline,
  AlertOutline,
  CheckCircleOutline,
  InfoCircleOutline,
  RightOutline,
  ToolOutline,
  SearchOutline,
  EditOutline,
  DeleteOutline,
  InboxOutline,
  BookOutline,
  DownloadOutline,
  ArrowLeftOutline,
  PlayCircleOutline,
  LineChartOutline,
  MinusOutline,
  WarningOutline,
  FileSearchOutline,
  CalendarOutline,
  ClockCircleOutline,
  RobotOutline,
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
      FormOutline,
      HistoryOutline,
      PlusOutline,
      AlertOutline,
      CheckCircleOutline,
      InfoCircleOutline,
      RightOutline,
      ToolOutline,
      SearchOutline,
      EditOutline,
      DeleteOutline,
      InboxOutline,
      BookOutline,
      DownloadOutline,
      ArrowLeftOutline,
      PlayCircleOutline,
      LineChartOutline,
      MinusOutline,
      WarningOutline,
      FileSearchOutline,
      CalendarOutline,
      ClockCircleOutline,
      RobotOutline,
    ]),
    provideTranslateService({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader,
      },
    }),
    provideTranslateHttpLoader({
      prefix: '/i18n/',
      suffix: '.json',
    }),
  ],
};
