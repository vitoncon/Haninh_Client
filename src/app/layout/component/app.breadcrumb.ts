import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [Breadcrumb],
    template: `
        <div class="layout-breadcrumb-container">
            <p-breadcrumb [model]="items" [home]="home"></p-breadcrumb>
        </div>
    `
})
export class AppBreadcrumb {
    items: MenuItem[] = [];
    home: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };

    constructor(private router: Router, private route: ActivatedRoute) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.items = this.createBreadcrumbs(this.route.root);
            });
    }

    createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: MenuItem[] = []): MenuItem[] {
        const children: ActivatedRoute[] = route.children;
    
        for (let child of children) {
            const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
            if (routeURL) {
                url += `/${routeURL}`;
            }
    
            const breadcrumbLabel = child.snapshot.data['breadcrumb'];
            if (breadcrumbLabel) {
                // Xử lý logic đặc biệt cho các route detail
                const routePath = child.snapshot.routeConfig?.path || '';
                
                if (routePath.includes('class/detail')) {
                    // Thêm breadcrumb cho "Quản lý lớp học" trước "Chi tiết lớp học"
                    const classManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý lớp học');
                    if (!classManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý lớp học',
                            routerLink: '/features/class'
                        });
                    }
                } else if (routePath.includes('courses/detail')) {
                    // Thêm breadcrumb cho "Quản lý khóa học" trước "Chi tiết khóa học"
                    const courseManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý khóa học');
                    if (!courseManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý khóa học',
                            routerLink: '/features/courses'
                        });
                    }
                } else if (routePath.includes('teacher/detail')) {
                    // Thêm breadcrumb cho "Quản lý giảng viên" trước "Chi tiết giảng viên"
                    const teacherManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý giảng viên');
                    if (!teacherManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý giảng viên',
                            routerLink: '/features/teacher'
                        });
                    }
                } else if (routePath.includes('students/detail')) {
                    // Thêm breadcrumb cho "Quản lý học viên" trước "Chi tiết học viên"
                    const studentManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý học viên');
                    if (!studentManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý học viên',
                            routerLink: '/features/students'
                        });
                    }
                } else if (routePath.includes('fees/detail')) {
                    // Thêm breadcrumb cho "Quản lý học phí" trước "Chi tiết học phí"
                    const feesManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý học phí');
                    if (!feesManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý học phí',
                            routerLink: '/features/fees'
                        });
                    }
                } else if (routePath.includes('class/:id/schedule')) {
                    // Thêm breadcrumb cho "Quản lý lớp học" và "Chi tiết lớp học" trước "Lịch học lớp"
                    const classManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý lớp học');
                    if (!classManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý lớp học',
                            routerLink: '/features/class'
                        });
                    }
                    const classDetailBreadcrumb = breadcrumbs.find(b => b.label === 'Chi tiết lớp học');
                    if (!classDetailBreadcrumb) {
                        // Extract class ID from URL
                        const classId = child.snapshot.params['id'];
                        breadcrumbs.push({
                            label: 'Chi tiết lớp học',
                            routerLink: `/features/class/detail/${classId}`
                        });
                    }
                } else if (routePath.includes('class/:id/study-results')) {
                    // Thêm breadcrumb cho "Quản lý lớp học" và "Chi tiết lớp học" trước "Kết quả học tập lớp"
                    const classManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý lớp học');
                    if (!classManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý lớp học',
                            routerLink: '/features/class'
                        });
                    }
                    const classDetailBreadcrumb = breadcrumbs.find(b => b.label === 'Chi tiết lớp học');
                    if (!classDetailBreadcrumb) {
                        // Extract class ID from URL
                        const classId = child.snapshot.params['id'];
                        breadcrumbs.push({
                            label: 'Chi tiết lớp học',
                            routerLink: `/features/class/detail/${classId}`
                        });
                    }
                } else if (routePath.includes('study-result/:examId')) {
                    // Thêm breadcrumb cho "Quản lý lớp học", "Chi tiết lớp học", và "Kết quả học tập lớp" trước "Chi tiết bài kiểm tra"
                    const classManagementBreadcrumb = breadcrumbs.find(b => b.label === 'Quản lý lớp học');
                    if (!classManagementBreadcrumb) {
                        breadcrumbs.push({
                            label: 'Quản lý lớp học',
                            routerLink: '/features/class'
                        });
                    }
                    const classDetailBreadcrumb = breadcrumbs.find(b => b.label === 'Chi tiết lớp học');
                    if (!classDetailBreadcrumb) {
                        // Extract class ID from URL
                        const classId = child.snapshot.params['id'];
                        breadcrumbs.push({
                            label: 'Chi tiết lớp học',
                            routerLink: `/features/class/detail/${classId}`
                        });
                    }
                    const studyResultsBreadcrumb = breadcrumbs.find(b => b.label === 'Kết quả học tập lớp');
                    if (!studyResultsBreadcrumb) {
                        // Extract class ID from URL
                        const classId = child.snapshot.params['id'];
                        breadcrumbs.push({
                            label: 'Kết quả học tập lớp',
                            routerLink: `/features/class/${classId}/study-results`
                        });
                    }
                }
                
                breadcrumbs.push({
                    label: breadcrumbLabel,
                    routerLink: url
                });
            }
    
            // Đệ quy tiếp cho cây con
            return this.createBreadcrumbs(child, url, breadcrumbs);
        }
    
        return breadcrumbs;
    }    
}