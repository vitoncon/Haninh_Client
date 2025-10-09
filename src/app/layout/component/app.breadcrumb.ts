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