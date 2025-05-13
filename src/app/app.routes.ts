import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { WelcomeComponent } from './welcome/welcome.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'welcome', component: WelcomeComponent },
  // Agregar una ruta para capturar la redirección de Microsoft
  { path: 'code', component: LoginComponent },
  // Ruta comodín para capturar cualquier URL no definida y redirigir a login
  { path: '**', redirectTo: '/login' }
];