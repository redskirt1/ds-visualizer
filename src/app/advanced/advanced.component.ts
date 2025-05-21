// src/app/advanced/advanced.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';   // ★ 新增

@Component({
  standalone: true,                  // 仍保持 standalone
  selector: 'app-advanced',
  templateUrl: './advanced.component.html',
  styleUrls: ['./advanced.component.scss'],
  imports: [RouterModule],           // ★ 把 RouterModule 写进这里
})
export class AdvancedComponent {}

