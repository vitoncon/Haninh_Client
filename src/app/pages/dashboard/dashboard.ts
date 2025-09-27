import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        ToastModule,
        StatsWidget,
        RecentSalesWidget,
        BestSellingWidget,
        RevenueStreamWidget,
        NotificationsWidget
    ],
   
    template: `
        <div class="grid grid-cols-12 gap-8">
            <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <app-recent-sales-widget />
                <app-best-selling-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-revenue-stream-widget />
                <app-notifications-widget />
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        const navState = history.state;
    
        if (navState?.loginSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: 'Đăng nhập thành công',
            detail: 'Chào mừng Admin!'
          });
          history.replaceState({}, '');
        }
    }
}