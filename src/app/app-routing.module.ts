import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  // 公共路由 - 不需要认证
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // 受保护路由 - 需要认证
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  
  // 懒加载模块路由 - 需要认证
  {
    path: 'linear',
    loadChildren: () => import('./linear/linear.module').then(m => m.LinearModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'tree',
    loadChildren: () => import('./tree/tree.module').then(m => m.TreeModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'graph',
    loadChildren: () => import('./graph/graph.module').then(m => m.GraphModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'advanced',
    loadChildren: () => import('./advanced/advanced.module').then(m => m.AdvancedModule),
    canActivate: [AuthGuard]
  },
  
  // 重定向路由
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
