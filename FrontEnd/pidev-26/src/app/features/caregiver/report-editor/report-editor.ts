import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { CdkPortal, PortalModule } from '@angular/cdk/portal';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { QuillModule } from 'ngx-quill';
import { firstValueFrom } from 'rxjs';

import { ImgbbImageService } from '../../../core/media/imgbb-image.service';
import { GeminiService } from '../../../core/ai/gemini.service';

@Component({
  selector: 'app-report-editor',
  standalone: true,
  imports: [
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzSpinModule,
    QuillModule,
    PortalModule,
  ],
  templateUrl: './report-editor.html',
  styleUrl: './report-editor.css',
})
export class ReportEditor implements OnDestroy {
  @Input() visit: any | null = null;
  @Input() readOnly = false;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly overlay = inject(Overlay);
  private readonly gemini = inject(GeminiService);

  private _content = '';

  @Input()
  set content(value: string) {
    this._content = value ?? '';
    // Keep the underlying ngModel in sync when parent loads existing report.
    this.reportContent = this._content;
  }
  get content(): string {
    return this._content;
  }

  @Output() contentChange = new EventEmitter<string>();

  reportContent = '';
  isUploadingImage = false;

  isGeneratingDraft = false;
  aiDraft: string | null = null;
  aiErrorMessage: string | null = null;

  isImageEditorOpen = false;
  isPreparingImageEditor = false;

  @ViewChild('imageEditorPortal')
  private imageEditorPortal?: CdkPortal;

  private overlayRef: OverlayRef | null = null;

  private readonly imgbbImageService = inject(ImgbbImageService);
  private editor: any | null = null;
  private tuiEditor: any | null = null;
  private tuiObjectUrl: string | null = null;
  private lastSelectionIndex: number | null = null;

