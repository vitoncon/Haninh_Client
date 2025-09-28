import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { PermissionService } from '../../core/services/permission.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(private permissionService: PermissionService) {}

    ngOnInit() {
        const allMenuItems = [
            {
                label: 'Home',
                items: [{ 
                    label: 'Dashboard', 
                    icon: 'pi pi-fw pi-home', 
                    routerLink: ['/dashboard'],
                    permissions: [PermissionService.PERMISSIONS.DASHBOARD_VIEW]
                }]
            },
            {
                label: 'KHÓA HỌC & LỚP HỌC',
                items: [
                    { 
                        label: 'Quản lý khóa học', 
                        icon: 'pi pi-fw pi-graduation-cap', 
                        routerLink: ['/features/courses'],
                        permissions: [PermissionService.PERMISSIONS.COURSES_VIEW]
                    },
                    { 
                        label: 'Quản lý lớp học', 
                        icon: 'pi pi-fw pi-users', 
                        routerLink: ['/features/class'],
                        permissions: [PermissionService.PERMISSIONS.CLASS_VIEW]
                    },
                    { 
                        label: 'Lịch học', 
                        icon: 'pi pi-fw pi-calendar', 
                        routerLink: ['/features/schedule'],
                        permissions: [PermissionService.PERMISSIONS.SCHEDULE_VIEW]
                    },
                ]
            },
            {
                label: 'HỌC VIÊN',
                items: [
                    { 
                        label: 'Quản lý học viên', 
                        icon: 'pi pi-fw pi-user', 
                        routerLink: ['/features/students'],
                        permissions: [PermissionService.PERMISSIONS.STUDENTS_VIEW]
                    },
                    { 
                        label: 'Kết quả học tập', 
                        icon: 'pi pi-fw pi-chart-bar', 
                        routerLink: ['/features/study-results'],
                        permissions: [PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW]
                    },
                    { 
                        label: 'Chứng chỉ', 
                        icon: 'pi pi-fw pi-crown', 
                        routerLink: ['/features/certificates'],
                        permissions: [PermissionService.PERMISSIONS.CERTIFICATES_VIEW]
                    },
                ]
            },
            {
                label: 'GIẢNG VIÊN',
                items: [
                    { 
                        label: 'Quản lý giảng viên', 
                        icon: 'pi pi-fw pi-credit-card', 
                        routerLink: ['/features/teacher'],
                        permissions: [PermissionService.PERMISSIONS.TEACHER_VIEW]
                    },
                    { 
                        label: 'Phân công giảng dạy', 
                        icon: 'pi pi-fw pi-sitemap', 
                        routerLink: ['/features/teaching-assignments'],
                        permissions: [PermissionService.PERMISSIONS.TEACHING_ASSIGNMENTS_VIEW]
                    },
                ]
            },
            {
                label: 'TÀI CHÍNH',
                items: [
                    { 
                        label: 'Quản lý học phí', 
                        icon: 'pi pi-fw pi-wallet', 
                        routerLink: ['/features/fees'],
                        permissions: [PermissionService.PERMISSIONS.FEES_VIEW]
                    },
                ]
            },
        ];
        
            // duoi 
            // {
            //     label: 'Pages',
            //     icon: 'pi pi-fw pi-briefcase',
            //     routerLink: ['/pages'],
            //     items: [
            //         {
            //             label: 'Landing',
            //             icon: 'pi pi-fw pi-globe',
            //             routerLink: ['/landing']
            //         },
            //         {
            //             label: 'Auth',
            //             icon: 'pi pi-fw pi-user',
            //             items: [
            //                 {
            //                     label: 'Login',
            //                     icon: 'pi pi-fw pi-sign-in',
            //                     routerLink: ['/auth/login']
            //                 },
            //                 {
            //                     label: 'Error',
            //                     icon: 'pi pi-fw pi-times-circle',
            //                     routerLink: ['/auth/error']
            //                 },
            //                 {
            //                     label: 'Access Denied',
            //                     icon: 'pi pi-fw pi-lock',
            //                     routerLink: ['/auth/access']
            //                 }
            //             ]
            //         },
            //         {
            //             label: 'Crud',
            //             icon: 'pi pi-fw pi-pencil',
            //             routerLink: ['/pages/crud']
            //         },
            //         {
            //             label: 'Not Found',
            //             icon: 'pi pi-fw pi-exclamation-circle',
            //             routerLink: ['/pages/notfound']
            //         },
            //         {
            //             label: 'Empty',
            //             icon: 'pi pi-fw pi-circle-off',
            //             routerLink: ['/pages/empty']
            //         }
            //     ]
            // },
            // {
            //     label: 'Hierarchy',
            //     items: [
            //         {
            //             label: 'Submenu 1',
            //             icon: 'pi pi-fw pi-bookmark',
            //             items: [
            //                 {
            //                     label: 'Submenu 1.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [
            //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 1.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         },
            //         {
            //             label: 'Submenu 2',
            //             icon: 'pi pi-fw pi-bookmark',
            //             items: [
            //                 {
            //                     label: 'Submenu 2.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [
            //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 2.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         }
            //     ]
            // },
            // {
            //     label: 'Get Started',
            //     items: [
            //         {
            //             label: 'Documentation',
            //             icon: 'pi pi-fw pi-book',
            //             routerLink: ['/documentation']
            //         },
            //         {
            //             label: 'View Source',
            //             icon: 'pi pi-fw pi-github',
            //             url: 'https://github.com/primefaces/sakai-ng',
            //             target: '_blank'
            //         }
            //     ]
            // }

        // Filter menu items based on user permissions
        this.model = this.permissionService.getFilteredMenuItems(allMenuItems);
    }
}
