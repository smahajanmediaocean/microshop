import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router)
  if (authService.isLoggedIn()) {
       return true;   // ✅ logged in — allow navigation
     }
  // ❌ not  logged in — redirect to /login
  // state.url = the route the user was trying to reach e.g. "/checkout"
  // stored as returnUrl so after login we can send them back
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
     return false;
};
