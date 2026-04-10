import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';

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
  MedicineBoxOutline,
  FileTextOutline,
  HeartOutline,
  HeartFill,
  PlusOutline,
  MinusOutline,
  PictureOutline,
  PictureTwoTone,
  ArrowLeftOutline,
  StarFill,
  GlobalOutline,
  UploadOutline,
  DeleteOutline,
  EyeOutline,
  FileImageOutline,
  PaperClipOutline,
  LoadingOutline,
  EnvironmentOutline,
  PhoneOutline,
  ClearOutline,
  PlusCircleOutline,
  CalendarOutline,
  DislikeOutline,
  LikeFill,
  DislikeFill,
  MessageOutline,
  ArrowRightOutline,
  PushpinOutline,
  PushpinFill,
  SmileOutline,
  SmileFill,
  BulbOutline,
  BulbFill,
  FrownOutline,
  FrownFill,
  AlertFill,
  MoreOutline,
  CheckCircleFill,
  ProfileOutline,
  SettingOutline,
  WifiOutline,
  TagsOutline,
  ShareAltOutline,
  LinkOutline,
  RollbackOutline,
  SendOutline,
  MailOutline,
  TeamOutline,
  ReloadOutline,
  CloseCircleOutline,
  ExperimentOutline,
  SolutionOutline,
  DeploymentUnitOutline,
  TagOutline,
  RetweetOutline,
  UndoOutline,
  TwitterOutline,
  WhatsAppOutline,
  RobotFill,
  FormOutline,
  HistoryOutline,
  AlertOutline,
  CheckCircleOutline,
  InfoCircleOutline,
  RightOutline,
  ToolOutline,
  SearchOutline,
  EditOutline,
  InboxOutline,
  BookOutline,
  DownloadOutline,
  PlayCircleOutline,
  LineChartOutline,
  WarningOutline,
  FileSearchOutline,
  ClockCircleOutline,
  RobotOutline,
  CoffeeOutline,
  StopOutline,
  LikeOutline,
  SaveOutline,

  ContainerOutline,
  ShopOutline,
  UnorderedListOutline,
  IdcardOutline,
} from '@ant-design/icons-angular/icons';

// ✅ ADD THESE
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(routes),

    {
      provide: API_BASE_URL,
      useValue: (() => {
        const runtime = (globalThis as any)?.__env ?? null;
        const v = runtime?.apiBaseUrl;
        return (typeof v === 'string' && v.trim()) || environment.apiBaseUrl;
      })(),
    },
    {
      provide: IMGBB_API_KEY,
      useValue: (() => {
        const runtime = (globalThis as any)?.__env ?? null;
        const v = runtime?.imgbbApiKey;
        return (typeof v === 'string' && v.trim()) || environment.imgbbApiKey;
      })(),
    },
    {
      provide: GEMINI_API_KEY,
      useValue: (() => {
        const runtime = (globalThis as any)?.__env ?? null;
        const v = runtime?.geminiApiKey;
        return (typeof v === 'string' && v.trim()) || environment.geminiApiKey;
      })(),
    },
    {
      provide: GEMINI_MODEL,
      useValue: (() => {
        const runtime = (globalThis as any)?.__env ?? null;
        const v = runtime?.geminiModel;
        return (typeof v === 'string' && v.trim()) || environment.geminiModel;
      })(),
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
      PictureTwoTone,
      PlusOutline,
      MinusOutline,
      StarFill,
      GlobalOutline,
      UploadOutline,
      DeleteOutline,
      EyeOutline,
      FileImageOutline,
      PaperClipOutline,
      LoadingOutline,
      EnvironmentOutline,
      PhoneOutline,
      SearchOutline,
      PlusOutline,
      EditOutline,
      DeleteOutline,
      LikeOutline,
      DislikeOutline,
      LikeFill,
      DislikeFill,
      MessageOutline,
      ArrowRightOutline,
      ArrowLeftOutline,
      ClockCircleOutline,
      PushpinOutline,
      PushpinFill,
      HeartOutline,
      HeartFill,
      SmileOutline,
      SmileFill,
      BulbOutline,
      BulbFill,
      FrownOutline,
      FrownFill,
      AlertOutline,
      AlertFill,
      MoreOutline,
      WarningOutline,
      CheckCircleOutline,
      CheckCircleFill,
      ProfileOutline,
      SettingOutline,
      WifiOutline,
      TagsOutline,
      ShareAltOutline,
      LinkOutline,
      RollbackOutline,
      SendOutline,
      MailOutline,
      TeamOutline,
      ReloadOutline,
      LineChartOutline,
      CloseCircleOutline,
      ExperimentOutline,
      MedicineBoxOutline,
      SolutionOutline,
      DeploymentUnitOutline,
      TagOutline,
      RetweetOutline,
      UndoOutline,
      TwitterOutline,
      WhatsAppOutline,
      RobotOutline,
      RobotFill,
      FormOutline,
      HistoryOutline,
      InfoCircleOutline,
      RightOutline,
      ToolOutline,
      InboxOutline,
      BookOutline,
      DownloadOutline,
      PlayCircleOutline,
      MinusOutline,
      FileSearchOutline,
      CalendarOutline,
      CoffeeOutline,
      StopOutline,
      SaveOutline,
      ContainerOutline,
      ShopOutline,
      UnorderedListOutline,
      IdcardOutline,
    ]),

    // ✅ IMPORTANT: make NzModalService available
    importProvidersFrom(NzModalModule),
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