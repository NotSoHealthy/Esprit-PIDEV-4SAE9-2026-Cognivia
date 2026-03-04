import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-streak-flame',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="streak-container flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm bg-white">
      <div class="flame-svg-wrapper relative w-6 h-6">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
             class="w-full h-full transition-colors duration-500" [style.fill]="flameColor">
          <path d="M12 21C14.4853 21 16.5 18.9853 16.5 16.5C16.5 14.5 15.5 13 14 11.5C12.5 10 12.5 8 12.5 8C12.5 8 12.5 10 11 11.5C9.5 13 8.5 14.5 8.5 16.5C8.5 18.9853 10.5147 21 12 21Z" />
          <path opacity="0.4" d="M12 22C15.3137 22 18 19.3137 18 16C18 13.5 16.5 11.5 14.5 9.5C12.5 7.5 12 4.5 12 4.5C12 4.5 11.5 7.5 9.5 9.5C7.5 11.5 6 13.5 6 16C6 19.3137 8.68629 22 12 22Z" />
          <path opacity="0.2" d="M12 23C16.4183 23 20 19.4183 20 15C20 11.5 18 9 15.5 6.5C13 4 12 1 12 11C12 1 11 4 8.5 6.5C6 9 4 11.5 4 15C4 19.4183 7.58172 23 12 23Z" />
        </svg>
      </div>
      <span class="text-sm font-bold text-[#4D5CAB]">{{ streakCount }}</span>
    </div>
  `,
    styles: [`
    .flame-svg-wrapper svg {
      filter: drop-shadow(0 0 4px rgba(0,0,0,0.05));
    }
  `]
})
export class StreakFlameComponent {
    @Input() streakCount: number = 0;

    get flameColor(): string {
        if (this.streakCount >= 7) return '#ef4444'; // Red (Extreme)
        if (this.streakCount >= 4) return '#f97316'; // Orange (Hot)
        if (this.streakCount >= 1) return '#3b82f6'; // Blue (Started)
        return '#94a3b8'; // Gray (No active streak)
    }
}
