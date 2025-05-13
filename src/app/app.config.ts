import { ApplicationConfig, PLATFORM_ID, inject } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { 
  IPublicClientApplication, 
  PublicClientApplication,
  BrowserCacheLocation
} from '@azure/msal-browser';
import { 
  MSAL_INSTANCE, 
  MsalService, 
  MsalGuard, 
  MsalBroadcastService
} from '@azure/msal-angular';
import { provideHttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

// Función para crear la instancia de MSAL
export function MSALInstanceFactory(): IPublicClientApplication {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  // Determinar las URLs de redirección basadas en el entorno
  const redirectUri = isBrowser ? window.location.origin : 'http://localhost:4200';
  const postLogoutRedirectUri = isBrowser ? window.location.origin : 'http://localhost:4200';

  return new PublicClientApplication({
    auth: {
      clientId: 'b689d414-ffd4-487b-a700-ddb43da08a85', // Reemplaza con tu Client ID de Microsoft
      redirectUri: redirectUri,
      authority: "https://login.microsoftonline.com/common",
      postLogoutRedirectUri: postLogoutRedirectUri,
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false
    }
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    MsalService,  // Añadir MsalService como proveedor
    MsalGuard,
    MsalBroadcastService
  ]
};