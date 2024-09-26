import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, CanActivateChild } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    return this.checkAuth(route);
  }

  canActivateChild(route: ActivatedRouteSnapshot): boolean {
    return this.checkAuth(route);
  }

  private checkAuth(route: ActivatedRouteSnapshot): boolean {
    const isAuthenticated = this.authService.isAuthenticated();


    if (isAuthenticated) {
       // Redirigir a home si intentan acceder a login
    if (route.routeConfig?.path === 'login') {
      this.router.navigate(['/home']);
      return false;
    }

 
      return true; // Usuario autenticado
    } else {
      this.router.navigate(['/login']); // Redirige a login si no está autenticado
      return false;
    }
  }
}
