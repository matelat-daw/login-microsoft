import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  isInitialized = false;

  constructor(
    private authService: MsalService,
    private router: Router
  ) {
    // Verificar si el usuario ya está autenticado
    if (this.authService.instance.getAllAccounts().length > 0) {
      this.router.navigate(['/welcome']);
    }
  }

  ngOnInit(): void {
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
    try {
      // Asegurarse de que MSAL esté inicializado
      if (!this.authService.instance.getConfiguration()) {
        await this.authService.instance.initialize();
      }
      
      // Iniciar sesión
      const result = await this.authService.loginPopup().toPromise();
      console.log(result);
      
      if (result) {
        this.authService.instance.setActiveAccount(result.account);
        this.router.navigate(['/welcome']);
      }
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
    }
  }
}