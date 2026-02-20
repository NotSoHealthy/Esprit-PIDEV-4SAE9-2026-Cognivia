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
      margin: 0 -24px 0 -24px;
      display: flex;
      flex-direction: column;
      height: 480px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    :host ::ng-deep .ant-tabs-nav {
      padding: 0 12px;
      margin-bottom: 0 !important;
      background: white;
      border-bottom: 1px solid #f0f0f0;
    }
    :host ::ng-deep .ant-tabs-tab {
      padding: 12px 8px !important;
      margin: 0 4px !important;
    }
    .reactor-list-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    :host ::ng-deep .ant-list-item {
      padding: 12px 16px !important;
      border-bottom: 1px solid #f9f9f9;
      transition: background 0.2s;
    }
    :host ::ng-deep .ant-list-item:hover {
      background: #fcfcfc;
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
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border: 1.5px solid white;
    }
    .reactor-name {
      font-size: 14px;
      font-weight: 500;
      color: #050505;
      max-width: 280px;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tab-label {
      font-weight: 600;
      color: #65676b;
      font-size: 14px;
    }
    .tab-count-all {
      margin-left: 4px;
      font-size: 14px;
      color: #65676b;
      font-weight: 600;
    }
    .tab-emoji {
      font-size: 20px;
      margin-right: 4px;
    }
    .tab-count {
      font-size: 14px;
      color: #65676b;
      font-weight: 600;
    }
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: #65676b;
      font-size: 15px;
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
