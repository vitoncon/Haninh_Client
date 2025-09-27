import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../tokens/api-url.token';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const apiBaseUrl = inject(API_BASE_URL);
    const authService = inject(AuthService);

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
            // If 401 and we have a refresh token, try to refresh
            if (error.status === 401 && authService.getRefreshToken() && !req.url.includes('/auth/refresh')) {
                return authService.refreshAccessToken().pipe(
                    switchMap((newToken) => {
                        if (newToken) {
                            // Retry the original request with new token
                            const retryReq = updatedReq.clone({ 
                                setHeaders: { Authorization: `Bearer ${newToken}` } 
                            });
                            return next(retryReq);
                        } else {
                            // Refresh failed, redirect to login
                            window.location.href = '/auth/login';
                            return throwError(() => error);
                        }
                    }),
                    catchError(() => {
                        // Refresh failed, redirect to login
                        window.location.href = '/auth/login';
                        return throwError(() => error);
                    })
                );
            }
            
            return throwError(() => error);
        })
    );
};


