import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Sample FakeStore credentials for testing:
  // username: mor_2314   password: 83r5^_
  // username: johnd       password: m38rmF$
  // username: kevinryan   password: kev02937@
  user = { username: '', password: '' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit(form: NgForm): void {
    if (form.valid) {
      this.authService.login(this.user.username, this.user.password).subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
          this.router.navigate([returnUrl]);
        },
        error: () => form.control.setErrors({ loginFailed: true })
      });
    }
  }
}
