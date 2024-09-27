// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/login';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { email, password });
  }

  storeUser(data: {user: any, status: any}): void {
    localStorage.setItem('status', data.status);
    localStorage.setItem('user', JSON.stringify(data.user));


  }

  getUser(){
    let user = {};

    const userData = localStorage.getItem('user');
    if(userData){
       user = JSON.parse(userData);
    }
    
    return user;
  }

  logout(){
    localStorage.removeItem('user');
    localStorage.removeItem('status');
    this.router.navigate(['/login']);

  }

  async logout2(): Promise<void> {
    return new Promise((resolve) => {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
      resolve(); // Resuelve la promesa después de realizar la acción
    });
  }
  

  isAuthenticated(): boolean {
    return !!localStorage.getItem('user');
  }

  async isAuthenticated2(): Promise<boolean> {
    return new Promise((resolve) => {
      const isAuthenticated = !!localStorage.getItem('user');
      resolve(isAuthenticated);
    });
  }
  
  
}
