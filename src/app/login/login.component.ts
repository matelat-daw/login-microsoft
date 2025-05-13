import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BrowserAuthError } from '@azure/msal-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  isInitialized = false;
  loginError: string = '';

  constructor(
    private authService: MsalService,
    private router: Router,
    private http: HttpClient
  ) {
    // Verificar si el usuario ya está autenticado
    if (this.authService.instance.getAllAccounts().length > 0) {
      this.router.navigate(['/welcome']);
    }
  }

  ngOnInit(): void {
    // Limpiar cualquier interacción pendiente al cargar el componente
    try {
      this.authService.instance.handleRedirectPromise().catch(() => {
        // Ignorar errores aquí, solo queremos asegurarnos de que se limpie cualquier interacción pendiente
      });
    } catch (error) {
      console.log('Error al manejar redirección:', error);
    }

    // Verificar si MSAL ya está inicializado
    if (!this.authService.instance.getActiveAccount() && this.authService.instance.getAllAccounts().length > 0) {
      // Establecer la primera cuenta como activa
      this.authService.instance.setActiveAccount(this.authService.instance.getAllAccounts()[0]);
      this.router.navigate(['/welcome']);
    }
    
    // Marcar como inicializado
    this.isInitialized = true;
  }

  async login(): Promise<void> {
    this.loginError = '';
    
    try {
      // Primero, intentar limpiar cualquier interacción pendiente
      try {
        if (this.authService.instance.getAllAccounts().length > 0) {
          // Si ya hay cuentas, simplemente navegar a welcome
          this.router.navigate(['/welcome']);
          return;
        }
      } catch (e) {
        console.log('Error al verificar cuentas:', e);
      }
      
      // Asegurarse de que MSAL esté inicializado
      if (!this.authService.instance.getConfiguration()) {
        await this.authService.instance.initialize();
      }
      
      // Iniciar sesión
      const result = await this.authService.loginPopup().toPromise();
      
      if (result) {
        this.authService.instance.setActiveAccount(result.account);
        this.authService.acquireTokenSilent({
          scopes: ['user.read'],
          account: result.account
        }).subscribe(
          tokenResponse => {
            // Enviar el token al servidor para verificación
            console.log('Token de Acceso: ', tokenResponse.accessToken);
            console.log('Token de ID: ', tokenResponse.idToken);
            this.verifyMicrosoftTokenServerSide(tokenResponse.idToken);
          },
          error => {
            console.error('Error al obtener el token:', error);
            this.loginError = 'Error al obtener el token de acceso. Por favor, intenta nuevamente.';
          }
        );
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      
      // Manejar específicamente el error de interacción en progreso
      if (error instanceof BrowserAuthError && error.errorCode === 'interaction_in_progress') {
        console.log('Detectada interacción en progreso, intentando limpiar...');
        
        try {
          // Forzar la limpieza del estado de interacción
          this.authService.instance.clearCache();
          
          // Esperar un momento y reintentar
          setTimeout(() => {
            this.login();
          }, 1000);
          
          return;
        } catch (cleanupError) {
          console.error('Error al limpiar caché:', cleanupError);
          this.loginError = 'Error al limpiar el estado de autenticación. Por favor, recarga la página.';
        }
      } else {
        this.loginError = 'Error durante el inicio de sesión. Por favor, intenta nuevamente.';
      }
    }
  }

  verifyMicrosoftTokenServerSide(token: string): void {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
    };

    // this.http.post<any>('https://88.25.64.124/api/Account/MicrosoftLogin', { token }, httpOptions)
    this.http.post<any>('https://localhost:7035/api/Account/MicrosoftLogin', { token }, httpOptions)
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
      });
  }
}