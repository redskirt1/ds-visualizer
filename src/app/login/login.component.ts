import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


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
    private router: Router
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

    // 模拟登录请求
    setTimeout(() => {
      // 这里应该是实际的API调用
      const { username, password } = this.loginForm.value;
      
      if (username && password && username.length > 0 && password.length > 0) {
        localStorage.setItem('currentUser', JSON.stringify({ username }));
        console.log('登录成功:', username);
        // 登录成功
        this.router.navigate(['/home']);
      } else {
        // 登录失败
        this.errorMessage = '用户名或密码错误';
      }
      
      this.isSubmitting = false;
    }, 1000);
  }
}