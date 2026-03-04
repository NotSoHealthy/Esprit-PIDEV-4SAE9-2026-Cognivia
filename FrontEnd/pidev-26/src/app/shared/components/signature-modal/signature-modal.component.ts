import { Component, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-signature-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './signature-modal.component.html',
    styleUrl: './signature-modal.component.css'
})
export class SignatureModalComponent implements AfterViewInit {
    @ViewChild('signatureCanvas') canvas!: ElementRef<HTMLCanvasElement>;
    @Output() onSave = new EventEmitter<string>();
    @Output() onClose = new EventEmitter<void>();

    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;

    ngAfterViewInit() {
        this.ctx = this.canvas.nativeElement.getContext('2d')!;
        this.ctx.lineWidth = 2;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#334155';

        // Set fixed size for signature capture
        this.canvas.nativeElement.width = 400;
        this.canvas.nativeElement.height = 200;
    }

    startDrawing(event: MouseEvent | TouchEvent) {
        this.isDrawing = true;
        const pos = this.getPos(event);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }

    draw(event: MouseEvent | TouchEvent) {
        if (!this.isDrawing) return;
        const pos = this.getPos(event);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        event.preventDefault();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }

    done() {
        const dataUrl = this.canvas.nativeElement.toDataURL('image/png');
        this.onSave.emit(dataUrl);
    }

    cancel() {
        this.onClose.emit();
    }

    private getPos(event: MouseEvent | TouchEvent): { x: number; y: number } {
        const rect = this.canvas.nativeElement.getBoundingClientRect();
        if (event instanceof MouseEvent) {
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        } else {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        }
    }
}
