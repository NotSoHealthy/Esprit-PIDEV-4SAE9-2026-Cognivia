import { Component, OnInit, inject,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/chat.model';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-chat-history-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <div *ngIf="loading" class="loading">Loading conversation history...</div>
      <div *ngIf="!loading && messages.length === 0" class="empty">No messages found.</div>
      
      <div class="message-list" *ngIf="!loading && messages.length > 0">
        <div *ngFor="let msg of messages" class="message-item" [class.own]="false">
          <div class="message-header">
            <span class="sender">{{ msg.senderName || msg.senderId }}</span>
            <span class="time">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>
          <div class="message-content" [class.deleted]="msg.isDeleted">
             {{ msg.content }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container { height: 400px; overflow-y: auto; padding: 10px; background: #f9f9f9; border-radius: 4px; }
    .message-list { display: flex; flex-direction: column; gap: 12px; }
    .message-header { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
    .sender { font-weight: bold; color: #333; }
    .time { color: #999; }
    .message-content { background: #fff; padding: 8px 12px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .deleted { font-style: italic; color: #999; }
    .loading, .empty { text-align: center; padding: 40px; color: #666; }
  `]
})
export class ChatHistoryViewer implements OnInit {
  nzModalData = inject(NZ_MODAL_DATA);
  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  
  messages: Message[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    this.chatService.getConversationContext(this.nzModalData).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
