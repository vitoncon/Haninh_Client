import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { ClassDistributionWidget } from './components/classdistributionwidget';
import { PaymentStatusWidget } from './components/paymentstatuswidget';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        ToastModule,
        StatsWidget,
        RecentSalesWidget,
        BestSellingWidget,
        RevenueStreamWidget,
        NotificationsWidget,
        ClassDistributionWidget,
        PaymentStatusWidget
    ],
   
    template: `
        <div class="grid grid-cols-12 gap-6">

            <!-- Statistics Cards -->
            <app-stats-widget class="contents" />
            
            <!-- Charts Row 1 -->
            <div class="col-span-12 xl:col-span-8">
                <app-revenue-stream-widget />
            </div>
            <div class="col-span-12 xl:col-span-4">
                <app-payment-status-widget />
            </div>

            <!-- Charts Row 2 -->
            <div class="col-span-12 xl:col-span-6">
                <app-class-distribution-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-notifications-widget />
            </div>

            <!-- Tables Row -->
            <div class="col-span-12 xl:col-span-6">
                <app-recent-sales-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-best-selling-widget />
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
            detail: 'Chào mừng đến với Hà Ninh Academy!'
          });
          history.replaceState({}, '');
        }
    }
}