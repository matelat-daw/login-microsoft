import { Component, OnInit, OnDestroy } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AccountInfo } from '@azure/msal-browser';

interface UserInfo {
  name: string;
  username: string;
  photoUrl?: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, OnDestroy {
  userInfo: UserInfo | null = null;
  private readonly destroying$ = new Subject<void>();
  private readonly apiUrl = 'https://88.24.26.59/api/Account/Logout';

  constructor(
    private authService: MsalService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar fugas de memoria
    this.destroying$.next();
    this.destroying$.complete();
  }

  /**
   * Carga la información del usuario desde la cuenta activa
   */
  private loadUserInfo(): void {
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length === 0) {
      this.router.navigate(['/login']);
      return;
    }

    const account = accounts[0];
    this.userInfo = {
      name: account.name || 'Usuario',
      username: account.username || '',
      photoUrl: account.idTokenClaims?.['picture'] as string || ''
    };

    // Opcionalmente, obtener más información del usuario a través de Microsoft Graph
    this.loadUserPhoto(account);
  }

  /**
   * Intenta cargar la foto del usuario usando Microsoft Graph
   */
  private loadUserPhoto(account: AccountInfo): void {
    this.authService.acquireTokenSilent({
      scopes: ['user.read'],
      account: account
    }).subscribe({
      next: (tokenResponse) => {
        // Llamar a Microsoft Graph para obtener la foto
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${tokenResponse.accessToken}`
        });
        
        this.http.get('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: headers,
          responseType: 'blob'
        }).subscribe(
          (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            if (this.userInfo) {
              this.userInfo.photoUrl = url;
            }
          },
          error => {
            console.error('Error al obtener la foto de perfil:', error);
          }
        );
      },
      error: (error) => {
        console.error('Error al obtener token para recursos adicionales:', error);
      }
    });
  }

  /**
   * Cierra la sesión del usuario tanto en la API como en Microsoft
   */
  logout(): void {
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length === 0) {
      this.router.navigate(['/login']);
      return;
    }

    const account = accounts[0];
    
    // Llamar a la API para cerrar sesión en el backend
    this.http.post(this.apiUrl, {})
      .pipe(
        takeUntil(this.destroying$),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cerrar sesión en la API:', error);
          // Continuar con el proceso de cierre de sesión en Microsoft
          // a pesar del error en la API
          this.logoutFromMicrosoft(account);
          throw error;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Sesión cerrada correctamente en la API');
          this.logoutFromMicrosoft(account);
        }
      });
  }

  /**
   * Cierra la sesión en Microsoft después de cerrarla en la API
   */
  private logoutFromMicrosoft(account: AccountInfo): void {
    // Limpiar almacenamiento local
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar caché de MSAL
    this.authService.instance.clearCache();
    
    // Cerrar sesión en Microsoft con redirección
    this.authService.logoutRedirect({
      account: account,
      postLogoutRedirectUri: window.location.origin + '/#/login',
      onRedirectNavigate: (url) => true
    });
  }
}