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
    home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

    constructor(private router: Router, private route: ActivatedRoute) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.items = this.createBreadcrumbs(this.route.root);
            });
    }

    createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: MenuItem[] = []): MenuItem[] {
        const children: ActivatedRoute[] = route.children;

        if (children.length === 0) {
            return breadcrumbs;
        }

        for (let child of children) {
            const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
            if (routeURL !== '') {
                url += `/${routeURL}`;
            }

            if (child.snapshot.data['breadcrumb']) {
                breadcrumbs.push({
                    label: child.snapshot.data['breadcrumb'],
                    routerLink: url
                });
            }

            return this.createBreadcrumbs(child, url, breadcrumbs);
        }
        return breadcrumbs;
    }
}
