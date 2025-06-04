import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'ds-visualizer';

  // 导航状态
  sidebarOpen = true;
  userMenuOpen = false;
  showNavigation = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // 监听路由变化，决定是否显示导航栏
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showNavigation = this.shouldShowNavigation(event.url);
      });

    // 初始化导航显示状态
    this.showNavigation = this.shouldShowNavigation(this.router.url);
  }

  private shouldShowNavigation(url: string): boolean {
    // 在登录和注册页面不显示导航栏
    return !url.includes('/login') && !url.includes('/register');
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    // 清除认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 关闭用户菜单
    this.userMenuOpen = false;

    // 跳转到登录页面
    this.router.navigate(['/login']);
  }
}
