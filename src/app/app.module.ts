import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { GraphComponent } from './graph/graph.component';
import { GraphModule } from './graph/graph.module'; // 导入图形模块
import { TreeComponent } from './tree/tree.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    LoginComponent,
    RegisterComponent,
    ReactiveFormsModule,
    GraphComponent,
    GraphModule,
    TreeComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
