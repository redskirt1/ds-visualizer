import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a form with username, email, password and confirmPassword fields', () => {
    expect(component.registerForm.contains('username')).toBeTruthy();
    expect(component.registerForm.contains('email')).toBeTruthy();
    expect(component.registerForm.contains('password')).toBeTruthy();
    expect(component.registerForm.contains('confirmPassword')).toBeTruthy();
  });

  it('should make the username control required', () => {
    const control = component.registerForm.get('username');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();
  });

  it('should make the email control required and valid email format', () => {
    const control = component.registerForm.get('email');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();
    
    control?.setValue('invalid-email');
    expect(control?.valid).toBeFalsy();
    
    control?.setValue('valid@example.com');
    expect(control?.valid).toBeTruthy();
  });

  it('should make the password control required and minimum length of 6', () => {
    const control = component.registerForm.get('password');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();
    
    control?.setValue('12345');
    expect(control?.valid).toBeFalsy();
    
    control?.setValue('123456');
    expect(control?.valid).toBeTruthy();
  });

  it('should validate that passwords match', () => {
    component.registerForm.get('password')?.setValue('123456');
    component.registerForm.get('confirmPassword')?.setValue('123456');
    expect(component.registerForm.valid).toBeTruthy();
    
    component.registerForm.get('confirmPassword')?.setValue('different');
    expect(component.registerForm.valid).toBeFalsy();
  });
});