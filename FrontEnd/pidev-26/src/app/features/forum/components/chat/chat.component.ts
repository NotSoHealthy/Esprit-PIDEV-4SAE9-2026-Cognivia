import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ChatService, UserInfo } from '../../services/chat.service';
import { Message } from '../../models/chat.model';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { interval, Subscription, startWith, switchMap } from 'rxjs';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzLayoutModule,
        NzAvatarModule,
        NzInputModule,
        NzButtonModule,
        NzIconModule,
        NzTypographyModule,
        NzEmptyModule,
        NzTagModule,
        NzSpinModule,
        TimeAgoPipe
    ],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    /** All users fetched from the backend */
    allUsers: UserInfo[] = [];
    loadingUsers = false;

    /** The user currently selected to chat with */
    selectedUser: UserInfo | null = null;

    messages: Message[] = [];
    newMessage: string = '';
    currentUserId: string = '';

    private pollingSub?: Subscription;
    private chatService = inject(ChatService);
    private keycloakService = inject(KeycloakService);
    private nzMessage = inject(NzMessageService);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);

    ngOnInit(): void {
        this.currentUserId = this.keycloakService.getUserId() || '';
        this.loadUsers();
    }

    ngOnDestroy(): void {
        this.pollingSub?.unsubscribe();
    }

    loadUsers(): void {
        this.loadingUsers = true;
        this.chatService.getAllUsers().subscribe({
            next: (users) => {
                // Exclude self
                this.allUsers = users.filter(u => u.id !== this.currentUserId);
                this.loadingUsers = false;
                this.cdr.detectChanges();

                // Auto-select if recipientId is in query params
                const recipientId = this.route.snapshot.queryParamMap.get('recipientId');
                if (recipientId) {
                    const found = this.allUsers.find(u => u.id === recipientId);
                    if (found) {
                        this.selectUser(found);
                    } else {
                        // User not in DB — create a placeholder
                        const placeholder: UserInfo = { id: recipientId, name: recipientId.substring(0, 8) + '…', role: 'User' };
                        this.allUsers = [placeholder, ...this.allUsers];
                        this.selectUser(placeholder);
                    }
                }
            },
            error: (err) => {
                console.error('Error loading users', err);
                this.loadingUsers = false;
                this.cdr.detectChanges();
            }
        });
    }

    selectUser(user: UserInfo): void {
        this.selectedUser = user;
        this.loadConversation();
        this.startPolling();
    }

    getInitials(user: UserInfo): string {
        const name = user?.name;
        if (!name) return '?';
        const parts = name.trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.substring(0, 2).toUpperCase();
    }

    getAvatar(userId: string): string {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    }

    getRoleColor(role: string): string {
        switch (role) {
            case 'Doctor': return 'blue';
            case 'Caregiver': return 'green';
            default: return 'default';
        }
    }

    loadConversation(): void {
        if (!this.selectedUser) return;
        this.chatService.getConversation(this.currentUserId, this.selectedUser.id).subscribe({
            next: (data) => {
                this.messages = data;
                this.scrollToBottom();
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading conversation', err)
        });
    }

    startPolling(): void {
        this.pollingSub?.unsubscribe();
        this.pollingSub = interval(5000)
            .pipe(
                startWith(0),
                switchMap(() => this.chatService.getConversation(this.currentUserId, this.selectedUser!.id))
            )
            .subscribe({
                next: (data) => {
                    if (data.length !== this.messages.length) {
                        this.messages = data;
                        this.scrollToBottom();
                        this.cdr.detectChanges();
                    }
                }
            });
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.selectedUser) return;

        const message: Partial<Message> = {
            senderId: this.currentUserId,
            recipientId: this.selectedUser.id,
            content: this.newMessage
        };

        this.chatService.sendMessage(message).subscribe({
            next: (savedMsg) => {
                this.messages.push(savedMsg);
                this.newMessage = '';
                this.scrollToBottom();
                this.cdr.detectChanges();
            },
            error: () => this.nzMessage.error('Failed to send message')
        });
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            try {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            } catch (err) { }
        }, 100);
    }
}
