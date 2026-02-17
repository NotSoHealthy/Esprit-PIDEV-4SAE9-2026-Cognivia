import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'NotSoHealthy';
  currentPath = '/';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentPath = event.urlAfterRedirects || event.url;
    });
  }

  get isRoleSelection(): boolean {
    return this.currentPath === '/' || this.currentPath === '';
  }

  get isAdminSection(): boolean {
    return this.currentPath.startsWith('/admin');
  }

  get isUserSection(): boolean {
    return this.currentPath.startsWith('/user') || this.currentPath.startsWith('/results');
  }
}
