import { Component, OnInit, OnDestroy } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  InteractionStatus, 
  PopupRequest, 
  RedirectRequest, 
  AuthenticationResult, 
  AuthError 
} from '@azure/msal-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly destroying$ = new Subject<void>();
  isInitialized = false;
  loginError: string = '';
  
  // Configuración de autenticación
  private readonly loginRequest: RedirectRequest = {
    scopes: ['user.read', 'openid', 'profile', 'email'],
    prompt: 'select_account'
  };

  constructor(
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario ya está autenticado
    if (this.authService.instance.getAllAccounts().length > 0) {
      this.router.navigate(['/welcome']);
      return;
    }

    // Escuchar eventos de interacción de MSAL
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroying$)
      )
      .subscribe(() => {
        // Verificar si hay cuentas después de que la interacción ha terminado
        const accounts = this.authService.instance.getAllAccounts();
        if (accounts.length > 0) {
          // Establecer la cuenta activa
          this.authService.instance.setActiveAccount(accounts[0]);
          
          // Obtener token silenciosamente
          this.getTokenSilently(accounts[0]);
        }
      });

    // Manejar redirecciones de autenticación
    this.authService.handleRedirectObservable()
      .pipe(takeUntil(this.destroying$))
      .subscribe({
        next: (result: AuthenticationResult | null) => {
          if (result) {
            console.log('Inicio de sesión exitoso después de redirección');
            this.authService.instance.setActiveAccount(result.account);
            
            // Obtener token
            this.getTokenSilently(result.account);
          }
        },
        error: (error: AuthError) => {
          console.error('Error al manejar redirección:', error);
          this.loginError = `Error de autenticación: ${error.message}`;
        }
      });
      
    this.isInitialized = true;
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.destroying$.next();
    this.destroying$.complete();
  }

  /**
   * Inicia el proceso de login con Microsoft
   */
  login(): void {
    this.loginError = '';
    
    if (this.authService.instance.getAllAccounts().length > 0) {
      // Si ya hay cuentas, simplemente navegar a welcome
      this.router.navigate(['/welcome']);
      return;
    }
    
    // Usar loginRedirect para evitar problemas con popups
    this.authService.loginRedirect(this.loginRequest);
  }

  /**
   * Obtiene un token de acceso silenciosamente
   */
  private getTokenSilently(account: any): void {
    this.authService.acquireTokenSilent({
      scopes: ['user.read'],
      account: account
    })
    .pipe(takeUntil(this.destroying$))
    .subscribe({
      next: (tokenResponse) => {
        console.log('Token obtenido correctamente');
        this.verifyMicrosoftTokenServerSide(tokenResponse.idToken);
      },
      error: (error) => {
        console.error('Error al obtener el token:', error);
        this.loginError = 'Error al obtener el token de acceso. Por favor, intenta nuevamente.';
      }
    });
  }

  /**
   * Verifica el token con el servidor
   */
  private verifyMicrosoftTokenServerSide(token: string): void {
    console.log('Token a enviar:', token);
    console.log('Longitud del token:', token.length);
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
    };

    // Usar la URL de la API local para desarrollo
    // const apiUrl = 'https://localhost:7035/api/Account/MicrosoftLogin';
    // Descomentar para producción
    const apiUrl = 'https://88.24.26.59/api/Account/MicrosoftLogin';

    this.http.post<any>(apiUrl, { token }, httpOptions)
      .pipe(takeUntil(this.destroying$))
      .subscribe({
        next: (response) => {
          console.log('Inicio de Sesión con Microsoft Exitoso:', response);
          // Guardar el token JWT recibido del servidor
          localStorage.setItem('jwt', response.Token);
          // Navegar a la página de bienvenida
          this.router.navigate(['/welcome']);
        },
        error: (error) => {
          console.error('Error al verificar el token de Microsoft:', error);
          this.loginError = 'Error al verificar credenciales con el servidor. Por favor, intenta nuevamente.';
          
          // Limpiar datos en caso de error
          this.limpiarSesion();
        }
      });
  }

  /**
   * Limpia la sesión en caso de error
   */
  private limpiarSesion(): void {
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0) {
      accounts.forEach(account => {
        this.authService.instance.logout({
          account: account,
          onRedirectNavigate: () => false
        });
      });
    }
  }
}
