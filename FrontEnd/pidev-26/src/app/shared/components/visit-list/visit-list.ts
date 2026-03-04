import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { TitleCasePipe } from '@angular/common';
import { getStatusColor } from '../../utils/patient.utils';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { GeminiService } from '../../../core/ai/gemini.service';
import { catchError, forkJoin, firstValueFrom, of } from 'rxjs';
import { QuillViewComponent } from 'ngx-quill';

type VisitStatus = string;

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [
    FormsModule,
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzDividerModule,
    NzTagModule,
    TitleCasePipe,
    QuillViewComponent,
  ],
  templateUrl: './visit-list.html',
  styleUrl: './visit-list.css',
})
export class VisitList implements OnChanges {
  @Input() visits: any[] | null = null;

  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly gemini = inject(GeminiService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly getStatusColor = getStatusColor;

  filteredVisits: any[] = [];
  searchValue = '';
  statusFilters: Array<{ text: string; value: string }> = [];

  isGeneratingAiAnalysis = false;
  aiAnalysisText = '';
  aiAnalysisError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visits']) {
      const list = Array.isArray(this.visits) ? this.visits : [];
      this.statusFilters = this.buildStatusFilters(list);
      this.applySearch();
    }
  }

  resetSearch(): void {
    this.searchValue = '';
    this.applySearch();
  }

  async generateAiAnalysis(): Promise<void> {
    if (this.currentUserRole !== 'doctor') return;

    const list = Array.isArray(this.visits) ? this.visits : [];
    if (list.length === 0) {
      this.aiAnalysisError = 'No visits available to analyze.';
      this.aiAnalysisText = '';
      return;
    }

    this.isGeneratingAiAnalysis = true;
    this.aiAnalysisError = null;
    this.aiAnalysisText = '';
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }

    try {
      const patientSeverity = this.getPatientSeverityFromVisits(list) ?? 'UNKNOWN';
      const visitEntries = list
        .map((visit) => ({ visit, visitId: this.getVisitId(visit) }))
        .filter((x) => x.visitId && x.visitId !== '-');

      if (visitEntries.length === 0) {
        this.aiAnalysisError = 'No valid visit ids found to analyze.';
        return;
      }

      const reportRequests = visitEntries.map(({ visitId }) =>
        this.http
          .get<any>(
            `${this.apiBaseUrl}/monitoring/visitreport/visit/${encodeURIComponent(visitId)}`,
          )
          .pipe(
            catchError((err: any) => {
              if (err?.status === 404) return of(null);
              return of({ __error: this.formatHttpError(err) ?? 'Failed to load report.' });
            }),
          ),
      );

      const reports = await firstValueFrom(forkJoin(reportRequests));

      const validatedBlocks: string[] = [];
      let missingCount = 0;
      let nonSubmittedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < visitEntries.length; i++) {
        const { visit, visitId } = visitEntries[i];
        const report = reports[i];

        if (!report) {
          missingCount++;
          continue;
        }
        if (report?.__error) {
          errorCount++;
          continue;
        }
        if (!this.isReportValidated(report)) {
          nonSubmittedCount++;
          continue;
        }

        const content = this.resolveReportContent(report);
        const when = this.formatDateTime(this.getVisitDate(visit));
        const visitStatus = this.getVisitStatus(visit) || 'UNKNOWN';

        validatedBlocks.push(
          [
            `Visit ID: ${visitId}`,
            `Date: ${when}`,
            `Visit status: ${visitStatus}`,
            `Report status: VALIDATED`,
            `Report content:\n${content || '(empty)'}`,
          ].join('\n'),
        );
      }

      if (validatedBlocks.length === 0) {
        this.aiAnalysisError =
          missingCount > 0 || nonSubmittedCount > 0
            ? 'No submitted (validated) reports found to analyze.'
            : 'No reports found to analyze.';
        return;
      }

      const prompt = [
        `You are assisting a doctor reviewing a patient's home-care visits.`,
        `Patient severity: ${patientSeverity}.`,
        ``,
        `Analyze the following submitted visit reports and suggest further patient actions.`,
        `Return HTML only (no Markdown, no code fences).`,
        `Use this exact structure:`,
        `<h3>Overall summary</h3><p>...</p>`,
        `<h3>Key risks / red flags</h3><ul><li>...</li></ul>`,
        `<h3>Suggested next actions (prioritized)</h3><ol><li>...</li></ol>`,
        `<h3>Follow-ups / monitoring</h3><ul><li>...</li></ul>`,
        `<h3>Questions to clarify</h3><ul><li>...</li></ul>`,
        ``,
        `Important: This is clinical decision support only; it must not replace physician judgment.`,
        ``,
        `Submitted visit reports (${validatedBlocks.length}):`,
        validatedBlocks.map((b, idx) => `--- Report ${idx + 1} ---\n${b}`).join('\n\n'),
        ``,
        `Meta: missingReports=${missingCount}, nonSubmittedReports=${nonSubmittedCount}, errors=${errorCount}`,
      ].join('\n');

      const analysis = await this.gemini.generateText(prompt, {
        systemInstruction:
          'You write concise, medically cautious clinical summaries in HTML only. Do not output Markdown. Do not wrap output in ``` fences. Do not invent facts not present in the reports.',
        temperature: 0.2,
        maxOutputTokens: 900,
      });

      this.aiAnalysisText = this.normalizeAiAnalysisToHtml(analysis || 'No analysis returned.');
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('AI analysis error:', err);
      this.aiAnalysisError =
        this.formatHttpError(err) ?? err?.message ?? 'Failed to generate AI analysis.';
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    } finally {
      this.isGeneratingAiAnalysis = false;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    }
  }

  applySearch(): void {
    const list = Array.isArray(this.visits) ? this.visits : [];
    const q = this.normalizeSearch(this.searchValue);
    if (!q) {
      this.filteredVisits = list;
      return;
    }

    this.filteredVisits = list.filter((visit) => {
      const id = this.normalizeSearch(this.getVisitId(visit));
      const when = this.normalizeSearch(this.formatDateTime(this.getVisitDate(visit)));
      const status = this.normalizeSearch(this.getVisitStatus(visit));
      const caregiverName = this.normalizeSearch(this.getCaregiverName(visit));
      const patientName = this.normalizeSearch(this.getPatientName(visit));
      return (
        id.includes(q) ||
        when.includes(q) ||
        status.includes(q) ||
        caregiverName.includes(q) ||
        patientName.includes(q)
      );
    });
  }

  readonly sortVisitId = (a: any, b: any): number =>
    this.compareText(this.getVisitId(a), this.getVisitId(b));

  readonly sortVisitDate = (a: any, b: any): number => {
    const left = this.getVisitDate(a)?.getTime() ?? Number.POSITIVE_INFINITY;
    const right = this.getVisitDate(b)?.getTime() ?? Number.POSITIVE_INFINITY;
    return left - right;
  };

  readonly sortVisitStatus = (a: any, b: any): number =>
    this.compareText(this.getVisitStatus(a), this.getVisitStatus(b));

  readonly statusFilterFn = (value: any[] | any, item: any): boolean => {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    if (selected.length === 0) return true;
    const status = this.getVisitStatus(item);
    return status ? selected.includes(status) : false;
  };

  getVisitId(visit: any): string {
    const id = visit?.id ?? visit?.visitId;
    if (id === null || id === undefined) return '-';
    return String(id);
  }

  getVisitDate(visit: any): Date | null {
    const raw = visit?.scheduledAt ?? visit?.date ?? visit?.startTime ?? visit?.createdAt;
    return this.toDate(raw);
  }

  getVisitStatus(visit: any): VisitStatus {
    return (
      visit?.status ??
      visit?.visitStatus ??
      visit?.state ??
      visit?.visitState ??
      visit?.careStatus ??
      ''
    );
  }

  formatDateTime(value: unknown): string {
    const d = this.toDate(value);
    if (!d) return '-';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }

  private buildStatusFilters(visits: any[]): Array<{ text: string; value: string }> {
    const unique = new Set<string>();
    for (const visit of visits) {
      const status = String(this.getVisitStatus(visit) ?? '').trim();
      if (status) unique.add(status);
    }

    return Array.from(unique)
      .sort((a, b) => a.localeCompare(b))
      .map((status) => ({ text: status, value: status }));
  }

  private normalizeSearch(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  private compareText(a: unknown, b: unknown): number {
    const left = this.normalizeSearch(a);
    const right = this.normalizeSearch(b);
    return left.localeCompare(right);
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  get currentUserRole(): string | null {
    const user = this.currentUser.user();
    if (!user) return null;
    return this.currentUser.user()?.kind ?? null;
  }

  onVisitRowClick(visit: any): void {
    if (!this.canOpenReportPage(visit)) return;

    const visitId = this.getVisitId(visit);
    if (!visitId || visitId === '-') return;

    this.router.navigate(['/visit', visitId, 'report'], {
      state: { visit },
    });
  }

  canOpenReportPage(visit: any): boolean {
    const visitId = this.getVisitId(visit);
    if (!visitId || visitId === '-') return false;

    // Caregivers can always open (page enforces edit/submit/complete rules).
    if (this.currentUserRole === 'caregiver') return true;

    // Doctors/admins can view only when the visit is in a submitted/completed state.
    if (this.currentUserRole === 'doctor' || this.currentUserRole === 'admin') {
      return this.isSubmittedVisitForViewing(visit);
    }

    return false;
  }

  private isSubmittedVisitForViewing(visit: any): boolean {
    const status = this.normalizeSearch(this.getVisitStatus(visit));
    // We don't have report status in the list payload, so we gate on visit status.
    // The report page itself further gates visibility based on report VALIDATED status.
    return (
      status.includes('completed') ||
      status.includes('validated') ||
      status.includes('submitted') ||
      status.includes('done') ||
      status.includes('finished')
    );
  }

  getCaregiverName(visit: any): string {
    const firstName = visit?.caregiver?.firstName ?? '';
    const lastName = visit?.caregiver?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Caregiver not assigned';
  }

  getPatientName(visit: any): string {
    const fromPatient = visit?.patient;
    const firstName = fromPatient?.firstName ?? '';
    const lastName = fromPatient?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    const fallback =
      visit?.patientName ??
      visit?.patientFullName ??
      visit?.patient?.name ??
      visit?.patient?.fullName ??
      '';

    return fullName || String(fallback || '-');
  }

  // Note: Editability rules are enforced on the report page itself (read-only viewer + disabled actions).

  private getPatientSeverityFromVisits(visits: any[]): string | null {
    for (const v of visits) {
      const sev = v?.patient?.severity ?? v?.patientSeverity ?? null;
      if (sev !== null && sev !== undefined && String(sev).trim()) {
        return String(sev);
      }
    }
    return null;
  }

  private isReportValidated(report: any): boolean {
    const raw =
      report?.status ?? report?.reportStatus ?? report?.state ?? report?.data?.status ?? null;
    return (
      String(raw ?? '')
        .trim()
        .toUpperCase() === 'VALIDATED'
    );
  }

  private resolveReportContent(report: any): string {
    if (!report) return '';
    const direct =
      report?.content ??
      report?.reportContent ??
      report?.text ??
      report?.description ??
      report?.report ??
      report?.data?.content ??
      report?.data?.reportContent ??
      report?.data?.text ??
      '';
    return String(direct ?? '');
  }

  private formatHttpError(error: any): string | null {
    const bodyMessage = error?.error?.message ?? error?.error?.error;
    const msg = bodyMessage ?? error?.message;
    if (!msg) return null;
    return String(msg);
  }

  private normalizeAiAnalysisToHtml(value: string): string {
    let text = String(value ?? '').trim();
    if (!text) return '';

    // Strip fenced code blocks (common model output).
    if (text.startsWith('```')) {
      text = text
        .replace(/^```[a-zA-Z0-9_-]*\s*/m, '')
        .replace(/```\s*$/m, '')
        .trim();
    }

    // If it looks like HTML already, keep it.
    if (/<\s*(p|h1|h2|h3|h4|ul|ol|li|strong|em|br)\b/i.test(text)) {
      return text;
    }

    // Convert simple plain-text / markdown-ish output into safe HTML paragraphs and lists.
    const lines = text.split(/\r?\n/);
    const out: string[] = [];

    let inUl = false;
    let inOl = false;
    let paragraphLines: string[] = [];

    const flushParagraph = () => {
      if (paragraphLines.length === 0) return;
      const joined = paragraphLines.join('<br/>');
      out.push(`<p>${joined}</p>`);
      paragraphLines = [];
    };

    const closeLists = () => {
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
    };

    const escapeHtml = (s: string) =>
      s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        closeLists();
        continue;
      }

      // Headings: "### Title" or "## Title" or "# Title"
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        closeLists();
        const level = headingMatch[1].length === 1 ? 2 : headingMatch[1].length === 2 ? 3 : 4;
        out.push(`<h${level}>${escapeHtml(headingMatch[2])}</h${level}>`);
        continue;
      }

      // Ordered list: "1) item" or "1. item"
      const olMatch = trimmed.match(/^\d+([).])\s+(.+)$/);
      if (olMatch) {
        flushParagraph();
        if (!inOl) {
          closeLists();
          out.push('<ol>');
          inOl = true;
        }
        out.push(`<li>${escapeHtml(olMatch[2])}</li>`);
        continue;
      }

      // Unordered list: "- item" or "* item"
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        flushParagraph();
        if (!inUl) {
          closeLists();
          out.push('<ul>');
          inUl = true;
        }
        out.push(`<li>${escapeHtml(ulMatch[1])}</li>`);
        continue;
      }

      // Default: paragraph text (preserve explicit newlines as <br/>)
      paragraphLines.push(escapeHtml(trimmed));
    }

    flushParagraph();
    closeLists();

    return out.join('');
  }
}
