import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'login-microsoft';
  
  constructor(private msalService: MsalService) {}

  ngOnInit(): void {
    // Inicializar MSAL
    this.msalService.instance.initialize().then(() => {
      console.log('MSAL inicializado correctamente');
    }).catch(error => {
      console.error('Error al inicializar MSAL:', error);
    });
  }
}