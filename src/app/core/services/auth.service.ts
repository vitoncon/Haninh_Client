import { of } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {

    /* ================== ĐÃ CÓ ================== */

    isAuthenticated(): boolean {
        return true;
    }

    login(_payload?: any) {
        localStorage.setItem('user_id', '1');
        localStorage.setItem('user_role', '1'); // admin

        return of({
            user: { id: 1, roleId: 1, name: 'Admin DEV' },
            accessToken: 'dev-token'
        });
    }

    /* ================== THÊM MỚI ================== */

    // ✅ FIX LỖI setRememberMe
    setRememberMe(_remember: boolean): void {
        // DEV MODE: không cần xử lý gì
    }

    // ✅ FIX LỖI forgotPassword
    forgotPassword(_payload: { email: string; password: string }) {
        // giả lập thành công
        return of(true);
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
    getRole(): number | null {
    const role = localStorage.getItem('user_role');
    return role ? Number(role) : null;
}

}
