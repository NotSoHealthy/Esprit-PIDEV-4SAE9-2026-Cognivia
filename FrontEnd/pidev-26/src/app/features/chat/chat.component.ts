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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
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
        NzModalModule,
        NzModalModule,
        NzSegmentedModule,
        NzDropDownModule,
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

    // Modal & Filter Properties
    isModalVisible = false;
    isGroupModalVisible = false;
    searchText = '';
    groupSearchText = '';
    groupName = '';
    selectedUserIds: Set<string> = new Set();
    isCreatingGroup = false;
    selectedRoleFilter = 'All';

    // Manage Group Modal Properties
    isManageGroupModalVisible = false;
    manageGroupView: 'Current Members' | 'Add Members' | 'Settings' = 'Current Members';
    currentGroupMembers: UserInfo[] = [];
    loadingMembers = false;
    addMemberSearchText = '';
    selectedNewMemberIds: Set<string> = new Set();
    isAddingMembers = false;
    currentManageGroupId: number | null = null;
    isCurrentUserAdmin = false;

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
                const otherUsers = users.filter(u => u.id.trim().toLowerCase() !== this.currentUserId);

                // Fetch groups as well
                this.chatService.getUserGroups(this.currentUserId).subscribe({
                    next: (groups) => {
                        const groupUsers: UserInfo[] = groups.map(g => ({
                            id: 'group-' + g.id,
                            name: g.name,
                            role: 'GROUP'
                        }));

                        this.allUsers = [...groupUsers, ...otherUsers];
                        this.loadingUsers = false;
                        this.cdr.detectChanges(); // Fix NG0100

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
                        console.error('Error loading groups', err);
                        this.allUsers = otherUsers;
                        this.loadingUsers = false;
                        this.cdr.detectChanges();
                    }
                });
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

        if (user.role !== 'GROUP') {
            // Mark as read
            this.chatService.markConversationAsRead(this.currentUserId, user.id).subscribe(() => {
                this.unreadCounts[user.id] = 0;
                this.cdr.detectChanges();
            });
        } else {
            const groupId = parseInt(user.id.replace('group-', ''));
            this.chatService.markGroupAsRead(groupId, this.currentUserId!).subscribe(() => {
                this.unreadCounts[user.id] = 0;
                this.cdr.detectChanges();
            });
            // Fetch members to check admin status
            this.chatService.getGroupMembers(groupId).subscribe((members: any[]) => {
                const me = members.find((m: any) => (m.userId || m.id).toLowerCase() === this.currentUserId.toLowerCase());
                this.isCurrentUserAdmin = !!(me?.isAdmin || me?.admin);
                this.cdr.detectChanges();
            });
        }
    }

    showNewConversationModal(): void {
        this.isModalVisible = true;
        this.searchText = '';
    }

    handleModalCancel(): void {
        this.isModalVisible = false;
    }

    startNewConversation(user: UserInfo): void {
        // If user already in list, select them. Otherwise add to list then select.
        const existing = this.allUsers.find(u => u.id === user.id);
        if (!existing) {
            this.allUsers = [user, ...this.allUsers];
        }
        this.selectUser(user);
        this.isModalVisible = false;
    }

    setRoleFilter(role: string): void {
        this.selectedRoleFilter = role;
    }

    showCreateGroupModal(): void {
        this.isGroupModalVisible = true;
        this.selectedUserIds.clear();
        this.groupName = '';
        this.groupSearchText = '';
        this.cdr.detectChanges(); // Fix NG0100
    }

    handleGroupModalCancel(): void {
        this.isGroupModalVisible = false;
    }

    toggleUserSelection(userId: string): void {
        if (this.selectedUserIds.has(userId)) {
            this.selectedUserIds.delete(userId);
        } else {
            this.selectedUserIds.add(userId);
        }
    }

    get filteredGroupUsers(): UserInfo[] {
        const lowerSearch = this.groupSearchText.toLowerCase();
        return this.allUsers.filter(u =>
            u.id !== this.currentUserId &&
            u.role !== 'GROUP' && (
                u.name.toLowerCase().includes(lowerSearch) ||
                u.role.toLowerCase().includes(lowerSearch)
            )
        );
    }

    createGroup(): void {
        if (!this.groupName || this.selectedUserIds.size < 1) return;

        this.isCreatingGroup = true;
        const memberIds = Array.from(this.selectedUserIds);

        this.chatService.createGroup(this.groupName, this.currentUserId!, memberIds).subscribe({
            next: (group) => {
                this.isCreatingGroup = false;
                this.isGroupModalVisible = false;
                this.nzMessage.success('Group created successfully');
                this.loadUsers(); // Refresh groups
            },
            error: (err) => {
                this.isCreatingGroup = false;
                this.nzMessage.error('Failed to create group');
            }
        });
    }

    // --- Manage Group Methods ---
    showManageGroupModal(): void {
        if (!this.selectedUser || this.selectedUser.role !== 'GROUP') return;

        this.isManageGroupModalVisible = true;
        this.currentManageGroupId = parseInt(this.selectedUser.id.replace('group-', ''));

        // Prevent NG0100 error when modal opens by deferring the view reset
        Promise.resolve().then(() => {
            this.manageGroupView = 'Current Members';
            this.cdr.detectChanges();
        });

        this.fetchCurrentGroupMembers();
    }

    handleManageGroupModalCancel(): void {
        this.isManageGroupModalVisible = false;
    }

    onManageGroupViewChange(view: any): void {
        this.addMemberSearchText = '';
        this.selectedNewMemberIds.clear();
    }

    fetchCurrentGroupMembers(): void {
        if (!this.currentManageGroupId) return;
        this.loadingMembers = true;

        this.chatService.getGroupMembers(this.currentManageGroupId).subscribe({
            next: (members: any[]) => {
                this.currentGroupMembers = members.map(m => {
                    const id = m.userId || m.id;
                    const isAdmin = !!(m.isAdmin || m.admin);
                    const found = this.allUsers.find(u => u.id.toLowerCase() === id.toLowerCase());
                    let user: UserInfo;
                    if (found) {
                        user = { ...found, isAdmin: isAdmin };
                    } else {
                        user = { id, name: id, role: 'Loading...', isAdmin: isAdmin };
                        this.chatService.getUserInfo(id).subscribe({
                            next: (info) => {
                                user.name = info.name;
                                user.role = info.role;
                                this.cdr.detectChanges();
                            }
                        });
                    }
                    if (id.toLowerCase() === this.currentUserId.toLowerCase()) {
                        this.isCurrentUserAdmin = isAdmin;
                    }
                    return user;
                });
                this.loadingMembers = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingMembers = false;
                this.nzMessage.error('Failed to load group members');
            }
        });
    }

    promoteToAdmin(userId: string): void {
        if (!this.currentManageGroupId) return;
        this.chatService.promoteToAdmin(this.currentManageGroupId, userId).subscribe({
            next: () => {
                this.nzMessage.success('User promoted to Admin');
                this.fetchCurrentGroupMembers();
            },
            error: () => this.nzMessage.error('Failed to promote user')
        });
    }

    clearGroupHistory(): void {
        if (!this.currentManageGroupId) return;
        if (confirm('Clear message history for everyone?')) {
            this.chatService.clearGroupHistory(this.currentManageGroupId).subscribe({
                next: () => {
                    this.nzMessage.success('Chat history cleared');
                    this.messages = [];
                },
                error: () => this.nzMessage.error('Failed to clear history')
            });
        }
    }

    deleteGroup(): void {
        if (!this.currentManageGroupId) return;
        if (confirm('Permanently delete this group?')) {
            this.chatService.deleteGroup(this.currentManageGroupId).subscribe({
                next: () => {
                    this.nzMessage.success('Group deleted');
                    this.isManageGroupModalVisible = false;
                    this.selectedUser = null;
                    this.loadUsers();
                },
                error: () => this.nzMessage.error('Failed to delete group')
            });
        }
    }

    removeGroupMember(userId: string): void {
        if (!this.currentManageGroupId) return;

        this.chatService.removeGroupMember(this.currentManageGroupId, userId).subscribe({
            next: () => {
                this.currentGroupMembers = this.currentGroupMembers.filter(m => m.id !== userId);
                this.nzMessage.success('Member removed');
                this.cdr.detectChanges();
            },
            error: () => this.nzMessage.error('Failed to remove member')
        });
    }

    get filteredEligibleNewMembers(): UserInfo[] {
        const lowerSearch = this.addMemberSearchText.toLowerCase();
        const currentIds = new Set(this.currentGroupMembers.map(m => m.id));

        return this.allUsers.filter(u =>
            u.role !== 'GROUP' &&
            !currentIds.has(u.id) &&
            (u.name.toLowerCase().includes(lowerSearch) || u.role.toLowerCase().includes(lowerSearch))
        );
    }

    toggleAddMemberSelection(userId: string): void {
        if (this.selectedNewMemberIds.has(userId)) {
            this.selectedNewMemberIds.delete(userId);
        } else {
            this.selectedNewMemberIds.add(userId);
        }
    }

    addSelectedMembers(): void {
        if (!this.currentManageGroupId || this.selectedNewMemberIds.size === 0) return;

        this.isAddingMembers = true;
        const newIds = Array.from(this.selectedNewMemberIds);

        this.chatService.addGroupMembers(this.currentManageGroupId, newIds).subscribe({
            next: () => {
                this.nzMessage.success('Members added successfully');
                this.isAddingMembers = false;
                Promise.resolve().then(() => {
                    this.manageGroupView = 'Current Members';
                    this.cdr.detectChanges();
                });
                this.selectedNewMemberIds.clear();
                this.fetchCurrentGroupMembers();
            },
            error: () => {
                this.nzMessage.error('Failed to add members');
                this.isAddingMembers = false;
            }
        });
    }

    get filteredUsers(): UserInfo[] {
        let filtered = this.allUsers;
        if (this.selectedRoleFilter !== 'All') {
            filtered = filtered.filter(u => u.role.toLowerCase() === this.selectedRoleFilter.toLowerCase());
        }
        if (this.searchText.trim()) {
            const lowerSearch = this.searchText.toLowerCase();
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(lowerSearch) ||
                u.role.toLowerCase().includes(lowerSearch)
            );
        }
        return filtered;
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
        if (r.includes('GROUP')) return 'purple';
        if (r.includes('DOCTOR')) return 'blue';
        if (r.includes('CAREGIVER')) return 'green';
        if (r.includes('PHARMACIST')) return 'magenta';
        if (r.includes('ADMIN')) return 'volcano';
        return 'default';
    }

    loadConversation(): void {
        if (!this.selectedUser) return;

        const isGroup = this.selectedUser.role === 'GROUP';
        const loadObs = isGroup ?
            this.chatService.getGroupMessages(parseInt(this.selectedUser.id.replace('group-', ''))) :
            this.chatService.getConversation(this.currentUserId, this.selectedUser.id);

        loadObs.subscribe({
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
                switchMap(() => {
                    const isGroup = this.selectedUser!.role === 'GROUP';
                    return isGroup ?
                        this.chatService.getGroupMessages(parseInt(this.selectedUser!.id.replace('group-', ''))) :
                        this.chatService.getConversation(this.currentUserId, this.selectedUser!.id);
                })
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

        const isGroup = this.selectedUser.role === 'GROUP';
        const messageData: Partial<Message> = {
            senderId: this.currentUserId,
            content: this.newMessage
        };

        if (isGroup) {
            messageData.groupId = parseInt(this.selectedUser.id.replace('group-', ''));
        } else {
            messageData.recipientId = this.selectedUser.id;
        }

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
