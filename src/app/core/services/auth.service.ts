import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { PermissionService, Permission } from './permission.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

    // ===== MOCK USER =====
    private readonly mockUser = {
        id: 1,
        role: 1, // ADMIN
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
    };

    constructor(
        private router: Router,
        private permissionService: PermissionService
    ) {
        // Tự động mock đăng nhập khi app khởi động
        this.bootstrapMockLogin();
    }

    // ================== CORE ==================

    private bootstrapMockLogin(): void {
        // Lưu token giả
        localStorage.setItem('access_token', this.mockUser.accessToken);
        localStorage.setItem('refresh_token', this.mockUser.refreshToken);
        localStorage.setItem('user_role', String(this.mockUser.role));

        // Set permission theo role admin
        this.permissionService.setRolePermissions(1);
    }

    isAuthenticated(): boolean {
        return true; // LUÔN COI LÀ ĐÃ ĐĂNG NHẬP
    }

    // ================== ROLE ==================

    getRole(): number {
        return 1; // ADMIN
    }

    getRoles(): number[] {
        return [1];
    }

    setRole(role: number): void {
        // no-op (mock)
    }

    // ================== TOKEN ==================

    getAccessToken(): string {
        return this.mockUser.accessToken;
    }

    setAccessToken(token: string): void {
        // no-op
    }

    getRefreshToken(): string {
        return this.mockUser.refreshToken;
    }

    setRefreshToken(token: string): void {
        // no-op
    }

    refreshAccessToken(): Observable<string> {
        return of(this.mockUser.accessToken);
    }

    // ================== AUTH ACTIONS ==================

    login(_: { email: string; password: string }): Observable<any> {
        // KHÔNG GỌI API – GIẢ LẬP LOGIN THÀNH CÔNG
        this.router.navigate(['/dashboard']);
        return of({
            accessToken: this.mockUser.accessToken,
            refreshToken: this.mockUser.refreshToken,
            permissions: [] as Permission[]
        });
    }

    logout(): void {
        this.clearSession();
        this.router.navigate(['/auth/login']);
    }

    clearSession(): void {
        localStorage.clear();
        sessionStorage.clear();
        this.permissionService.clearPermissions();
    }

    forgotPassword(): Observable<any> {
        return of(true);
    }
}
