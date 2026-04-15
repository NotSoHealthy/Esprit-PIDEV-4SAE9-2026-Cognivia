import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { ChatHistoryViewer } from '../chat-history-viewer/chat-history-viewer';

@Component({
  selector: 'app-admin-reported-chats',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzPopconfirmModule,
    NzTagModule,
    NzTooltipModule,
    NzModalModule
  ],
  templateUrl: './admin-reported-chats.html',
  styleUrl: './admin-reported-chats.css',
  providers: [NzMessageService, NzModalService]
})
export class AdminReportedChats implements OnInit {
  reports: any[] = [];
  loading: boolean = false;

  private chatService = inject(ChatService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    setTimeout(() => {
      this.loading = true;
      this.cdr.detectChanges();
    });
    this.chatService.getReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message.error('Failed to load chat reports');
        this.loading = false;
      }
    });
  }

  viewConversation(report: any): void {
    this.modal.create({
      nzTitle: 'Conversation Context',
      nzContent: ChatHistoryViewer,
      nzData: {
        user1: report.reporterId,
        user2: report.reportedUserId,
        groupId: report.groupId,
        messageId: report.messageId
      },
      nzWidth: 800,
      nzFooter: null
    });
  }

  banUser(userId: string): void {
    this.chatService.restrictUser({
      userId,
      type: 'BAN',
      reason: 'Violated community guidelines in chat.'
    }).subscribe(() => {
      this.message.success('User banned successfully');
    });
  }

  timeoutUser(userId: string): void {
    this.chatService.restrictUser({
      userId,
      type: 'TIMEOUT',
      durationInHours: 24,
      reason: 'Temporary timeout for chat violations.'
    }).subscribe(() => {
      this.message.success('User timed out for 24 hours');
    });
  }

  resolveReport(reportId: number): void {
    this.chatService.resolveReport(reportId).subscribe(() => {
      this.message.success('Report marked as resolved');
      this.loadReports();
    });
  }
}
