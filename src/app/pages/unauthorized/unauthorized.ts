import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    imports: [RouterModule, AppFloatingConfigurator, ButtonModule],
    template: ` <app-floating-configurator />
        <div class="flex items-center justify-center min-h-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center" 
                 [class]="'error-container' + (isRedirected ? ' slide-up' : '')"
                 [style.animation]="isRedirected ? 'slideUp 0.8s ease-out' : 'fadeIn 0.5s ease-in'">
                <img src="/img/logoHaNinh.ico" alt="HaNinh Academy" class="mb-8 w-16 h-16 shrink-0" />
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color), transparent 60%) 10%, var(--surface-ground) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                        <span class="text-primary font-bold text-3xl">403</span>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-5xl mb-2">Unauthorized</h1>
                        <div class="text-surface-600 dark:text-surface-200 mb-8 text-center">
                            Rất tiếc, bạn không có quyền truy cập vào trang này.<br />
                            Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên.
                        </div>
                        <p-button label="Quay lại đăng nhập" routerLink="/" />
                    </div>
                </div>
            </div>
        </div>`,
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
        
        .error-container {
            transition: all 0.3s ease;
        }
        
        .slide-up {
            animation: slideUp 0.8s ease-out;
        }
    `]
})
export class Unauthorized implements OnInit {
    isRedirected: boolean = false;

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['redirected'] === 'true') {
                this.isRedirected = true;
            }
        });
    }
}


