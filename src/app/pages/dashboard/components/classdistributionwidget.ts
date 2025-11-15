import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-class-distribution-widget',
    imports: [ChartModule],
    template: `<div class="card mb-8!" style="height: 500px; display: flex; flex-direction: column; overflow-y: auto;">
        <div class="font-semibold text-xl mb-4">Phân Bố Lớp Học Theo Khóa</div>
        <div class="relative" style="height: calc(100% - 3rem);">
            <p-chart type="doughnut" [data]="chartData" [options]="chartOptions" style="height: 100%; width: 100%;" />
        </div>
    </div>`
})
export class ClassDistributionWidget implements OnInit, OnDestroy {
    chartData: any = {
        labels: [],
        datasets: []
    };
    chartOptions: any;
    subscription!: Subscription;

    constructor(
        public layoutService: LayoutService,
        private dashboardService: DashboardService
    ) {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            this.initChart();
            // Force chart re-render when theme changes
            if (this.chartData && this.chartData.labels && this.chartData.labels.length > 0) {
                const currentData = { ...this.chartData };
                this.chartData = { labels: [], datasets: [] };
                setTimeout(() => {
                    this.chartData = currentData;
                }, 50);
            }
        });
    }

    ngOnInit() {
        this.loadDistributionData();
    }

    loadDistributionData() {
        this.dashboardService.getClassDistributionByCourse().subscribe({
            next: (data) => {
                this.chartData = data;
                this.initChart();
            },
            error: (err) => {
                console.error('Error loading distribution data:', err);
                this.initChart();
            }
        });
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#1f2937';
        const isDark = this.layoutService.isDarkTheme();

        this.chartOptions = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#f3f4f6' : '#1f2937', // Explicit color based on theme
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value} lớp`;
                        }
                    }
                }
            }
        };
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}

