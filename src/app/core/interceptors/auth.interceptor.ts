import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../tokens/api-url.token';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const apiBaseUrl = inject(API_BASE_URL);
    const authService = inject(AuthService);

    let updatedReq = req;

    // Prefix base URL for relative API calls
    if (!/^https?:\/\//i.test(req.url)) {
        updatedReq = updatedReq.clone({
            url: apiBaseUrl.replace(/\/$/, '') + '/' + req.url.replace(/^\//, '')
        });
    }

    // MOCK TOKEN (không hết hạn)
    const token = authService.getAccessToken?.() ?? 'mock-admin-token';

    updatedReq = updatedReq.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    // ❌ KHÔNG bắt lỗi
    // ❌ KHÔNG refresh token
    // ❌ KHÔNG redirect login
    return next(updatedReq);
};
