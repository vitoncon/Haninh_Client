import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../tokens/api-url.token';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const apiBaseUrl = inject(API_BASE_URL);
    const authService = inject(AuthService);
    const messageService = inject(MessageService);

    let updatedReq = req;

    // Prefix base URL for relative API calls
    if (!/^https?:\/\//i.test(req.url)) {
        updatedReq = updatedReq.clone({ url: apiBaseUrl.replace(/\/$/, '') + '/' + req.url.replace(/^\//, '') });
    }

    const token = authService.getAccessToken();
    if (token) {
        updatedReq = updatedReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next(updatedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Handle 401 errors
            if (error.status === 401) {
                const errorMessage = typeof error.error === 'string' ? error.error : '';
                
                // If token is expired, show message and redirect directly
                if (errorMessage === 'access token expired') {
                    messageService.add({
                        severity: 'warn',
                        summary: 'Phiên đăng nhập hết hạn',
                        detail: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
                        life: 5000
                    });
                    
                    // Clear session and redirect to login
                    authService.clearSession();
                    
                    // Small delay to show the message before redirect
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 1000);
                    
                    return throwError(() => error);
                }
                
                // If we have a refresh token and it's not an expired token error, try to refresh
                if (authService.getRefreshToken() && !req.url.includes('/auth/refresh')) {
                    return authService.refreshAccessToken().pipe(
                        switchMap((newToken) => {
                            if (newToken) {
                                // Retry the original request with new token
                                const retryReq = updatedReq.clone({ 
                                    setHeaders: { Authorization: `Bearer ${newToken}` } 
                                });
                                return next(retryReq);
                            } else {
                                // Refresh failed, show message and redirect to login
                                messageService.add({
                                    severity: 'warn',
                                    summary: 'Phiên đăng nhập hết hạn',
                                    detail: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
                                    life: 5000
                                });
                                authService.clearSession();
                                setTimeout(() => {
                                    window.location.href = '/auth/login';
                                }, 1000);
                                return throwError(() => error);
                            }
                        }),
                        catchError(() => {
                            // Refresh failed, show message and redirect to login
                            messageService.add({
                                severity: 'warn',
                                summary: 'Phiên đăng nhập hết hạn',
                                detail: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
                                life: 5000
                            });
                            authService.clearSession();
                            setTimeout(() => {
                                window.location.href = '/auth/login';
                            }, 1000);
                            return throwError(() => error);
                        })
                    );
                } else {
                    // No refresh token available or other 401 error, show message and redirect
                    messageService.add({
                        severity: 'error',
                        summary: 'Lỗi xác thực',
                        detail: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
                        life: 5000
                    });
                    authService.clearSession();
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 1000);
                    return throwError(() => error);
                }
            }
            
            return throwError(() => error);
        })
    );
};


