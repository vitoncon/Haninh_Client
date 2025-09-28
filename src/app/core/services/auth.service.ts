import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap, catchError } from 'rxjs';
import { PermissionService, Permission } from './permission.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly accessTokenKey = 'access_token';
    private readonly refreshTokenKey = 'refresh_token';
    private readonly roleKey = 'user_role';
    private readonly rememberKey = 'remember_me';

    constructor(
        private httpClient: HttpClient, 
        private router: Router,
        private permissionService: PermissionService
    ) {}

    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        return typeof token === 'string' && token.trim().length > 0;
    }

    private getStorage(): Storage {
        try {
            const remember = localStorage.getItem(this.rememberKey);
            return remember === 'true' ? localStorage : sessionStorage;
        } catch {
            return localStorage;
        }
    }

    setRememberMe(remember: boolean): void {
        try {
            localStorage.setItem(this.rememberKey, remember ? 'true' : 'false');
        } catch {
            // no-op
        }
    }

    getAccessToken(): string | null {
        try {
            // Prefer current storage mode, fallback to the other
            const storage = this.getStorage();
            return storage.getItem(this.accessTokenKey) ?? (storage === localStorage ? sessionStorage.getItem(this.accessTokenKey) : localStorage.getItem(this.accessTokenKey));
        } catch {
            return null;
        }
    }

    setAccessToken(token: string): void {
        try {
            const storage = this.getStorage();
            storage.setItem(this.accessTokenKey, token);
        } catch {
            // no-op
        }
    }

    getRefreshToken(): string | null {
        try {
            const storage = this.getStorage();
            return storage.getItem(this.refreshTokenKey) ?? (storage === localStorage ? sessionStorage.getItem(this.refreshTokenKey) : localStorage.getItem(this.refreshTokenKey));
        } catch {
            return null;
        }
    }

    setRefreshToken(token: string): void {
        try {
            const storage = this.getStorage();
            storage.setItem(this.refreshTokenKey, token);
        } catch {
            // no-op
        }
    }

    clearSession(): void {
        try {
            localStorage.removeItem(this.accessTokenKey);
            localStorage.removeItem(this.refreshTokenKey);
            localStorage.removeItem(this.roleKey);
            sessionStorage.removeItem(this.accessTokenKey);
            sessionStorage.removeItem(this.refreshTokenKey);
            sessionStorage.removeItem(this.roleKey);
            // Clear permissions
            this.permissionService.clearPermissions();
        } catch {
            // no-op
        }
    }

    setRole(role: number): void {
        try {
            localStorage.setItem(this.roleKey, String(role));
        } catch {
            // no-op
        }
    }

    getRole(): number | null {
        try {
            const raw = localStorage.getItem(this.roleKey);
            if (raw != null) return Number(raw);
            // fallback: derive from token
            const roles = this.getRoles();
            return roles.length > 0 ? roles[0] : null;
        } catch {
            return null;
        }
    }

    getRoles(): number[] {
        const token = this.getAccessToken();
        if (!token) return [];
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return [];
            const payload = JSON.parse(atob(parts[1]));
            const roles = Array.isArray(payload?.roles) ? payload.roles : [];
            return roles.filter((r: any) => typeof r === 'number');
        } catch {
            return [];
        }
    }

    login(payload: { email: string; password: string }): Observable<{ accessToken: string; refreshToken: string; permissions?: Permission[] } | string> {
        return this.httpClient
            .post<{ accessToken: string; refreshToken: string; permissions?: Permission[] } | string>('\/api\/auth\/login', payload)
            .pipe(
                tap((res) => {
                    if (typeof res !== 'string') {
                        this.setAccessToken(res.accessToken);
                        this.setRefreshToken(res.refreshToken);
                        const roles = this.getRoles();
                        if (roles.length > 0) {
                            this.setRole(roles[0]);
                            
                            // Lưu permissions từ BE nếu có
                            if (res.permissions && res.permissions.length > 0) {
                                this.permissionService.setPermissions(res.permissions);
                            } else {
                                // Fallback: sử dụng permissions mặc định theo role
                                this.permissionService.setRolePermissions(roles[0]);
                            }
                            
                            // Điều hướng theo role
                            const roleId = roles[0];
                            if (roleId === 1) {
                                this.router.navigate(['/dashboard']);
                            } else if (roleId === 2) {
                                this.router.navigate(['/dashboard']);
                            } else if (roleId === 3) {
                                this.router.navigate(['/features/schedule']);
                            } else {
                                this.router.navigate(['/unauthorized']);
                            }                            
                        }
                    }
                }),
                map((res) => res)
            );
    }

    forgotPassword(payload: { email: string; password: string }): Observable<any> {
        return this.httpClient.post('/api/auth/forgot-password', payload);
    }

    refreshAccessToken(): Observable<string | null> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return new Observable(observer => observer.next(null));
        }

        return this.httpClient.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken }).pipe(
            map(res => {
                this.setAccessToken(res.accessToken);
                return res.accessToken;
            }),
            catchError(() => {
                this.clearSession();
                return new Observable<string | null>(observer => observer.next(null));
            })
        );
    }
}


