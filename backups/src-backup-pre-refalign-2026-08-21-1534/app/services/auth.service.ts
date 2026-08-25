import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface AuthToken {
  token: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'rfid_auth_token';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());

  get isAuthenticated$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  get isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  constructor(private http: HttpClient, private router: Router) {}

  setLoggedIn(value: boolean): void {
    if (value) {
      const fakeToken: AuthToken = {
        token: 'local-admin-token',
        expiresAt: Date.now() + 86400000,
      };
      this.setToken(fakeToken);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
    this.loggedIn$.next(value);
  }

  login(userName: string, password: string): Observable<AuthToken> {
    return this.http
      .post<AuthToken>(`${environment.baseUrl}api/User/Login`, {
        userName,
        password,
      })
      .pipe(
        tap((res) => {
          this.setToken(res);
          this.loggedIn$.next(true);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const data = localStorage.getItem(this.tokenKey);
    if (!data) return null;
    try {
      const parsed: AuthToken = JSON.parse(data);
      if (parsed.expiresAt < Date.now()) {
        this.logout();
        return null;
      }
      return parsed.token;
    } catch {
      this.logout();
      return null;
    }
  }

  private setToken(auth: AuthToken): void {
    localStorage.setItem(this.tokenKey, JSON.stringify(auth));
  }

  private hasValidToken(): boolean {
    return this.getToken() !== null;
  }
}
