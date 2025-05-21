import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl = 'https://api.example.com'; // 可以替换为实际API地址
  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }
  public flashLogin(): any {
    // 检查是否有用户信息
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  }

  private getUserFromStorage(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  login(username: string, password: string): Promise<boolean> {
    // 简化版本：直接使用模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        // 这里不再比较具体的用户名和密码
        // 而是假设任何非空的用户名和密码都有效
        if (username && password && username.length > 0 && password.length > 0) {
          const user = { username };
          const token = 'jwt-token-' + Math.random().toString(36).substring(2);

          // 存储用户详细信息和jwt令牌
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('token', token);

          // 通知所有订阅者
          this.currentUserSubject.next(user);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  }

  logout(): void {
    // 移除用户信息
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
