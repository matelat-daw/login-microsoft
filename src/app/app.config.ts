import { ApplicationConfig, PLATFORM_ID, inject } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { 
  IPublicClientApplication, 
  PublicClientApplication,
  BrowserCacheLocation,
  LogLevel
} from '@azure/msal-browser';
import { 
  MSAL_INSTANCE, 
  MsalService, 
  MsalGuard, 
  MsalBroadcastService
} from '@azure/msal-angular';
import { provideHttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

// Configuración de MSAL
const msalConfig = {
  auth: {
    clientId: 'b689d414-ffd4-487b-a700-ddb43da08a85',
    authority: 'https://login.microsoftonline.com/common',
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
          default:
            break;
        }
      },
      logLevel: LogLevel.Info
    }
  }
};

// Función para crear la instancia de MSAL
export function MSALInstanceFactory(): IPublicClientApplication {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  
  // Determinar las URLs de redirección basadas en el entorno
  const redirectUri = isBrowser ? window.location.origin : 'http://localhost:4200';
  const postLogoutRedirectUri = isBrowser ? window.location.origin : 'http://localhost:4200';
  
  // Crear configuración con URLs dinámicas
  const config = {
    ...msalConfig,
    auth: {
      ...msalConfig.auth,
      redirectUri,
      postLogoutRedirectUri
    }
  };

  return new PublicClientApplication(config);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};