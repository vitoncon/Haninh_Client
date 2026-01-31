import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private mockUser = {
    id: 1,
    roles: [1], // admin
    permissions: ['*']
  };

  isAuthenticated(): boolean {
    return true; // LUÔN ĐĂNG NHẬP
  }

  getUser() {
    return this.mockUser;
  }

  getUserId(): number {
    return 1;
  }

  getRoles(): number[] {
    return [1];
  }

  getPermissions(): string[] {
    return ['*'];
  }

  login() {
    return of(true);
  }

  logout() {
    // KHÔNG LÀM GÌ
  }

  refreshToken() {
    return of(true);
  }

  // ===== login page support =====
  setRememberMe(_: boolean) {}

  forgotPassword(_: any) {
    return of(true);
  }
}
