import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // 添加这行

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient  // 添加 HTTP 客户端
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator.bind(this) });  // 添加 bind(this)
  }

  ngOnInit(): void {
    // 初始化逻辑
  }

  // 两次密码一致
  passwordMatchValidator = (form: FormGroup) => {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    // 发送注册请求
    this.http.post('/register', this.registerForm.value)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
      this.successMessage = '注册成功！即将跳转到登录页面...';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
          } else {
            this.errorMessage = response.message || '注册失败';
  }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || '注册失败：服务器错误';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
}
      });
  }
}