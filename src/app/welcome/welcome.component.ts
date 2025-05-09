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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}