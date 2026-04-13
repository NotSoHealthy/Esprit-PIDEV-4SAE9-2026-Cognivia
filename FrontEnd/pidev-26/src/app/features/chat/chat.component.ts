import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef, HostListener } from '@angular/core';
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
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ChatService, UserInfo } from './services/chat.service';
import { Message } from './models/chat.model';
import { ChatReportDialog } from './components/chat-report-dialog/chat-report-dialog';
import { NzModalService } from 'ng-zorro-antd/modal';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { interval, Subscription, startWith, switchMap, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

declare var JitsiMeetExternalAPI: any;

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
        NzAlertModule,
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
    typingUsers: UserInfo[] = [];
    private typingSubject = new Subject<void>();
    private typingPollerSub?: Subscription;
    private typingSignalSub?: Subscription;

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

    // Restriction state
    activeRestriction: any = null;
    restrictionTimeRemaining: string = '';
    private restrictionTimer?: any;

    // Call Properties
    isCallModalVisible = false;
    jitsiApi: any;


    private pollingSub?: Subscription;
    private chatService = inject(ChatService);
    private keycloakService = inject(KeycloakService);
    private nzMessage = inject(NzMessageService);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private modal = inject(NzModalService);

    ngOnInit(): void {
        this.currentUserId = (this.keycloakService.getUserId() || '').trim().toLowerCase();
        this.cleanUrl();
        this.loadUsers();
        this.checkRestriction();
    }

    /**
     * Cleans Jitsi-unfriendly URL parameters (like Keycloak state) from the browser address bar.
     * These parameters cause Jitsi's internal parser to throw SyntaxErrors.
     */
    private cleanUrl(): void {
        const url = new URL(window.location.href);
        const paramsToClear = ['state', 'session_state', 'code', 'iss', 'client_id'];
        let changed = false;

        paramsToClear.forEach(p => {
            if (url.searchParams.has(p)) {
                url.searchParams.delete(p);
                changed = true;
            }
        });

        if (changed) {
            window.history.replaceState({}, '', url.toString().split('#')[0]);
        }
    }

    ngOnDestroy(): void {
        this.pollingSub?.unsubscribe();
        this.typingPollerSub?.unsubscribe();
        this.typingSignalSub?.unsubscribe();
        if (this.restrictionTimer) clearInterval(this.restrictionTimer);
    }

    checkRestriction(): void {
        if (!this.currentUserId) return;
        this.chatService.getUserRestriction(this.currentUserId).subscribe(res => {
            if (res) {
                this.activeRestriction = res;
                this.startRestrictionCountdown();
            } else {
                this.activeRestriction = null;
            }
            this.cdr.detectChanges();
        });
    }

    private startRestrictionCountdown(): void {
        if (this.restrictionTimer) clearInterval(this.restrictionTimer);

        const update = () => {
            if (!this.activeRestriction || !this.activeRestriction.until) {
                this.restrictionTimeRemaining = '';
                return;
            }

            const until = new Date(this.activeRestriction.until).getTime();
            const now = new Date().getTime();
            const diff = until - now;

            if (diff <= 0) {
                this.activeRestriction = null;
                this.restrictionTimeRemaining = '';
                clearInterval(this.restrictionTimer);
                this.cdr.detectChanges();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            this.restrictionTimeRemaining = `${hours}h ${mins}m remaining`;
            this.cdr.detectChanges();
        };

        update();
        this.restrictionTimer = setInterval(update, 60000); // Update every minute
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
                    const convId = isGroup ? 'group-' + this.selectedUser!.id.replace('group-', '') : [this.currentUserId, this.selectedUser!.id].sort().join('_');

                    return isGroup ?
                        this.chatService.getGroupMessages(parseInt(this.selectedUser!.id.replace('group-', ''))) :
                        this.chatService.getConversation(this.currentUserId, this.selectedUser!.id);
                })
            )
            .subscribe({
                next: (data) => {
                    const lengthChanged = data.length !== this.messages.length;
                    const hasSeenChanged = JSON.stringify(data.map(m => m.seenBy)) !== JSON.stringify(this.messages.map(m => m.seenBy));

                    if (lengthChanged || hasSeenChanged) {
                        // Filter out optimistic messages if we have real messages now
                        this.messages = [
                            ...data,
                            ...this.messages.filter(m => m.status === 'sending')
                        ];
                        if (lengthChanged) {
                            this.scrollToBottom();
                        }
                        this.cdr.detectChanges();
                    }

                    // Auto-read logic: If we have the conversation open and receive new unread messages
                    if (this.selectedUser && this.selectedUser.role !== 'GROUP') {
                        const hasUnread = data.some(m => m.recipientId === this.currentUserId && !m.seenBy?.includes(this.currentUserId));
                        if (hasUnread) {
                            this.chatService.markConversationAsRead(this.currentUserId, this.selectedUser.id).subscribe();
                        }
                    } else if (this.selectedUser && this.selectedUser.role === 'GROUP') {
                        // For groups, check if we need to update lastReadTimestamp
                        const groupId = parseInt(this.selectedUser.id.replace('group-', ''));
                        const lastMsg = data[data.length - 1];
                        if (lastMsg && !lastMsg.seenBy?.includes(this.currentUserId)) {
                            this.chatService.markGroupAsRead(groupId, this.currentUserId).subscribe();
                        }
                    }

                    // Update unread counts and last messages efficiently
                    this.updateChatSummaries();
                }
            });

        // Add Typing Poller
        this.typingPollerSub?.unsubscribe();
        this.typingPollerSub = interval(2000)
            .pipe(
                switchMap(() => {
                    const isGroup = this.selectedUser!.role === 'GROUP';
                    const convId = isGroup ? 'group-' + this.selectedUser!.id.replace('group-', '') : [this.currentUserId, this.selectedUser!.id].sort().join('_');
                    return this.chatService.getTypingStatus(convId);
                })
            )
            .subscribe(users => {
                const wasTyping = this.typingUsers.length > 0;
                this.typingUsers = users.filter(u => u.id !== this.currentUserId);
                if (this.typingUsers.length > 0 && !wasTyping) {
                    this.scrollToBottom();
                }
                this.cdr.detectChanges();
            });

        // Setup Typing Signal Sender
        this.typingSignalSub?.unsubscribe();
        this.typingSignalSub = this.typingSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            const isGroup = this.selectedUser!.role === 'GROUP';
            const convId = isGroup ? 'group-' + this.selectedUser!.id.replace('group-', '') : [this.currentUserId, this.selectedUser!.id].sort().join('_');
            this.chatService.sendTypingStatus(convId, this.currentUserId).subscribe();
        });
    }

    onTyping(): void {
        this.typingSubject.next();
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
        const messageContent = this.newMessage;
        const tempId = Date.now();

        // Optimistic UI Update
        const optimisticMessage: Message = {
            id: tempId,
            senderId: this.currentUserId,
            content: messageContent,
            timestamp: new Date().toISOString(),
            status: 'sending' as any,
            isRead: false
        };
        
        if (isGroup) {
            optimisticMessage.groupId = parseInt(this.selectedUser.id.replace('group-', ''));
        } else {
            optimisticMessage.recipientId = this.selectedUser.id;
        }

        this.messages = [...this.messages, optimisticMessage];
        this.newMessage = '';
        this.scrollToBottom();
        this.cdr.detectChanges();

        const messageData: Partial<Message> = {
            senderId: this.currentUserId,
            content: messageContent
        };

        if (isGroup) {
            messageData.groupId = optimisticMessage.groupId;
        } else {
            messageData.recipientId = optimisticMessage.recipientId;
        }

        this.chatService.sendMessage(messageData).subscribe({
            next: (realMsg) => {
                // Replace optimistic message with real message
                this.messages = this.messages.map(m => m.id === tempId ? realMsg : m);
                this.cdr.detectChanges();
            },
            error: () => {
                this.nzMessage.error('Failed to send message');
                // Remove optimistic message on error
                this.messages = this.messages.filter(m => m.id !== tempId);
                this.cdr.detectChanges();
            }
        });
    }

    // --- Call Methods ---
    startCall(type: 'video' | 'audio'): void {
        if (!this.selectedUser) return;

        const roomId = `pidev-call-${Math.random().toString(36).substring(2, 9)}`;
        const content = `${type}:${roomId}`;

        const isGroup = this.selectedUser.role === 'GROUP';
        const messageData: Partial<Message> = {
            senderId: this.currentUserId,
            content: content,
            type: 'call'
        };

        if (isGroup) {
            messageData.groupId = parseInt(this.selectedUser.id.replace('group-', ''));
        } else {
            messageData.recipientId = this.selectedUser.id;
        }

        this.chatService.sendMessage(messageData).subscribe({
            next: () => {
                this.joinCall(roomId);
            },
            error: () => this.nzMessage.error('Failed to start call')
        });
    }

    joinCall(roomName: string): void {
        this.isCallModalVisible = true;
        this.cdr.detectChanges();

        const domain = 'meet.jit.si';
        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: document.querySelector('#jitsi-container'),
            userInfo: {
                displayName: 'Me' // Ideally fetch real name from service
            },
            configOverwrite: {
                prejoinPageEnabled: false,
                disableDeepLinking: true
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ]
            }
        };

        setTimeout(() => {
            if (this.jitsiApi) this.jitsiApi.dispose();
            this.jitsiApi = new JitsiMeetExternalAPI(domain, options);

            this.jitsiApi.addEventListeners({
                readyToClose: () => this.endCall(),
                videoConferenceLeft: () => this.endCall()
            });
        }, 300);
    }

    endCall(): void {
        if (this.jitsiApi) {
            this.jitsiApi.dispose();
            this.jitsiApi = null;
        }
        this.isCallModalVisible = false;
        this.cdr.detectChanges();
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
        // Close others first
        Object.keys(this.reactionMessages).forEach(id => {
            const numId = parseInt(id);
            if (numId !== messageId) this.reactionMessages[numId] = false;
        });
        this.reactionMessages[messageId] = !this.reactionMessages[messageId];
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        // Check if we clicked on a reaction trigger or reaction picker
        if (!target.closest('.reaction-trigger') && !target.closest('.reaction-picker')) {
            // Reset all reaction pickers
            this.reactionMessages = {};
        }
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

    getGroupedReactions(msg: Message): { type: string, emoji: string, count: number, me: boolean }[] {
        if (!msg.reactions || msg.reactions.length === 0) return [];

        const groups = msg.reactions.reduce((acc, r) => {
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

    getLastSeenBy(msg: Message, index: number): string[] {
        if (!msg.seenBy || msg.seenBy.length === 0) return [];

        // Avoid showing "seen" indicator for own messages read if we're not the sender
        // In local logic, if I'm the recipient, I don't see my own avatar on my seen messages.
        // We only show seenBy users who are NOT the sender.

        return msg.seenBy.filter(userId => {
            if (userId === msg.senderId) return false;

            // Check if this userId has seen any message AFTER this index
            for (let i = index + 1; i < this.messages.length; i++) {
                if (this.messages[i].seenBy?.includes(userId)) {
                    return false;
                }
            }
            return true;
        });
    }

    isLastSentMessage(msg: Message, index: number): boolean {
        if (msg.senderId !== this.currentUserId) return false;
        if (msg.seenBy && msg.seenBy.length > 0) return false;

        for (let i = index + 1; i < this.messages.length; i++) {
            if (this.messages[i].senderId === this.currentUserId && (!this.messages[i].seenBy || this.messages[i].seenBy?.length === 0)) {
                return false;
            }
        }
        return true;
    }

    openReportDialog(message?: Message): void {
        if (!this.selectedUser) return;

        const isGroup = this.selectedUser.role === 'GROUP';
        const modalData = {
            reporterId: this.currentUserId,
            reportedUserId: message ? message.senderId : (isGroup ? null : this.selectedUser.id),
            groupId: isGroup ? parseInt(this.selectedUser.id.replace('group-', '')) : null,
            messageId: message ? message.id : null
        };

        this.modal.create({
            nzTitle: message ? 'Report Message' : 'Report Conversation',
            nzContent: ChatReportDialog,
            nzData: modalData,
            nzFooter: null
        });
    }
}
