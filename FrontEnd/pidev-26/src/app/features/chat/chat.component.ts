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
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { ChatService, UserInfo } from './services/chat.service';
import { Message } from './models/chat.model';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
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
        NzTooltipModule,
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
    unreadCounts: { [key: string]: number } = {};
    lastMessages: { [key: string]: Message } = {};
    pollingInterval: any;

    editingMessageId: number | null = null;
    editingContent: string = '';

    reactionMessages: { [key: number]: boolean } = {};
    availableReactions = [
        { type: 'LIKE', emoji: '👍' },
        { type: 'LOVE', emoji: '❤️' },
        { type: 'HAHA', emoji: '😂' },
        { type: 'WOW', emoji: '😮' },
        { type: 'SAD', emoji: '😢' },
        { type: 'ANGRY', emoji: '😡' }
    ];

    private pollingSub?: Subscription;
    private chatService = inject(ChatService);
    private keycloakService = inject(KeycloakService);
    private nzMessage = inject(NzMessageService);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);

    ngOnInit(): void {
        this.currentUserId = (this.keycloakService.getUserId() || '').trim().toLowerCase();
        this.loadUsers();
    }

    ngOnDestroy(): void {
        this.pollingSub?.unsubscribe();
    }

    loadUsers(): void {
        this.loadingUsers = true;
        this.chatService.getAllUsers().subscribe({
            next: (users) => {
                // Exclude self (with normalization)
                this.allUsers = users.filter(u => u.id.trim().toLowerCase() !== this.currentUserId);
                this.loadingUsers = false;

                // Initialize unread counts and last messages
                this.updateChatSummaries();

                // Auto-select if recipientId is in query params
                const recipientId = this.route.snapshot.queryParamMap.get('recipientId');
                if (recipientId) {
                    const normRecipientId = recipientId.trim().toLowerCase();
                    const found = this.allUsers.find(u => u.id.trim().toLowerCase() === normRecipientId);
                    if (found) {
                        this.selectUser(found);
                    } else {
                        // User not in DB — create a placeholder
                        const placeholder: UserInfo = { id: normRecipientId, name: recipientId.substring(0, 8) + '…', role: 'User' };
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

        // Mark as read
        this.chatService.markConversationAsRead(this.currentUserId, user.id).subscribe(() => {
            this.unreadCounts[user.id] = 0;
            this.cdr.detectChanges();
        });
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
        const r = (role || '').toUpperCase();
        if (r.includes('DOCTOR')) return 'blue';
        if (r.includes('CAREGIVER')) return 'green';
        if (r.includes('ADMIN')) return 'volcano';
        return 'default';
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
                    // Update unread counts and last messages efficiently
                    this.updateChatSummaries();
                }
            });
    }

    private updateChatSummaries(): void {
        this.chatService.getChatSummary(this.currentUserId).subscribe(summaries => {
            summaries.forEach(s => {
                this.unreadCounts = { ...this.unreadCounts, [s.contactId]: s.unreadCount };
                if (s.lastMessage) {
                    this.lastMessages = { ...this.lastMessages, [s.contactId]: s.lastMessage };
                }
            });
            this.cdr.detectChanges();
        });
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.selectedUser) return;

        const messageData: Partial<Message> = {
            senderId: this.currentUserId,
            recipientId: this.selectedUser.id,
            content: this.newMessage
        };

        this.chatService.sendMessage(messageData).subscribe({
            next: () => {
                this.newMessage = '';
                this.scrollToBottom();
                this.cdr.detectChanges();
            },
            error: () => this.nzMessage.error('Failed to send message')
        });
    }

    startEdit(message: Message) {
        this.editingMessageId = message.id ?? null;
        this.editingContent = message.content;
    }

    cancelEdit() {
        this.editingMessageId = null;
        this.editingContent = '';
    }

    confirmEdit(id: number | undefined) {
        if (!id || !this.editingContent.trim()) return;

        this.chatService.editMessage(id, this.editingContent).subscribe({
            next: () => {
                this.cancelEdit();
                this.loadConversation();
            },
            error: () => this.nzMessage.error('Failed to edit message')
        });
    }

    deleteMessage(id: number | undefined) {
        if (!id) return;
        if (confirm('Are you sure you want to delete this message?')) {
            this.chatService.deleteMessage(id).subscribe({
                next: () => {
                    this.loadConversation();
                },
                error: () => this.nzMessage.error('Failed to delete message')
            });
        }
    }

    toggleReactionPicker(messageId: number | undefined): void {
        if (!messageId) return;
        this.reactionMessages[messageId] = !this.reactionMessages[messageId];
    }

    addReaction(messageId: number | undefined, type: string): void {
        if (!messageId) return;
        this.chatService.reactToMessage(messageId, this.currentUserId, type).subscribe({
            next: () => {
                this.reactionMessages[messageId] = false;
                this.loadConversation();
            },
            error: () => this.nzMessage.error('Failed to react to message')
        });
    }

    getReactionEmoji(type: string): string {
        return this.availableReactions.find(r => r.type === type)?.emoji || '❓';
    }

    getGroupedReactions(message: Message): { type: string, emoji: string, count: number, me: boolean }[] {
        if (!message.reactions || message.reactions.length === 0) return [];

        const groups = message.reactions.reduce((acc, r) => {
            if (!acc[r.type]) {
                acc[r.type] = { count: 0, me: false };
            }
            acc[r.type].count++;
            if (r.userId === this.currentUserId) {
                acc[r.type].me = true;
            }
            return acc;
        }, {} as { [key: string]: { count: number, me: boolean } });

        return Object.keys(groups).map(type => ({
            type,
            emoji: this.getReactionEmoji(type),
            count: groups[type].count,
            me: groups[type].me
        }));
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            try {
                if (this.scrollContainer) {
                    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
                }
            } catch (err) { }
        }, 100);
    }
}
