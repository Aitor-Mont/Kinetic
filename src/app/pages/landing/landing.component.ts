import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css'
})
export class LandingComponent {
    showAuthModal = signal(false);
    isLogin = signal(true);
    isForgotPassword = signal(false);
    isLoading = signal(false);

    // Form data
    email = '';
    password = '';
    fullName = '';
    confirmPassword = '';
    resetEmail = '';

    constructor(private router: Router) { }

    openAuth(mode: 'login' | 'register') {
        this.isLogin.set(mode === 'login');
        this.isForgotPassword.set(false);
        this.showAuthModal.set(true);
    }

    closeAuth() {
        this.showAuthModal.set(false);
        this.isForgotPassword.set(false);
        this.resetForm();
    }

    toggleMode() {
        this.isLogin.update(v => !v);
        this.isForgotPassword.set(false);
        this.resetForm();
    }

    showForgot() {
        this.isForgotPassword.set(true);
        this.resetEmail = this.email;
    }

    cancelForgot() {
        this.isForgotPassword.set(false);
    }

    resetForm() {
        this.email = '';
        this.password = '';
        this.fullName = '';
        this.confirmPassword = '';
        this.resetEmail = '';
    }

    async onSubmit() {
        this.isLoading.set(true);

        // Simulate authentication
        setTimeout(() => {
            this.isLoading.set(false);
            this.closeAuth();
            this.router.navigate(['/dashboard']);
        }, 1500);
    }

    async onResetPassword() {
        if (!this.resetEmail) return;

        this.isLoading.set(true);
        // Simulate sending email
        setTimeout(() => {
            this.isLoading.set(false);
            alert(`Si el correo ${this.resetEmail} está registrado, recibirás un enlace para restablecer tu contraseña.`);
            this.isForgotPassword.set(false);
        }, 1500);
    }
}
