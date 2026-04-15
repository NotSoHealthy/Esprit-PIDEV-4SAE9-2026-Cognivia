import { Injectable } from '@angular/core';
import { Prescription, PrescriptionItem } from '../models/prescription.model';

@Injectable({
  providedIn: 'root',
})
export class PrescriptionPdfService {
  private readonly pageMargin = 36;
  private readonly jsPdfScriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  private jsPdfScriptLoadPromise: Promise<void> | null = null;

  async generatePrescriptionPdfBlob(prescription: Prescription): Promise<Blob> {
    const JsPdfCtor = await this.loadJsPdfConstructor();
    const doc = new JsPdfCtor({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = this.drawHeader(doc, prescription, pageWidth);
    const contentRight = pageWidth - this.pageMargin;

    doc.setTextColor(50, 56, 88);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Medication Plan', this.pageMargin, y);
    doc.setDrawColor(194, 201, 229);
    doc.line(this.pageMargin, y + 8, contentRight, y + 8);
    y += 20;

    const items = prescription.items ?? [];
    if (items.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(90, 97, 125);
      doc.text('No medication entries were found for this prescription.', this.pageMargin, y);
      y += 32;
    }

    for (const item of items) {
      const cardHeight = 96;
      if (y + cardHeight + 72 > pageHeight) {
        doc.addPage();
        this.drawPageDecoration(doc, pageWidth, pageHeight);
        y = this.pageMargin + 24;
      }

      await this.drawMedicationCard(doc, item, this.pageMargin, y, contentRight - this.pageMargin, cardHeight);
      y += cardHeight + 14;
    }

    if (y + 120 > pageHeight) {
      doc.addPage();
      this.drawPageDecoration(doc, pageWidth, pageHeight);
      y = this.pageMargin + 24;
    }

    this.drawFooter(doc, prescription, y, pageWidth);

    return doc.output('blob');
  }

  private drawHeader(doc: any, prescription: Prescription, pageWidth: number): number {
    this.drawPageDecoration(doc, pageWidth, doc.internal.pageSize.getHeight());

    doc.setFillColor(77, 92, 171);
    doc.roundedRect(this.pageMargin, this.pageMargin, pageWidth - this.pageMargin * 2, 104, 14, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Medical Prescription', this.pageMargin + 18, this.pageMargin + 34);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prescription #: ${prescription.code ?? prescription.id ?? 'N/A'}`, this.pageMargin + 18, this.pageMargin + 58);
    doc.text(`Doctor: ${prescription.doctorName ?? 'N/A'}`, this.pageMargin + 18, this.pageMargin + 76);

    doc.text(
      `Issued: ${this.formatDate(prescription.createdAt)}   |   Expires: ${this.formatDate(prescription.expiresAt)}`,
      this.pageMargin + 18,
      this.pageMargin + 94
    );

    const infoTop = this.pageMargin + 120;
    const infoWidth = pageWidth - this.pageMargin * 2;
    const description = prescription.description?.trim() || 'No additional instructions provided.';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const descriptionLines = doc.splitTextToSize(description, infoWidth - 30);
    const infoHeight = 74 + descriptionLines.length * 12;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(219, 225, 246);
    doc.roundedRect(this.pageMargin, infoTop, infoWidth, infoHeight, 12, 12, 'FD');

    doc.setDrawColor(168, 178, 221);
    doc.setLineWidth(1.1);
    doc.line(this.pageMargin + 14, infoTop + 14, this.pageMargin + 14, infoTop + infoHeight - 14);
    doc.setLineWidth(0.6);
    doc.setDrawColor(221, 226, 245);
    doc.line(this.pageMargin + 16, infoTop + 36, this.pageMargin + infoWidth - 16, infoTop + 36);

    doc.setTextColor(44, 54, 104);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Patient:', this.pageMargin + 24, infoTop + 24);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(64, 70, 99);
    doc.text(prescription.patientName ?? 'N/A', this.pageMargin + 74, infoTop + 24);

    doc.setTextColor(60, 68, 106);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', this.pageMargin + 24, infoTop + 54);

    doc.setTextColor(88, 95, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(descriptionLines, this.pageMargin + 24, infoTop + 70);

    return infoTop + infoHeight + 26;
  }

  private async drawMedicationCard(
    doc: any,
    item: PrescriptionItem,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    doc.setFillColor(248, 249, 255);
    doc.setDrawColor(223, 227, 244);
    doc.roundedRect(x, y, width, height, 12, 12, 'FD');

    const imageBox = {
      x: x + 12,
      y: y + 12,
      size: 72,
    };

    const imageUrl = item.medication?.imageUrl;
    const imageData = imageUrl ? await this.urlToDataUrl(imageUrl) : null;

    if (imageData) {
      try {
        doc.addImage(imageData, 'JPEG', imageBox.x, imageBox.y, imageBox.size, imageBox.size);
      } catch {
        this.drawImagePlaceholder(doc, imageBox.x, imageBox.y, imageBox.size, item.medication?.name);
      }
    } else {
      this.drawImagePlaceholder(doc, imageBox.x, imageBox.y, imageBox.size, item.medication?.name);
    }

    const textX = imageBox.x + imageBox.size + 16;
    const textWidth = width - (textX - x) - 14;

    doc.setTextColor(38, 45, 77);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const medicationName = item.medication?.name?.trim() || 'Unknown medication';
    const nameLines = doc.splitTextToSize(medicationName, textWidth);
    doc.text(nameLines, textX, y + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(78, 84, 115);

    const quantityText = `Quantity: ${item.quantity ?? 0}`;
    const frequencyText = `Frequency: ${this.toReadableFrequency(item.frequency)}`;

    doc.text(quantityText, textX, y + 54);
    doc.text(frequencyText, textX, y + 74);
  }

  private drawFooter(doc: any, prescription: Prescription, y: number, pageWidth: number): void {
    doc.setDrawColor(223, 227, 244);
    doc.line(this.pageMargin, y, pageWidth - this.pageMargin, y);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(105, 111, 142);
    doc.text('Please follow your doctor instructions carefully and consult your pharmacist if needed.', this.pageMargin, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${new Date().toLocaleString()} for ${prescription.patientName ?? 'patient'}`,
      this.pageMargin,
      y + 36
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(77, 92, 171);
    doc.text('Cognivia', pageWidth - this.pageMargin - 56, y + 36);
  }

  private drawPageDecoration(doc: any, pageWidth: number, pageHeight: number): void {
    doc.setFillColor(244, 246, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(232, 236, 252);
    doc.circle(pageWidth - 44, 32, 42, 'F');

    doc.setFillColor(230, 251, 242);
    doc.circle(28, pageHeight - 24, 48, 'F');
  }

  private drawImagePlaceholder(doc: any, x: number, y: number, size: number, label?: string): void {
    doc.setFillColor(231, 236, 255);
    doc.roundedRect(x, y, size, size, 10, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(77, 92, 171);

    const letter = (label ?? '?').trim().charAt(0).toUpperCase() || '?';
    doc.text(letter, x + size / 2 - 6, y + size / 2 + 7);
  }

  private toReadableFrequency(frequency: unknown): string {
    const raw = `${frequency ?? ''}`.trim();
    if (!raw) {
      return 'N/A';
    }

    return raw
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private formatDate(date?: string): string {
    if (!date) {
      return 'N/A';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }

    return parsed.toLocaleDateString();
  }

  private async urlToDataUrl(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return await this.blobToDataUrl(blob);
    } catch {
      return null;
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('Unable to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  }

  private async loadJsPdfConstructor(): Promise<any> {
    await this.ensureJsPdfLoaded();

    const maybeWindow = window as Window & {
      jspdf?: {
        jsPDF: any;
      };
    };

    const ctor = maybeWindow.jspdf?.jsPDF;
    if (!ctor) {
      throw new Error('jsPDF is not loaded. Please check script configuration.');
    }

    return ctor;
  }

  private async ensureJsPdfLoaded(): Promise<void> {
    const maybeWindow = window as Window & {
      jspdf?: {
        jsPDF: any;
      };
    };

    if (maybeWindow.jspdf?.jsPDF) {
      return;
    }

    if (!this.jsPdfScriptLoadPromise) {
      this.jsPdfScriptLoadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${this.jsPdfScriptUrl}"]`) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Failed to load jsPDF script')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = this.jsPdfScriptUrl;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load jsPDF script'));
        document.head.appendChild(script);
      });
    }

    await this.jsPdfScriptLoadPromise;
  }
}
