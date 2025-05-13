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

  // ... existing code ...

  logout(): void {
    // Limpiar el almacenamiento local primero
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar la caché de MSAL
    this.authService.instance.clearCache();
    
    // Eliminar todas las cuentas de la sesión - método correcto
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0) {
      accounts.forEach(account => {
        this.authService.instance.logout({
          account: account,
          postLogoutRedirectUri: window.location.origin + '/#/login',
          onRedirectNavigate: () => false
        });
      });
    }
    
    // Navegar directamente a la página de login
    this.router.navigate(['/login']);
  }
}