  readonly modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
      ],
      handlers: {
        image: () => this.selectLocalImage(),
      },
    },
  };

  get resolvedVisit(): any | null {
    return this.visit;
  }

  onEditorCreated(editor: any): void {
    this.editor = editor;
  }

  onReportContentChange(value: string): void {
    if (this.readOnly) {
      // Ignore user-driven changes when in read-only mode.
      return;
    }
    this.reportContent = value ?? '';
    this._content = this.reportContent;
    this.contentChange.emit(this.reportContent);
  }

  async generateDraft(): Promise<void> {
    if (this.readOnly) return;
    if (this.isUploadingImage) return;
    if (this.isGeneratingDraft) return;

    const userText = String(this.reportContent ?? '').trim();
    if (!userText) {
      this.aiErrorMessage = 'Write a few notes first, then generate a draft.';
      this.aiDraft = null;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
      return;
    }

    this.isGeneratingDraft = true;
    this.aiErrorMessage = null;
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }

    try {
      const systemInstruction =
        'You help caregivers write clear, concise visit reports. ' +
        'Do not invent facts. If details are missing, keep it generic. ' +
        'Return ONLY HTML suitable for a rich text editor (use paragraphs and lists). ' +
        'No Markdown and no code fences.';

      const prompt =
        'Create a polished visit report draft from these caregiver notes:\n\n' + userText;

      const rawDraft = await this.gemini.generateText(prompt, {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 800,
      });

      const draft = this.normalizeAiDraftToHtml(rawDraft);

      if (!draft) {
        this.aiErrorMessage = 'AI returned an empty draft. Try again.';
        this.aiDraft = null;
        return;
      }

      this.aiDraft = draft;
    } catch (e: any) {
      this.aiDraft = null;
      this.aiErrorMessage =
        e?.error?.message || e?.message || 'Failed to generate a draft. Check Gemini API key.';
    } finally {
      this.isGeneratingDraft = false;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    }
  }

  private normalizeAiDraftToHtml(value: string): string {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return '';

    // Strip common Markdown code fences.
    const withoutFences = trimmed
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    if (!withoutFences) return '';

    // If it already looks like HTML, keep it as-is.
    if (/<\s*\/?\s*[a-z][^>]*>/i.test(withoutFences)) {
      return withoutFences;
    }

    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Convert plain text into paragraphs.
    const paragraphs = withoutFences
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p).replace(/\n+/g, '<br />')}</p>`);

    return paragraphs.join('');
  }

  acceptDraft(): void {
    if (this.readOnly) return;
    if (!this.aiDraft) return;

    this.aiErrorMessage = null;
    this.reportContent = this.aiDraft;
    this._content = this.reportContent;
    this.contentChange.emit(this.reportContent);
    this.aiDraft = null;

    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }
  }

  refuseDraft(): void {
    this.aiDraft = null;
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }
  }

  ngOnDestroy(): void {
    this.destroyTuiEditor();
    this.destroyOverlay();
  }

  private ensureOverlay(): void {
    if (this.overlayRef) return;

    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'tui-image-editor-overlay-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().top('0').left('0'),
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: ['tui-image-editor-overlay-panel'],
    });

    this.overlayRef.backdropClick().subscribe(() => this.cancelImageEdit());
    this.overlayRef
      .keydownEvents()
      .subscribe((event: KeyboardEvent) => event.key === 'Escape' && this.cancelImageEdit());
  }

  private destroyOverlay(): void {
    try {
      this.overlayRef?.dispose();
    } catch {
      // ignore
    }
    this.overlayRef = null;
  }

  private selectLocalImage(): void {
    if (this.readOnly) {
      return;
    }
    if (this.isGeneratingDraft) {
      return;
    }
    if (this.isUploadingImage || this.isImageEditorOpen) {
      return;
    }

    // Preserve current cursor position so we can insert the final image
    // even if focus changes while editing.
    try {
      const range = this.editor?.getSelection?.(true);
      this.lastSelectionIndex = range?.index ?? null;
    } catch {
      this.lastSelectionIndex = null;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      await this.openTuiImageEditor(file);
    };
  }

  cancelImageEdit(): void {
    if (this.isUploadingImage) return;
    this.isImageEditorOpen = false;
    this.isPreparingImageEditor = false;
    this.destroyTuiEditor();

    try {
      this.overlayRef?.detach();
    } catch {
      // ignore
    }

    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }
  }

  async applyImageEdit(): Promise<void> {
    if (this.readOnly) {
      this.cancelImageEdit();
      return;
    }
    if (!this.tuiEditor) {
      this.cancelImageEdit();
      return;
    }

    this.isUploadingImage = true;
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }

    try {
      const dataUrl = this.tuiEditor.toDataURL();
      const blob = await this.dataUrlToBlob(dataUrl);
      const file = new File([blob], 'report-image.png', { type: blob.type || 'image/png' });

      const imageUrl = await firstValueFrom(this.imgbbImageService.uploadImage(file));

      // Upload is finished; re-enable the editor before inserting.
      this.isUploadingImage = false;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }

      this.insertImage(imageUrl);
      this.isImageEditorOpen = false;
      this.destroyTuiEditor();

      try {
        this.overlayRef?.detach();
      } catch {
        // ignore
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Edited image upload failed', e);
    } finally {
      this.isUploadingImage = false;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    }
  }

  private async openTuiImageEditor(file: File): Promise<void> {
    this.ensureOverlay();
    if (!this.overlayRef || !this.imageEditorPortal) {
      return;
    }

    if (!this.overlayRef.hasAttached()) {
      this.overlayRef.attach(this.imageEditorPortal);
    }

    this.isImageEditorOpen = true;
    this.isPreparingImageEditor = true;
    try {
      this.cdr.detectChanges();
    } catch {
      // ignore
    }

    // Wait a tick so the overlay + host element renders before initialization.
    await new Promise<void>((resolve) => setTimeout(resolve));

    try {
      await this.initTuiEditor(file);
    } finally {
      this.isPreparingImageEditor = false;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    }
  }

  private async initTuiEditor(file: File): Promise<void> {
    const host = (this.overlayRef?.overlayElement?.querySelector('[data-tui-editor-host]') ??
      null) as HTMLElement | null;
    if (!host) {
      return;
    }

    this.destroyTuiEditor();

    const { default: ImageEditor } = (await import('tui-image-editor')) as any;

    this.tuiObjectUrl = URL.createObjectURL(file);
    host.innerHTML = '';

    this.tuiEditor = new ImageEditor(host, {
      includeUI: {
        loadImage: {
          path: this.tuiObjectUrl,
          name: file.name || 'image',
        },
        menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'text', 'filter'],
        initMenu: 'filter',
        uiSize: {
          width: '100%',
          height: '600px',
        },
        menuBarPosition: 'bottom',
      },
      cssMaxWidth: 900,
      cssMaxHeight: 520,
    });
  }

  private destroyTuiEditor(): void {
    try {
      this.tuiEditor?.destroy?.();
    } catch {
      // ignore
    }
    this.tuiEditor = null;

    if (this.tuiObjectUrl) {
      try {
        URL.revokeObjectURL(this.tuiObjectUrl);
      } catch {
        // ignore
      }
      this.tuiObjectUrl = null;
    }
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
  }

  private insertImage(imageUrl: string): void {
    if (this.readOnly) {
      return;
    }
    const safeUrl = String(imageUrl).replace(/\"/g, '&quot;');

    const appendToModel = () => {
      const appended = `${this.reportContent || ''}<p><img src=\"${safeUrl}\" /></p>`;
      this.onReportContentChange(appended);
    };

    const syncModelFromEditor = () => {
      const htmlFromRoot = this.editor?.root?.innerHTML;
      if (typeof htmlFromRoot === 'string') {
        this.onReportContentChange(htmlFromRoot);
        return;
      }

      // Some builds expose the editable DOM under container/ql-editor.
      const qlEditor = this.editor?.container?.querySelector?.('.ql-editor') as HTMLElement | null;
      if (qlEditor?.innerHTML) {
        this.onReportContentChange(qlEditor.innerHTML);
      }
    };

    // If we don't have a Quill instance, fall back to updating ngModel.
    if (!this.editor) {
      appendToModel();
      return;
    }

    try {
      const range = this.editor.getSelection?.(true);
      const length = typeof this.editor.getLength === 'function' ? this.editor.getLength() : 0;
      const index = range?.index ?? this.lastSelectionIndex ?? Math.max(0, length - 1);

      // Most reliable way to keep Quill + ngx-quill model in sync.
      if (this.editor.clipboard?.dangerouslyPasteHTML) {
        this.editor.clipboard.dangerouslyPasteHTML(
          index,
          `<p><img src="${safeUrl}" /></p>`,
          'user',
        );
      } else if (this.editor.insertEmbed) {
        this.editor.insertEmbed(index, 'image', imageUrl, 'user');
      } else {
        appendToModel();
        return;
      }

      this.editor.setSelection?.(index + 1, 0, 'silent');
      this.editor.update?.('user');
      syncModelFromEditor();
    } catch {
      appendToModel();
    } finally {
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    }
  }
}
