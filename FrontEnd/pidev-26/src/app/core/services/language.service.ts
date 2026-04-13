import { Injectable, Injector, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
    private readonly injector = inject(Injector);
    private readonly LANG_KEY = 'pidev.locale';

    /** Lazily resolved so the root injector doesn't fail during test setup
     *  when TranslateService isn't yet registered (e.g. Patient/Doctor specs). */
    private get translate(): TranslateService {
        return this.injector.get(TranslateService);
    }

    initLanguage(): void {
        this.translate.addLangs(['en', 'fr', 'ar']);
        this.translate.setDefaultLang('en');

        const storedLang = localStorage.getItem(this.LANG_KEY);
        const browserLang = this.translate.getBrowserLang();
        const langToUse = storedLang || (browserLang && ['en', 'fr', 'ar'].includes(browserLang) ? browserLang : 'en');

        this.setLanguage(langToUse);
    }

    setLanguage(lang: string): void {
        localStorage.setItem(this.LANG_KEY, lang);
        this.translate.use(lang);

        // Update document metadata
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    getLanguage(): string {
        return localStorage.getItem(this.LANG_KEY) || 'en';
    }
}
