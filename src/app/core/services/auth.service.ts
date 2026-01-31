import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

    isAuthenticated(): boolean {
        return true;
    }

    login(_payload?: any) {
        // MOCK đăng nhập: user id = 1, role = 1 (admin)
        localStorage.setItem('user_id', '1');
        localStorage.setItem('user_role', '1');

        return of({
            user: {
                id: 1,
                roleId: 1,
                name: 'Admin DEV'
            },
            accessToken: 'dev-token'
        });
    }

    getAccessToken(): string | null {
        return 'dev-token';
    }

    getRefreshToken(): string | null {
        return 'dev-refresh-token';
    }

    refreshAccessToken() {
        return of('dev-token');
    }

    clearSession(): void {
        localStorage.clear();
    }
}
