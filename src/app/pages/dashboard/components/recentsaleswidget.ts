import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-recent-sales-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule, MenuModule],
    styles: [`
        ::ng-deep .p-datatable-tbody > tr {
            transition: background-color 0.15s ease-in-out;
        }
        
        ::ng-deep .p-datatable-tbody > tr:nth-child(odd) {
            background: #ffffff !important;
        }
        
        ::ng-deep .p-datatable-tbody > tr:nth-child(odd):hover {
            background: #f8fafc !important;
        }
        
        ::ng-deep .p-datatable-tbody > tr:nth-child(even) {
            background: #f8fafc !important;
        }
        
        ::ng-deep .p-datatable-tbody > tr:nth-child(even):hover {
            background: #f1f5f9 !important;
        }
        
        // Dark mode
        :host-context(.app-dark) ::ng-deep .p-datatable-tbody > tr:nth-child(odd) {
            background: #1a1a1a !important;
        }
        
        :host-context(.app-dark) ::ng-deep .p-datatable-tbody > tr:nth-child(odd):hover {
            background: #2a2a2a !important;
        }
        
        :host-context(.app-dark) ::ng-deep .p-datatable-tbody > tr:nth-child(even) {
            background: #222222 !important;
        }
        
        :host-context(.app-dark) ::ng-deep .p-datatable-tbody > tr:nth-child(even):hover {
            background: #333333 !important;
        }

        ::ng-deep .p-menu-item a .pi {
            color: var(--primary-color) !important;
        }
        ::ng-deep .p-menu-item:has(.pi-refresh) a .pi {
            color: #3B82F6 !important;
        }
        ::ng-deep .p-menu-item:has(.pi-eye) a .pi {
            color: var(--primary-color) !important;
        }
    `],
    template: `<div class="card mb-8!">
        <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-xl">Học Viên Mới Đăng Ký</div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" style="color: var(--primary-color);" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>
        <p-table #dt [value]="students" [paginator]="true" [rows]="5" responsiveLayout="scroll">
            <ng-template #header>
                <tr>
                    <th>Mã HV</th>
                    <th pSortableColumn="full_name">Họ và Tên <p-sortIcon field="full_name"></p-sortIcon></th>
                    <th pSortableColumn="email">Email <p-sortIcon field="email"></p-sortIcon></th>
                    <th>Trạng Thái</th>
                </tr>
            </ng-template>
            <ng-template #body let-student>
                <tr>
                    <td style="width: 15%; min-width: 7rem;">
                        {{ student.student_code || 'N/A' }}
                    </td>
                    <td style="width: 35%; min-width: 10rem;">{{ student.full_name }}</td>
                    <td style="width: 35%; min-width: 10rem;">{{ student.email || 'N/A' }}</td>
                    <td style="width: 15%;">
                        <span class="text-green-500 font-medium">Hoạt động</span>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>`
})
export class RecentSalesWidget implements OnInit {
    @ViewChild('dt') table!: Table;
    
    students: any[] = [];
    items: any[] = [];
    loading: boolean = false;

    constructor(
        private dashboardService: DashboardService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadRecentStudents();
        this.setupMenuItems();
    }

    setupMenuItems() {
        this.items = [
            {
                label: 'Làm mới',
                icon: 'pi pi-refresh',
                command: () => this.refreshData()
            },
            {
                label: 'Xem tất cả học viên',
                icon: 'pi pi-eye',
                command: () => this.viewAllStudents()
            }
        ];
    }

    refreshData() {
        this.loading = true;
        this.students = [];
        this.cdr.detectChanges();
        
        if (this.table) {
            this.table.reset();
        }
        
        this.loadRecentStudents();
    }

    viewAllStudents() {
        this.router.navigate(['/features/students']);
    }

    loadRecentStudents() {
        this.dashboardService.getRecentStudents().subscribe({
            next: (data) => {
                this.students = data || [];
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading recent students:', err);
                this.students = [];
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
