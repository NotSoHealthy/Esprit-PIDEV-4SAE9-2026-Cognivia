import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notification-redirect-page',
  imports: [CommonModule],
  templateUrl: './notification-redirect.page.html',
  styleUrl: './notification-redirect.page.css',
})
export class NotificationRedirectPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  eventType: string | null = null;
  referenceId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.eventType = params.get('eventType');
      this.referenceId = params.get('referenceId');

      if (this.eventType === 'VISIT_REPORT_SUBMITTED' && this.referenceId) {
        void this.router.navigate(['/visit', this.referenceId, 'report'], { replaceUrl: true });
        return;
      } else if (this.eventType === 'VISIT_SCHEDULED' && this.referenceId) {
        void this.router.navigate(['/visit', this.referenceId, 'report'], { replaceUrl: true });
        return;
      }
    });
  }
}
