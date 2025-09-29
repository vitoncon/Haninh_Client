import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule, DialogModule],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center" 
                 [class]="'login-container' + (isRedirected ? ' slide-up' : '')"
                 [style.animation]="isRedirected ? 'slideUp 0.8s ease-out' : 'fadeIn 0.5s ease-in'">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <p-toast />
                        <div class="text-center mb-8">
                            <img src="/img/logoHaNinh.ico" alt="HaNinh Academy" class="mb-8 w-16 h-16 shrink-0 mx-auto" />
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to HaNinh Academy</div>
                            <span class="text-muted-color font-medium">Đăng nhập để tiếp tục</span>
                        </div>

                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="text" placeholder="Nhập email" class="w-full md:w-120 mb-8" [(ngModel)]="email" (keydown.enter)="onEmailEnter($event)" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Mật khẩu</label>
                            <p-password inputId="password1" [(ngModel)]="password" placeholder="Mật khẩu" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox inputId="rememberme1" [(ngModel)]="checked" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">Ghi nhớ đăng nhập</label>

                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary" (click)="onForgotClick()">Quên mật khẩu?</span>
                            </div>
                            <p-button 
                                [label]="isLoading ? 'Đang xử lý...' : 'Đăng nhập'" 
                                styleClass="w-full" 
                                [loading]="isLoading"
                                [disabled]="isLoading"
                                (onClick)="onSignIn()">
                            </p-button>
                            <div *ngIf="isRedirected && !isLoading" class="text-orange-500 mt-4 text-center font-medium">
                                <i class="pi pi-exclamation-triangle mr-2"></i>
                                Vui lòng đăng nhập để truy cập trang này
                            </div>
                            <div *ngIf="errorMessage" class="text-red-500 mt-4 text-center">{{ errorMessage }}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div *ngIf="isLoading" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-surface-0 dark:bg-surface-800 p-6 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
                    <i class="pi pi-spin pi-spinner text-primary text-2xl"></i>
                    <span class="text-surface-900 dark:text-surface-0 font-medium">Đang đăng nhập...</span>
                </div>
            </div>
        </div>

        <!-- Quên mật khẩu Dialog -->
        <p-dialog 
            header="Quên mật khẩu" 
            [(visible)]="showForgot" 
            [modal]="true" 
            [closable]="true"
            [style]="{ width: '450px' }"
            [draggable]="false"
            [resizable]="false"
            (onHide)="resetForgotForm()">
            
            <div class="flex flex-col gap-4">
                <div class="text-surface-600 dark:text-surface-200 text-sm">
                    Nhập email và mật khẩu mới để cập nhật tài khoản của bạn.
                </div>
                
                <div class="flex flex-col gap-3">
                    <div>
                        <label for="forgot-email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Email</label>
                        <input id="forgot-email" name="forgotEmail" pInputText type="email" placeholder="Nhập email" [(ngModel)]="forgotEmail" class="w-full" />
                    </div>
                    
                    <div>
                        <label for="forgot-password1" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Mật khẩu mới</label>
                        <p-password inputId="forgot-password1" name="forgotPassword1" [(ngModel)]="forgotPassword1" placeholder="Mật khẩu mới" [toggleMask]="true" [feedback]="false" [fluid]="true"></p-password>
                    </div>
                    
                    <div>
                        <label for="forgot-password2" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Nhập lại mật khẩu</label>
                        <p-password inputId="forgot-password2" name="forgotPassword2" [(ngModel)]="forgotPassword2" placeholder="Nhập lại mật khẩu" [toggleMask]="true" [feedback]="false" [fluid]="true"></p-password>
                    </div>
                </div>

                <!-- Thông báo lỗi/thành công ngay trong popup -->
                <div *ngIf="forgotError" class="text-red-500 text-center mt-3 text-base font-medium">
                    {{ forgotError }}
                    </div>

                    <div *ngIf="forgotSuccess" class="text-green-600 text-center mt-3 text-base font-medium">
                    {{ forgotSuccess }}
                </div>
            </div>

            <ng-template pTemplate="footer">
               <div class="flex justify-end gap-3 w-full">
                    <p-button 
                        label="Hủy" 
                        severity="secondary" 
                        (onClick)="showForgot = false">
                    </p-button>

                    <p-button 
                        label="Xác nhận" 
                        [loading]="forgotLoading" 
                        (onClick)="onSubmitForgot()" 
                        styleClass="p-button-primary">
                    </p-button>
                </div>
            </ng-template>
        </p-dialog>

    `,
    styles: [`
        @keyframes slideUp {
            from {
                transform: translateY(100vh);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        .login-container {
            transition: all 0.3s ease;
        }
        
        .slide-up {
            animation: slideUp 0.8s ease-out;
        }
    `]
})
export class Login implements OnInit {
    email: string = '';

    password: string = '';

    checked: boolean = false;
    errorMessage: string | null = null;
    forgotError: string | null = null;
    forgotSuccess: string | null = null;
    isLoading: boolean = false;
    isRedirected: boolean = false;
    showForgot: boolean = false;
    forgotEmail: string = '';
    forgotPassword1: string = '';
    forgotPassword2: string = '';
    forgotLoading: boolean = false;

    constructor(private authService: AuthService, private router: Router, private messageService: MessageService, private route: ActivatedRoute) {}

    ngOnInit(): void {
        // Check if redirected from protected route
        this.route.queryParams.subscribe(params => {
            if (params['redirected'] === 'true') {
                this.isRedirected = true;
                this.isLoading = true;
                // Show loading effect for 1.2 seconds
                setTimeout(() => {
                    this.isLoading = false;
                    this.messageService.add({ 
                        severity: 'warn', 
                        summary: 'Yêu cầu đăng nhập', 
                        detail: 'Vui lòng đăng nhập để truy cập trang này' 
                    });
                }, 1500);
            }
        });
    }

    onSignIn(): void {
        this.isLoading = true;
        const email = (this.email || '').trim();
        const password = (this.password || '').trim();
    
        if (!email || !password) {
            this.isLoading = false;
            this.errorMessage = 'Vui lòng nhập đầy đủ email và mật khẩu';
            this.messageService.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập đầy đủ email và mật khẩu' });
            return;
        }
    
        // Remember me persistence mode
        this.authService.setRememberMe(this.checked);
    
        const payload = { email, password };
        this.authService.login(payload).subscribe({
            next: (res: any) => {
                this.isLoading = false;
    
                if (typeof res === 'string' && res === 'email is not verify') {
                    this.errorMessage = 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư.';
                    this.messageService.add({ severity: 'warn', summary: 'Email chưa xác thực', detail: 'Vui lòng xác thực email trước khi đăng nhập.' });
                    return;
                }

                this.errorMessage = null;
                // Auth service sẽ tự động điều hướng theo role
            },
            error: (err: any) => {
                this.isLoading = false;
              
                if (err.status === 0) {
                  // Lỗi mạng hoặc server chưa bật
                  this.errorMessage = 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau';
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Lỗi kết nối',
                    detail: 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau'
                  });
                } else if (err.status === 401 || err.status === 404) {
                  // Sai tài khoản hoặc mật khẩu
                  this.errorMessage = 'Không đúng tài khoản hoặc mật khẩu';
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Lỗi đăng nhập',
                    detail: 'Không đúng tài khoản hoặc mật khẩu'
                  });
                } else {
                  // Các lỗi còn lại (500, ...)
                  this.errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Lỗi hệ thống',
                    detail: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
                  });
                }
            }              
        });
    }

    onForgotClick(): void {
        this.showForgot = true;
        this.errorMessage = null;
        // Reset form when opening dialog
        this.forgotEmail = '';
        this.forgotPassword1 = '';
        this.forgotPassword2 = '';
    }

    onSubmitForgot(): void {
        const email = (this.forgotEmail || '').trim();
        const p1 = (this.forgotPassword1 || '').trim();
        const p2 = (this.forgotPassword2 || '').trim();
      
        this.forgotError = null;
        this.forgotSuccess = null;
      
        if (!email || !p1 || !p2) {
          this.forgotError = 'Vui lòng nhập đầy đủ email và mật khẩu mới';
          return;
        }
        if (p1 !== p2) {
          this.forgotError = 'Mật khẩu không khớp. Vui lòng nhập lại';
          return;
        }
      
        this.forgotLoading = true;
        this.authService.forgotPassword({ email, password: p1 }).subscribe({
          next: () => {
            this.forgotLoading = false;
            this.forgotSuccess = 'Cập nhật mật khẩu thành công';
            this.showForgot = false;
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật mật khẩu thành công'
                });
            },
            error: (err: any) => {
            this.forgotLoading = false;
                if (err.status === 0) {
                this.forgotError = 'Không thể kết nối tới máy chủ. Vui lòng thử lại sau';
                } else if (err.status === 401 || err.status === 404 || err.status === 500) {
                // Không tiết lộ thông tin chính xác
                this.forgotSuccess = 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu';
                } else {
                this.forgotError = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
                }
            }          
        });
    }
    
    onCancelForgot(): void {
        this.showForgot = false;
        this.resetForgotForm();
    }
      
    resetForgotForm(): void {
        this.forgotEmail = '';
        this.forgotPassword1 = '';
        this.forgotPassword2 = '';
        this.forgotError = null;
        this.forgotSuccess = null;
        this.forgotLoading = false;
    }
    
    onEmailEnter(event: any): void {
        event.preventDefault();
        // Focus on password field
        const passwordInput = document.querySelector('#password1 input') as HTMLInputElement;
        if (passwordInput) {
            passwordInput.focus();
        }
    }
}
