import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SocketService } from './app/core/services/socket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <router-outlet></router-outlet>
        <p-toast [life]="10000"></p-toast>`
})
export class AppComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    constructor(
        private socketService: SocketService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.socketService.onNewLead()
            .pipe(takeUntil(this.destroy$))
            .subscribe(lead => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Khách hàng mới!',
                    detail: `${lead.fullname} vừa đăng ký tư vấn.`,
                });
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
