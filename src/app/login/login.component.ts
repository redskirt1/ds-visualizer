import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // 添加这行

import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient  // 添加 HTTP 客户端
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // 初始化逻辑
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const requestData = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    // 发送 POST 请求到后端登录接口
    this.http.post('/login', requestData).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
        localStorage.setItem('currentUser', JSON.stringify({ username: requestData.username }));
        console.log('登录成功:', requestData.username);
        this.authService.flashLogin();
        this.router.navigate(['/home']);
        }
        else {
            alert(response.message || '登录失败');
        }
      },
      error: (error) => {
        this.errorMessage = '登录失败：' + (error.error?.message || '未知错误');
      this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
  }
    });
}
}