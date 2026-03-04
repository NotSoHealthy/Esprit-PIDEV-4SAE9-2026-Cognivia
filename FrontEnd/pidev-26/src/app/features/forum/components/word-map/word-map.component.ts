import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../services/forum.service';

import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-word-map',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  template: `
    <div class="word-map-card" *ngIf="keywords.length > 0">
      <div class="card-header">
        <div class="header-icon">
          <span nz-icon nzType="line-chart" nzTheme="outline"></span>
        </div>
        <h3 class="word-map-title">Medical Trending Topics</h3>
      </div>
      
      <div class="word-cloud">
        <span 
          *ngFor="let item of keywords" 
          [style.fontSize.px]="getFontSize(item.count)"
          [style.opacity]="getOpacity(item.count)"
          class="word-item"
          [class.active]="selectedTag === item.text"
          (click)="selectTag(item.text)"
        >
          {{ item.text }}
        </span>
      </div>

      <div class="card-footer" *ngIf="selectedTag">
        <button class="clear-btn" (click)="selectTag('')">
          <span nz-icon nzType="close-circle" nzTheme="outline"></span> Clear filter
        </button>
      </div>
    </div>
  `,
  styles: [`
    .word-map-card {
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(12px);
      border-radius: var(--border-radius-lg, 16px);
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.3));
      box-shadow: var(--card-shadow, 0 4px 6px rgba(0,0,0,0.05));
      transition: all 0.3s ease;
    }
    
    .word-map-card:hover {
      box-shadow: var(--card-hover-shadow, 0 10px 15px rgba(0,0,0,0.1));
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .header-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.9rem;
      box-shadow: 0 4px 10px rgba(59, 66, 159, 0.2);
    }

    .word-map-title {
      color: var(--text-main, #1e293b);
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .word-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: center;
      min-height: 160px;
      padding: 10px 0;
    }

    .word-item {
      color: var(--text-secondary, #64748b);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 10px;
      line-height: 1.2;
    }

    .word-item:hover {
      color: var(--primary-color, #3b429f);
      transform: scale(1.1) translateY(-2px);
      background: rgba(59, 66, 159, 0.05);
    }

    .word-item.active {
      color: white;
      background: var(--primary-color, #3b429f);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(59, 66, 159, 0.25);
      font-weight: 600;
    }

    .card-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, rgba(0,0,0,0.05));
      display: flex;
      justify-content: center;
    }

    .clear-btn {
      background: white;
      border: 1px solid var(--border-color, #e2e8f0);
      color: var(--text-secondary, #64748b);
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .clear-btn:hover {
      background: #fff5f5;
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.05);
    }
  `]
})
export class WordMapComponent implements OnInit {
  @Input() selectedTag: string = '';
  @Output() tagSelected = new EventEmitter<string>();

  keywords: { text: string; count: number }[] = [];
  maxCount = 0;

  constructor(
    private forumService: ForumService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    setTimeout(() => this.loadWordCloud());
  }

  loadWordCloud(): void {
    this.forumService.getWordCloud().subscribe({
      next: (data) => {
        // Defer to next microtask to avoid NG0100 on keywords.length
        Promise.resolve().then(() => {
          this.keywords = Object.entries(data)
            .map(([text, count]) => ({
              text,
              count: count as number
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 25); // Show top 25 keywords
          this.maxCount = Math.max(...this.keywords.map(k => k.count), 1);
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error fetching word cloud:', err)
    });
  }

  selectTag(tag: string): void {
    this.tagSelected.emit(tag);
  }

  getFontSize(count: number): number {
    const minSize = 13;
    const maxSize = 28;
    return minSize + (count / this.maxCount) * (maxSize - minSize);
  }

  getOpacity(count: number): number {
    const minOpacity = 0.5;
    return minOpacity + (count / this.maxCount) * (1 - minOpacity);
  }
}
