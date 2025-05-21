import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> | boolean {
  if (this.authService.isLoggedIn()) {
    console.log('用户已登录，允许访问');
    return true;
  }
  
  this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
  return false;
}
}
