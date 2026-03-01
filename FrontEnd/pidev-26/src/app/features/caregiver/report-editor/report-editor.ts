import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { QuillModule } from 'ngx-quill';
import { firstValueFrom } from 'rxjs';

import { ImgbbImageService } from '../../../core/media/imgbb-image.service';

@Component({
  selector: 'app-report-editor',
  standalone: true,
  imports: [FormsModule, NzInputModule, NzFormModule, NzSpinModule, QuillModule],
  templateUrl: './report-editor.html',
  styleUrl: './report-editor.css',
})
export class ReportEditor {
  @Input() visit: any | null = null;
  @Input() readOnly = false;

  private readonly cdr = inject(ChangeDetectorRef);

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

  private readonly imgbbImageService = inject(ImgbbImageService);
  private editor: any | null = null;

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
    this.reportContent = value ?? '';
    this._content = this.reportContent;
    this.contentChange.emit(this.reportContent);
  }

  private selectLocalImage(): void {
    if (this.isUploadingImage) {
      return;
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

      this.isUploadingImage = true;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
      try {
        const imageUrl = await firstValueFrom(this.imgbbImageService.uploadImage(file));
        this.insertImage(imageUrl);
      } catch (e) {
        // keep UX minimal; callers can add toasts later
        // eslint-disable-next-line no-console
        console.error('Image upload failed', e);
      } finally {
        this.isUploadingImage = false;
        try {
          this.cdr.detectChanges();
        } catch {
          // ignore
        }
      }
    };
  }

  private insertImage(imageUrl: string): void {
    if (!this.editor) {
      return;
    }

    const range = this.editor.getSelection(true);
    const index = range?.index ?? this.editor.getLength();
    this.editor.insertEmbed(index, 'image', imageUrl, 'user');
    this.editor.setSelection(index + 1, 0, 'silent');
  }
}
