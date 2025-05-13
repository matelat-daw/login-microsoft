import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {
  userInfo: any;

  constructor(
    private authService: MsalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length === 0) {
      this.router.navigate(['/login']);
      return;
    }

    const account = accounts[0];
    this.userInfo = {
      name: account.name,
      username: account.username
    };
  }

  logout(): void {
    // Limpiar el almacenamiento local
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar la caché de MSAL
    this.authService.instance.clearCache();
    
    // Eliminar todas las cuentas de la sesión con cierre completo
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0) {
      // Usar logoutRedirect para forzar el cierre de sesión también en Microsoft
      this.authService.logoutRedirect({
        account: accounts[0],
        postLogoutRedirectUri: window.location.origin + '/#/login',
        // Permitir la redirección a Microsoft para cerrar sesión completamente
        onRedirectNavigate: (url) => {
          return true;
        }
      });
    } else {
      // Si no hay cuentas, simplemente navegar a login
      this.router.navigate(['/login']);
    }
  }
}