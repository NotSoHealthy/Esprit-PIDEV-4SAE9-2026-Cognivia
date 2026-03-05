import { HttpClient } from '@angular/common/http';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../core/api/api.tokens';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-welcome',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './welcome.html',
    styleUrl: './welcome.css',
})
export class WelcomeComponent implements OnInit {
    private http = inject(HttpClient);
    private readonly keycloak = inject(KeycloakService);
    private apiBaseUrl = inject(API_BASE_URL);
    private router = inject(Router);

    private oldPatientInformation: any = {};

    step = signal(0);
    firstName = '';
    lastName = '';
    age = 25;
    gender = '';

    // Dragging state for age spinner
    isDragging = false;
    startY = 0;
    dragOffset = signal(0);

    messages = [
        'Hi, welcome to Cognivia',
        'Let’s get this started',
        'First, we need additional information',
        'What’s your age?',
        'Select your gender',
        'Allow notifications?',
        ''
    ];

    genderOptions = [
        { id: 'male', label: 'Male', emoji: '♂️' },
        { id: 'female', label: 'Female', emoji: '♀️' },
        { id: 'other', label: 'Other', emoji: '⚧️' }
    ];

    ngOnInit(): void {
        const userId = this.keycloak.getUserId();
        if (userId) {
            this.http
                .get(`${this.apiBaseUrl}/care/patient/user/${userId}`)
                .subscribe({
                    next: (data: any) => {
                        if (data && data.id) {
                            this.oldPatientInformation = data;
                            this.router.navigate(['/dashboard']);
                        }
                    },
                    error: () => {
                        console.log('New patient detected. Ready for onboarding.');
                    }
                });
        }
    }

    get currentMessage() {
        return this.messages[this.step()];
    }

    get progressWidth() {
        if (this.step() === 2) return 25;
        if (this.step() === 3) return 50;
        if (this.step() === 4) return 75;
        if (this.step() === 5) return 100;
        return 0;
    }

    onContinue() {
        if (this.step() === 0) {
            this.step.set(1);
            setTimeout(() => {
                if (this.step() === 1) {
                    this.step.set(2);
                }
            }, 800);
        } else if (this.step() === 2) {
            if (this.firstName.trim() && this.lastName.trim()) {
                this.step.set(3);
            }
        } else if (this.step() === 3 || this.step() === 4) {
            this.step.set(this.step() + 1);
        } else if (this.step() === 5) {
            this.step.set(6);
            this.submitProfile();
        }
    }

    submitProfile() {
        const today = new Date();
        const dob = new Date(today.getFullYear() - this.age, today.getMonth(), today.getDate());
        const formattedDob = dob.toISOString().split('T')[0];

        const payload = {
            firstName: this.firstName,
            lastName: this.lastName,
            dateOfBirth: formattedDob,
            gender: this.gender.toUpperCase()
        };

        this.http.post(`${this.apiBaseUrl}/care/patient/register/${this.keycloak.getUserId()}`, payload)
            .subscribe({
                next: (response) => {
                    console.log('Patient created:', response);
                    setTimeout(() => this.router.navigate(['/dashboard']), 2000);
                },
                error: (err) => console.error(err)
            });
    }

    goBack() {
        if (this.step() === 2) {
            this.step.set(0);
        } else if (this.step() > 2 && this.step() < 6) {
            this.step.set(this.step() - 1);
        }
    }

    startDragging(event: MouseEvent | TouchEvent) {
        this.isDragging = true;
        this.startY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        this.dragOffset.set(0);
    }

    @HostListener('window:mousemove', ['$event'])
    @HostListener('window:touchmove', ['$event'])
    handleDragging(event: MouseEvent | TouchEvent) {
        if (!this.isDragging) return;

        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        const deltaY = clientY - this.startY;
        this.dragOffset.set(deltaY);

        if (Math.abs(deltaY) > 30) {
            if (deltaY > 0) {
                this.decrementAge();
            } else {
                this.incrementAge();
            }
            this.startY = clientY;
            this.dragOffset.set(0);
        }
    }

    @HostListener('window:mouseup')
    @HostListener('window:touchend')
    stopDragging() {
        this.isDragging = false;
        this.dragOffset.set(0);
    }

    incrementAge() {
        if (this.age < 120) this.age++;
    }

    decrementAge() {
        if (this.age > 1) this.age--;
    }

    selectGender(id: string) {
        this.gender = id;
    }

    getGenderButtonClass(id: string) {
        if (this.gender === id) {
            return 'border-cognivia-blue bg-cognivia-blue/5 shadow-[0_4px_0_0_#4A90B8]';
        }
        return 'bg-[#f7f7f7] border-[#e5e5e5] shadow-[0_4px_0_0_#e5e5e5]';
    }
}
