import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

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

    constructor(private router: Router, private supabaseService: SupabaseService) { }

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
        if (!this.email || !this.password) {
            alert('Por favor, completa todos los campos requeridos');
            return;
        }

        if (!this.isLogin() && (this.password !== this.confirmPassword)) {
            alert('Las contraseñas no coinciden');
            return;
        }

        this.isLoading.set(true);

        try {
            if (this.isLogin()) {
                const { error } = await this.supabaseService.signIn(this.email, this.password);
                if (error) throw error;
                this.closeAuth();
                this.router.navigate(['/dashboard']);
            } else {
                const { error } = await this.supabaseService.signUp(this.email, this.password, this.fullName);
                if (error) throw error;
                alert('Registro exitoso. Por favor, verifica tu correo electrónico si es necesario.');
                // After signup, we might want to log them in or ask to verify email.
                // Supabase default is often require email verification. 
                // Using signIn immediately might fail if email not confirmed.
                // For now, let's close and let them try to login.
                this.isLogin.set(true);
                // Try auto login or just show login
                const { error: signInError } = await this.supabaseService.signIn(this.email, this.password);
                if (!signInError) {
                    this.closeAuth();
                    this.router.navigate(['/dashboard']);
                } else {
                    alert('Por favor inicia sesión.');
                    this.toggleMode();
                }
            }
        } catch (error: any) {
            alert(error.message || 'Error en la autenticación');
        } finally {
            this.isLoading.set(false);
        }
    }

    async onResetPassword() {
        if (!this.resetEmail) return;

        this.isLoading.set(true);
        try {
            const { error } = await this.supabaseService.resetPassword(this.resetEmail);
            if (error) throw error;
            alert(`Si el correo ${this.resetEmail} está registrado, recibirás un enlace para restablecer tu contraseña.`);
            this.isForgotPassword.set(false);
        } catch (error: any) {
            alert(error.message || 'Error al enviar el correo de recuperación');
        } finally {
            this.isLoading.set(false);
        }
    }
}
