import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ChatService } from '../../services/chat.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-chat-report-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule],
  template: `
    <form nz-form (ngSubmit)="submitReport()">
      <nz-form-item>
        <nz-form-label [nzSpan]="24">Reason for reporting</nz-form-label>
        <nz-form-control>
          <nz-select [(ngModel)]="selectedReason" name="reason" nzPlaceHolder="Select a reason">
            <nz-option nzValue="Spam" nzLabel="Spam"></nz-option>
            <nz-option nzValue="Harassment" nzLabel="Harassment"></nz-option>
            <nz-option nzValue="Inappropriate Content" nzLabel="Inappropriate Content"></nz-option>
            <nz-option nzValue="Other" nzLabel="Other"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item *ngIf="selectedReason === 'Other'">
        <nz-form-label [nzSpan]="24">Details</nz-form-label>
        <nz-form-control>
          <textarea nz-input [(ngModel)]="otherDetails" name="details" rows="3"></textarea>
        </nz-form-control>
      </nz-form-item>

      <div class="footer">
        <button nz-button nzType="default" (click)="close()">Cancel</button>
        <button nz-button nzType="primary" [nzLoading]="submitting" [disabled]="!selectedReason">Submit Report</button>
      </div>
    </form>
  `,
  styles: [`
    .footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  `]
})
export class ChatReportDialog {
  nzModalData = inject(NZ_MODAL_DATA);
  private modalRef = inject(NzModalRef);
  private chatService = inject(ChatService);
  private message = inject(NzMessageService);

  selectedReason: string = '';
  otherDetails: string = '';
  submitting: boolean = false;

  submitReport(): void {
    this.submitting = true;
    const finalReason = this.selectedReason === 'Other' ? `Other: ${this.otherDetails}` : this.selectedReason;
    
    this.chatService.reportChat({
      reporterId: this.nzModalData.reporterId,
      reportedUserId: this.nzModalData.reportedUserId,
      groupId: this.nzModalData.groupId,
      messageId: this.nzModalData.messageId,
      reason: finalReason
    }).subscribe({
      next: () => {
        this.message.success('Report submitted successfully. Admins will review it.');
        this.modalRef.close(true);
      },
      error: () => {
        this.message.error('Failed to submit report.');
        this.submitting = false;
      }
    });
  }

  close(): void {
    this.modalRef.close();
  }
}
