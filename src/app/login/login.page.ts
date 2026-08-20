import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  userName = '';
  password = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastController
  ) {}

  async login(): Promise<void> {
    if (!this.userName || !this.password) {
      this.showToast('Please enter username and password');
      return;
    }

    this.loading = true;
    this.auth.login(this.userName, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.showToast('Invalid credentials');
      },
    });
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'danger',
    });
    t.present();
  }
}
