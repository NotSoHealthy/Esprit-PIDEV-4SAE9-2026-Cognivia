import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule, NzTabComponent, NzTabsComponent } from 'ng-zorro-antd/tabs';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { Reaction, ReactionType } from '../../models/reaction.model';

@Component({
  selector: 'app-reaction-details',
  standalone: true,
  imports: [
    CommonModule,
    NzTabsModule,
    NzTabComponent,
    NzTabsComponent,
    NzListModule,
    NzAvatarModule
  ],
  template: `
    <div class="reaction-details-container">
      <nz-tabs [nzSelectedIndex]="selectedIndex" (nzSelectedIndexChange)="onTabChange($any($event))">
        <nz-tab [nzTitle]="allTitle">
          <ng-template #allTitle>
            <span class="tab-label">All</span>
            <span class="tab-count-all">{{ reactions.length }}</span>
          </ng-template>
        </nz-tab>
        
        <nz-tab *ngFor="let type of activeReactionTypes; let i = index" [nzTitle]="typeTitle">
          <ng-template #typeTitle>
            <span class="tab-emoji">{{ getReactionEmoji(type) }}</span>
            <span class="tab-count">{{ getCountByType(type) }}</span>
          </ng-template>
        </nz-tab>
      </nz-tabs>

      <div class="reactor-list-scroll">
        <nz-list nzItemLayout="horizontal">
          <nz-list-item *ngFor="let r of filteredReactions">
            <nz-list-item-meta>
              <nz-list-item-meta-avatar>
                <div class="avatar-wrapper">
                  <nz-avatar [nzText]="(r.username || r.userId || '?').charAt(0).toUpperCase()"
                           style="background-color: #f5f3ff; color: #7c3aed; font-weight: bold; font-size: 16px;">
                  </nz-avatar>
                  <div class="mini-emoji">{{ getReactionEmoji(r.type) }}</div>
                </div>
              </nz-list-item-meta-avatar>
              <nz-list-item-meta-title>
                <span class="reactor-name">{{ r.username || r.userId || 'Anonymous' }}</span>
              </nz-list-item-meta-title>
            </nz-list-item-meta>
          </nz-list-item>
        </nz-list>

        <div *ngIf="filteredReactions.length === 0" class="empty-state">
          No reactions of this type.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reaction-details-container {
      margin: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
    }
    :host ::ng-deep .ant-tabs-nav {
      padding: 0 16px;
      margin-bottom: 0 !important;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    :host ::ng-deep .ant-tabs-tab {
      padding: 14px 12px !important;
      margin: 0 4px !important;
      transition: all 0.2s;
    }
    :host ::ng-deep .ant-tabs-tab-active .tab-label,
    :host ::ng-deep .ant-tabs-tab-active .tab-count-all {
        color: var(--primary-color) !important;
    }
    .reactor-list-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }
    :host ::ng-deep .ant-list-item {
      padding: 12px 24px !important;
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.2s;
      cursor: default;
    }
    :host ::ng-deep .ant-list-item:hover {
      background: #f8fafc;
    }
    .avatar-wrapper {
      position: relative;
      display: inline-block;
    }
    .mini-emoji {
      position: absolute;
      bottom: -2px;
      right: -4px;
      background: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      border: 2px solid white;
    }
    .reactor-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
    }
    .tab-label {
      font-weight: 700;
      color: #64748b;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .tab-count-all {
      margin-left: 6px;
      font-size: 0.85rem;
      color: #94a3b8;
      font-weight: 600;
    }
    .tab-emoji {
      font-size: 1.4rem;
      margin-right: 6px;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
    }
    .tab-count {
      font-size: 0.9rem;
      color: #64748b;
      font-weight: 700;
    }
    .empty-state {
      padding: 80px 40px;
      text-align: center;
      color: #94a3b8;
      font-size: 1rem;
      font-weight: 500;
    }
  `]
})
export class ReactionDetailsComponent implements OnInit {
  readonly data = inject<{ reactions: Reaction[] }>(NZ_MODAL_DATA);

  reactions: Reaction[] = [];
  filteredReactions: Reaction[] = [];
  activeReactionTypes: ReactionType[] = [];
  selectedIndex = 0;

  ngOnInit(): void {
    this.reactions = this.data.reactions || [];
    this.filteredReactions = [...this.reactions];

    // Get unique types present in the reactions
    const types = new Set(this.reactions.map(r => r.type));
    this.activeReactionTypes = Array.from(types);
  }

  onTabChange(index: number | any): void {
    const idx = typeof index === 'number' ? index : (index as any)?.index || 0;
    this.selectedIndex = idx;

    if (idx === 0) {
      this.filteredReactions = [...this.reactions];
    } else {
      const selectedType = this.activeReactionTypes[idx - 1];
      this.filteredReactions = this.reactions.filter(r => r.type === selectedType);
    }
  }

  getCountByType(type: ReactionType): number {
    return this.reactions.filter(r => r.type === type).length;
  }

  getReactionEmoji(type: ReactionType): string {
    const emojis: Record<ReactionType, string> = {
      'LIKE': '👍',
      'LOVE': '❤️',
      'HAHA': '😆',
      'WOW': '😮',
      'SAD': '😢',
      'ANGRY': '😡',
      'DISLIKE': '👎'
    };
    return emojis[type] || '👍';
  }
}
