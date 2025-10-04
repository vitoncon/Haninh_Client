import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG, PrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { API_BASE_URL } from './app/core/tokens/api-url.token';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { MessageService } from 'primeng/api';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { vi } from '@/config/translation-vi';

registerLocaleData(localeVi);

function initPrimeNGConfig(primeng: PrimeNG) {
    return () => {
        primeng.setTranslation(vi);
    };
}
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation()
        ),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        { provide: API_BASE_URL, useValue: 'http://localhost:10093' },
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        MessageService,
        { provide: 'LOCALE_ID', useValue: 'vi' },
        {
            provide: APP_INITIALIZER,
            useFactory: initPrimeNGConfig,
            deps: [PrimeNG],
            multi: true
        }
    ]
};
