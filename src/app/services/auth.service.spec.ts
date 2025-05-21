import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    
    // 清除localStorage
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return true from isLoggedIn when there is a token', () => {
    localStorage.setItem('auth_token', 'test-token');
    expect(service.isLoggedIn()).toBeTruthy();
  });

  it('should return false from isLoggedIn when there is no token', () => {
    expect(service.isLoggedIn()).toBeFalsy();
  });

  it('should remove token and user from localStorage on logout', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('current_user', JSON.stringify({ id: 1, username: 'test' }));
    
    service.logout();
    
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
  });
});
