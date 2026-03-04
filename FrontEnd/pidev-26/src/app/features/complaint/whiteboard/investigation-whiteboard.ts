import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  LoadedImage,
} from 'ngx-image-cropper';
import { Canvas, FabricImage, PencilBrush } from 'fabric';
import { ComplaintModel } from '../model/complaint.model';
import { ComplaintService } from '../service/complaint.service';

@Component({
  selector: 'app-investigation-whiteboard',
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './investigation-whiteboard.html',
  styleUrl: './investigation-whiteboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestigationWhiteboardComponent implements AfterViewInit, OnDestroy {
  private readonly complaintService = inject(ComplaintService);

  @Input() complaint: ComplaintModel | null = null;
  @Output() whiteboardSaved = new EventEmitter<void>();

  @ViewChild('whiteboardCanvas', { static: true })
  whiteboardCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasShell', { static: true })
  canvasShellRef!: ElementRef<HTMLDivElement>;

  @ViewChild('imageUploadInput', { static: true })
  imageUploadInputRef!: ElementRef<HTMLInputElement>;

  readonly drawingMode = signal(false);
  readonly brushColor = signal('#1e3a8a');
  readonly brushSize = signal(4);
  readonly hasSelectedObject = signal(false);
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);
  readonly imageChangedEvent = signal<Event | null>(null);
  readonly uploadedImageSource = signal<string | null>(null);
  readonly croppedImageBase64 = signal<string | null>(null);
  readonly cropperReady = signal(false);
  readonly imageLoadError = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuceeded = signal(false);

  private board: Canvas | null = null;
  private generatedObjectUrl: string | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: any = null;
  private readonly historyStates: string[] = [];
  private historyIndex = -1;
  private isRestoringHistory = false;
  private suppressHistoryTracking = false;

  ngAfterViewInit(): void {
    this.resizeCanvasToContainer();

    this.board = new Canvas(this.whiteboardCanvasRef.nativeElement, {
      width: this.canvasShellRef.nativeElement.clientWidth || 980,
      height: (this.canvasShellRef.nativeElement.clientWidth || 980) * 0.55,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });

    this.board.on('selection:created', this.updateSelectionState);
    this.board.on('selection:updated', this.updateSelectionState);
    this.board.on('selection:cleared', this.updateSelectionState);
    this.board.on('object:added', this.trackBoardChange);
    this.board.on('object:modified', this.trackBoardChange);
    this.board.on('object:removed', this.trackBoardChange);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        // Debounce to prevent ResizeObserver loop errors
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => this.resizeCanvasToContainer(), 50);
      });
      this.resizeObserver.observe(this.canvasShellRef.nativeElement);
    }

    this.syncBrush();

    // Load saved whiteboard data if available
    if (this.complaint?.whiteboardData) {
      this.loadWhiteboardData(this.complaint.whiteboardData);
    } else {
      this.pushHistoryState();
    }
  }

  ngOnDestroy(): void {
    this.revokeGeneratedObjectUrl();
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.board) {
      this.board.off('selection:created', this.updateSelectionState);
      this.board.off('selection:updated', this.updateSelectionState);
      this.board.off('selection:cleared', this.updateSelectionState);
      this.board.off('object:added', this.trackBoardChange);
      this.board.off('object:modified', this.trackBoardChange);
      this.board.off('object:removed', this.trackBoardChange);
      this.board.dispose();
      this.board = null;
    }
  }

  undo(): void {
    if (!this.board || this.historyIndex <= 0) {
      return;
    }

    this.historyIndex -= 1;
    this.restoreFromHistory(this.historyStates[this.historyIndex]);
  }

  redo(): void {
    if (!this.board || this.historyIndex >= this.historyStates.length - 1) {
      return;
    }

    this.historyIndex += 1;
    this.restoreFromHistory(this.historyStates[this.historyIndex]);
  }

  toggleDrawingMode(): void {
    if (!this.board) return;

    const enabled = !this.drawingMode();
    this.drawingMode.set(enabled);
    this.board.isDrawingMode = enabled;
    this.syncBrush();
  }

  setBrushColor(color: string): void {
    this.brushColor.set(color);
    this.syncBrush();
  }

  onBrushColorInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.setBrushColor(target.value);
  }

  setBrushSize(sizeValue: string): void {
    const parsed = Number(sizeValue);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.brushSize.set(Math.min(40, Math.max(1, parsed)));
    this.syncBrush();
  }

  onBrushSizeInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.setBrushSize(target.value);
  }

  deleteSelectedObject(): void {
    if (!this.board) return;

    const activeObject = this.board.getActiveObject();
    if (!activeObject) return;

    this.board.remove(activeObject);
    this.board.discardActiveObject();
    this.board.requestRenderAll();
    this.hasSelectedObject.set(false);
  }

  clearBoard(): void {
    if (!this.board) return;

    this.withHistorySuppressed(() => {
      const objects = [...this.board?.getObjects() ?? []];
      objects.forEach((object) => this.board?.remove(object));
      this.board?.discardActiveObject();
      this.board?.requestRenderAll();
      this.hasSelectedObject.set(false);
    });

    this.pushHistoryState();
  }

  onFileSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    this.revokeGeneratedObjectUrl();
    this.imageChangedEvent.set(event);
    this.uploadedImageSource.set(null);
    this.croppedImageBase64.set(null);
    this.cropperReady.set(false);
    this.imageLoadError.set(null);

    const selectedFile = input.files?.[0];
    if (!selectedFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.uploadedImageSource.set(result);
      }
    };
    reader.onerror = () => {
      this.imageLoadError.set('Could not read the selected image. Please try a different file.');
    };
    reader.readAsDataURL(selectedFile);
  }

  onImageCropped(event: ImageCroppedEvent): void {
    const outputFromEvent = this.extractCroppedImageSource(event);
    this.croppedImageBase64.set(outputFromEvent);
  }

  onImageLoaded(_: LoadedImage): void {
    this.cropperReady.set(true);
    this.imageLoadError.set(null);
  }

  onCropLoadFailure(): void {
    this.cropperReady.set(false);
    this.imageLoadError.set('Could not load the selected image. Please try a different file.');
  }

  cancelCrop(): void {
    this.revokeGeneratedObjectUrl();
    this.imageChangedEvent.set(null);
    this.uploadedImageSource.set(null);
    this.croppedImageBase64.set(null);
    this.cropperReady.set(false);
    this.imageLoadError.set(null);
    this.imageUploadInputRef.nativeElement.value = '';
  }

  async addCroppedImage(): Promise<void> {
    if (!this.board) return;

    const imageData = this.croppedImageBase64() || this.uploadedImageSource();
    if (!imageData) return;

    try {
      const image = await FabricImage.fromURL(imageData);
      const boardWidth = this.board.getWidth();
      const boardHeight = this.board.getHeight();

      const sourceWidth = image.width ?? 1;
      const sourceHeight = image.height ?? 1;
      const maxWidth = boardWidth * 0.5;
      const maxHeight = boardHeight * 0.5;
      const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);

      image.set({
        left: boardWidth / 2,
        top: boardHeight / 2,
        originX: 'center',
        originY: 'center',
      });
      image.scale(scale);

      this.board.add(image);
      this.board.setActiveObject(image);
      this.board.requestRenderAll();
      this.hasSelectedObject.set(true);
      this.cancelCrop();
    } catch {
      this.imageLoadError.set('Could not add the cropped image to the board. Please try again.');
    }
  }

  private syncBrush(): void {
    if (!this.board) return;

    if (!(this.board.freeDrawingBrush instanceof PencilBrush)) {
      this.board.freeDrawingBrush = new PencilBrush(this.board);
    }

    this.board.freeDrawingBrush.width = this.brushSize();
    this.board.freeDrawingBrush.color = this.brushColor();
  }

  private readonly updateSelectionState = (): void => {
    this.hasSelectedObject.set(!!this.board?.getActiveObject());
  };

  private readonly trackBoardChange = (): void => {
    if (this.isRestoringHistory || this.suppressHistoryTracking) {
      return;
    }

    this.pushHistoryState();
  };

  private extractCroppedImageSource(event: ImageCroppedEvent): string | null {
    if (event.base64) {
      return event.base64;
    }

    const objectUrl = (event as ImageCroppedEvent & { objectUrl?: string | null }).objectUrl;
    if (typeof objectUrl === 'string' && objectUrl.length > 0) {
      return objectUrl;
    }

    if (event.blob instanceof Blob) {
      this.revokeGeneratedObjectUrl();
      this.generatedObjectUrl = URL.createObjectURL(event.blob);
      return this.generatedObjectUrl;
    }

    return null;
  }

  private revokeGeneratedObjectUrl(): void {
    if (!this.generatedObjectUrl) {
      return;
    }

    URL.revokeObjectURL(this.generatedObjectUrl);
    this.generatedObjectUrl = null;
  }

  private pushHistoryState(): void {
    if (!this.board) {
      return;
    }

    const nextState = JSON.stringify(this.board.toJSON());
    const currentState = this.historyStates[this.historyIndex];

    if (currentState === nextState) {
      this.syncUndoRedoFlags();
      return;
    }

    if (this.historyIndex < this.historyStates.length - 1) {
      this.historyStates.splice(this.historyIndex + 1);
    }

    this.historyStates.push(nextState);
    this.historyIndex = this.historyStates.length - 1;

    const maxHistory = 50;
    if (this.historyStates.length > maxHistory) {
      this.historyStates.shift();
      this.historyIndex = this.historyStates.length - 1;
    }

    this.syncUndoRedoFlags();
  }

  private restoreFromHistory(serializedState: string): void {
    if (!this.board) {
      return;
    }

    this.isRestoringHistory = true;
    this.board.loadFromJSON(serializedState).then(() => {
      this.board?.requestRenderAll();
      this.hasSelectedObject.set(false);
      this.isRestoringHistory = false;
      this.syncUndoRedoFlags();
    });
  }

  private syncUndoRedoFlags(): void {
    this.canUndo.set(this.historyIndex > 0);
    this.canRedo.set(this.historyIndex >= 0 && this.historyIndex < this.historyStates.length - 1);
  }

  private withHistorySuppressed(action: () => void): void {
    this.suppressHistoryTracking = true;
    try {
      action();
    } finally {
      this.suppressHistoryTracking = false;
    }
  }

  private resizeCanvasToContainer(): void {
    if (!this.board) {
      return;
    }

    const shellWidth = this.canvasShellRef.nativeElement.clientWidth;
    if (shellWidth <= 0) {
      return;
    }

    const minWidth = 320;
    const maxWidth = 1700;
    const width = Math.max(minWidth, Math.min(maxWidth, shellWidth));
    const ratio = 540 / 980;
    const height = Math.round(width * ratio);

    const canvasElement = this.whiteboardCanvasRef.nativeElement as HTMLCanvasElement;
    canvasElement.width = width;
    canvasElement.height = height;

    this.board.setDimensions({ width, height }, { cssOnly: false });
    this.board.requestRenderAll();
  }

  private loadWhiteboardData(whiteboardData: unknown): void {
    if (!this.board) {
      return;
    }

    try {
      // Parse the data: backend might send it as string or object
      let parsedData: any;
      if (typeof whiteboardData === 'string') {
        parsedData = JSON.parse(whiteboardData);
      } else {
        parsedData = whiteboardData;
      }

      this.isRestoringHistory = true;
      this.board.loadFromJSON(parsedData).then(() => {
        this.board?.requestRenderAll();
        this.hasSelectedObject.set(false);
        this.isRestoringHistory = false;
        this.pushHistoryState();
      }).catch(() => {
        this.isRestoringHistory = false;
        this.saveError.set('Could not load saved whiteboard. Starting fresh.');
        this.pushHistoryState();
      });
    } catch {
      this.saveError.set('Could not load saved whiteboard. Starting fresh.');
      this.pushHistoryState();
    }
  }

  saveWhiteboard(): void {
    if (!this.board || !this.complaint?.id) {
      this.saveError.set('Whiteboard is not ready or complaint not found.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuceeded.set(false);

    try {
      const whiteboardJson = JSON.stringify(this.board.toJSON());
      
      this.complaintService.saveWhiteboardData(this.complaint, whiteboardJson).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saveSuceeded.set(true);
          this.whiteboardSaved.emit();
          setTimeout(() => this.saveSuceeded.set(false), 3000);
        },
        error: () => {
          this.isSaving.set(false);
          this.saveError.set('Failed to save whiteboard. Please try again.');
        },
      });
    } catch {
      this.isSaving.set(false);
      this.saveError.set('Could not serialize whiteboard data. Please try again.');
    }
  }
}