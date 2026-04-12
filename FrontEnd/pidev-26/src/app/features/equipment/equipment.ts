import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { EquipmentService } from './services/equipment-service';
import { MaintenanceService } from './maintenance/services/maintenance.service';
import { ReservationService } from './reservation/services/reservation.service';
import { EquipmentModel } from './models/equipment.model';
import { Maintenance } from './maintenance/models/maintenance.model';
import { ReservationModel } from './reservation/model/reservation.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, forkJoin } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

type EquipmentFormModel = Omit<EquipmentModel, 'id' | 'conditionScore'> & {
  conditionScore: number | null;
};

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.html',
  imports: [CommonModule, FormsModule, NzIconModule],
  styleUrls: ['./equipment.css']
})
export class Equipment implements OnInit {
  private static readonly MAX_EXTRACTED_TEXT_LENGTH = 15000;

  equipments: EquipmentModel[] = [];
  closestMaintenanceMap: Map<number, Maintenance | null> = new Map();
  closestReservationMap: Map<number, ReservationModel | null> = new Map();
  hoveredEquipmentId: number | null = null;
  hoveredDetailEquipmentId: number | null = null;
  isModalOpen = false;
  isDeleteModalOpen = false;
  isBulkDeleteModalOpen = false;
  isDetailModalOpen = false;
  isEditMode = false;
  editingEquipmentId: number | null = null;
  equipmentToDelete: EquipmentModel | null = null;
  equipmentToDetail: EquipmentModel | null = null;
  isSaving = false;
  isExtractingFromDocument = false;
  isPrefilledFromDocument = false;
  formError = '';
  extractionError = '';
  deleteError = '';
  bulkDeleteError = '';
  selectedIds = new Set<number>();
  selectedImage: File | null = null;
  imagePreview = '';
  isImagePreviewVisible = true;
  openDropdownId: number | null = null;
  viewMode: 'cards' | 'compact' = 'cards';
  newEquipment: EquipmentFormModel = {
    name: '',
    description: '',
    status: 'AVAILABLE',
    conditionScore: null,
    imageUrl: ''
  };

  constructor(
    private equipmentService: EquipmentService,
    private maintenanceService: MaintenanceService,
    private reservationService: ReservationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  private static isPdfWorkerConfigured = false;

  ngOnInit(): void {
    this.loadEquipments();
    console.log('Equipments loaded:', this.equipments);
  }

  loadEquipments(): void {
    this.equipmentService.getAll().subscribe(data => {
      this.equipments = data;
      this.clearSelection();
      this.closestMaintenanceMap.clear();
      this.closestReservationMap.clear();
      
      // Fetch closest maintenance for equipments with MAINTENANCE status
      const maintenanceRequests = data
        .filter(eq => eq.status === 'MAINTENANCE')
        .map(eq => 
          this.maintenanceService.getClosestMaintenance(eq.id).subscribe({
            next: (maintenance) => {
              this.closestMaintenanceMap.set(eq.id, maintenance);
              console.log(`Closest maintenance for ${eq.name}:`, maintenance);
            },
            error: (err) => {
              console.error(`Failed to fetch closest maintenance for equipment ${eq.id}:`, err);
              this.closestMaintenanceMap.set(eq.id, null);
            }
          })
        );

      // Fetch closest reservation for equipments with RESERVED status
      const reservationRequests = data
        .filter(eq => eq.status === 'RESERVED')
        .map(eq => 
          this.reservationService.getClosestReservation(eq.id).subscribe({
            next: (reservation) => {
              this.closestReservationMap.set(eq.id, reservation);
              console.log(`Closest reservation for ${eq.name}:`, reservation);
            },
            error: (err) => {
              console.error(`Failed to fetch closest reservation for equipment ${eq.id}:`, err);
              this.closestReservationMap.set(eq.id, null);
            }
          })
        );
      
      this.cdr.detectChanges();
      for (let eq of this.equipments) {
        console.log(`Equipment: ${eq.name}, Condition Score: ${eq.conditionScore}`);
      }
    });
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelection(equipment: EquipmentModel, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedIds.add(equipment.id);
    } else {
      this.selectedIds.delete(equipment.id);
    }
  }

  toggleSelectAll(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.equipments.forEach((equipment) => this.selectedIds.add(equipment.id));
    } else {
      this.clearSelection();
    }
  }

  openModal(): void {
    this.isEditMode = false;
    this.editingEquipmentId = null;
    this.isPrefilledFromDocument = false;
    this.formError = '';
    this.extractionError = '';
    this.selectedImage = null;
    this.imagePreview = '';
    this.isImagePreviewVisible = true;
    this.isModalOpen = true;
  }

  openEditModal(equipment: EquipmentModel): void {
    this.isEditMode = true;
    this.editingEquipmentId = equipment.id;
    this.isPrefilledFromDocument = false;
    this.newEquipment = {
      name: equipment.name,
      description: equipment.description,
      status: equipment.status,
      conditionScore: equipment.conditionScore,
      imageUrl: equipment.imageUrl
    };
    this.imagePreview = equipment.imageUrl;
    this.selectedImage = null;
    this.isImagePreviewVisible = true;
    this.formError = '';
    this.extractionError = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSaving = false;
    this.isEditMode = false;
    this.editingEquipmentId = null;
    this.resetForm();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedImage = null;
      this.imagePreview = '';
      this.isImagePreviewVisible = true;
      return;
    }

    this.selectedImage = input.files[0];
    this.imagePreview = URL.createObjectURL(this.selectedImage);
    this.isImagePreviewVisible = true;
  }

  toggleImagePreview(): void {
    this.isImagePreviewVisible = !this.isImagePreviewVisible;
  }

  submitEquipment(): void {
    if (this.isSaving) {
      return;
    }

    this.formError = '';

    if (!this.isEditMode && !this.selectedImage) {
      this.formError = 'Please select an image for the equipment.';
      return;
    }

    const conditionScore = Number(this.newEquipment.conditionScore);
    if (this.newEquipment.conditionScore === null || Number.isNaN(conditionScore)) {
      this.formError = 'Condition score is required.';
      return;
    }

    if (conditionScore < 0 || conditionScore > 100) {
      this.formError = 'Condition score must be between 0 and 100.';
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.editingEquipmentId !== null) {
      // Edit mode: only upload new image if one was selected
      if (this.selectedImage) {
        this.equipmentService
          .uploadImage(this.selectedImage)
          .pipe(
            switchMap((imageUrl) =>
              this.equipmentService.update({
                id: this.editingEquipmentId!,
                ...this.newEquipment,
                conditionScore,
                status: this.newEquipment.status,
                imageUrl
              })
            )
          )
          .subscribe({
            next: () => {
              this.isSaving = false;
              this.closeModal();
              this.loadEquipments();
            },
            error: () => {
              this.isSaving = false;
              this.formError = 'Unable to update equipment right now. Please try again.';
            }
          });
      } else {
        // No new image selected, update without changing image
        this.equipmentService.update({
          id: this.editingEquipmentId,
          ...this.newEquipment,
          conditionScore,
          status: this.newEquipment.status
        }).subscribe({
          next: () => {
            this.isSaving = false;
            this.closeModal();
            this.loadEquipments();
          },
          error: () => {
            this.isSaving = false;
            this.formError = 'Unable to update equipment right now. Please try again.';
          }
        });
      }
    } else {
      // Add mode
      this.equipmentService
        .uploadImage(this.selectedImage!)
        .pipe(
          switchMap((imageUrl) =>
            this.equipmentService.create({
              ...this.newEquipment,
              conditionScore,
              status: 'AVAILABLE',
              imageUrl
            })
          )
        )
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.closeModal();
            this.loadEquipments();
          },
          error: () => {
            this.isSaving = false;
            this.formError = 'Unable to add equipment right now. Please try again.';
          }
        });
    }
  }

  async onExtractionFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    this.extractionError = '';
    this.isExtractingFromDocument = true;

    try {
      const { text, firstImageFile } = await this.extractTextAndFirstImage(file);
      const sanitizedText = this.prepareTextForExtraction(text);

      if (!sanitizedText) {
        throw new Error('No usable text content found in the selected file.');
      }

      this.equipmentService.extractEquipmentFromText(sanitizedText).subscribe({
        next: (equipmentFromText) => {
          this.openModal();
          this.isPrefilledFromDocument = true;

          this.newEquipment.name = String(equipmentFromText?.name ?? '').trim();
          this.newEquipment.description = String(equipmentFromText?.description ?? '').trim();
          this.newEquipment.conditionScore =
            typeof equipmentFromText?.conditionScore === 'number'
              ? equipmentFromText.conditionScore
              : null;

          if (firstImageFile) {
            this.selectedImage = firstImageFile;
            if (this.imagePreview) {
              URL.revokeObjectURL(this.imagePreview);
            }
            this.imagePreview = URL.createObjectURL(firstImageFile);
            this.isImagePreviewVisible = true;
          }

          this.isExtractingFromDocument = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.extractionError =
            err?.status === 400
              ? 'The document content is too long or contains unsupported characters. Try a shorter/cleaner file.'
              : 'Failed to extract equipment information from the document.';
          this.isExtractingFromDocument = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      this.extractionError =
        error instanceof Error ? error.message : 'Failed to process the selected file.';
      this.isExtractingFromDocument = false;
      this.cdr.detectChanges();
    }
  }

  private async extractTextAndFirstImage(
    file: File
  ): Promise<{ text: string; firstImageFile: File | null }> {
    const extension = file.name.toLowerCase().split('.').pop();
    const arrayBuffer = await file.arrayBuffer();

    if (extension === 'pdf') {
      return this.extractFromPdf(arrayBuffer);
    }

    if (extension === 'docx') {
      return this.extractFromDocx(arrayBuffer);
    }

    if (extension === 'doc') {
      throw new Error('Legacy .doc files are not supported. Please use .docx or .pdf.');
    }

    throw new Error('Unsupported file type. Please upload a .pdf or .docx file.');
  }

  private prepareTextForExtraction(text: string): string {
    if (!text) return '';

    // Remove problematic control characters while preserving line breaks and tabs.
    let cleaned = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');

    // Normalize whitespace to reduce payload size without losing semantic structure.
    cleaned = cleaned
      .replace(/\r\n?/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleaned.length <= Equipment.MAX_EXTRACTED_TEXT_LENGTH) {
      return cleaned;
    }

    // Keep the beginning and tail of the document, where key summary info often appears.
    const headLength = Math.floor(Equipment.MAX_EXTRACTED_TEXT_LENGTH * 0.8);
    const tailLength = Equipment.MAX_EXTRACTED_TEXT_LENGTH - headLength - 24;
    return `${cleaned.slice(0, headLength)}\n\n[...trimmed...]\n\n${cleaned.slice(-tailLength)}`;
  }

  private async extractFromDocx(
    arrayBuffer: ArrayBuffer
  ): Promise<{ text: string; firstImageFile: File | null }> {
    const rawText = await mammoth.extractRawText({ arrayBuffer });

    let firstImageFile: File | null = null;
    await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement(async (image: any) => {
          if (!firstImageFile) {
            const base64 = await image.read('base64');
            const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
            const blob = new Blob([bytes], { type: image.contentType });
            firstImageFile = new File([blob], 'docx-image.png', { type: image.contentType });
          }

          return { src: '' };
        })
      }
    );

    return {
      text: rawText.value ?? '',
      firstImageFile
    };
  }

  private async extractFromPdf(
    arrayBuffer: ArrayBuffer
  ): Promise<{ text: string; firstImageFile: File | null }> {
    if (!Equipment.isPdfWorkerConfigured) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString();
      Equipment.isPdfWorkerConfigured = true;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let combinedText = '';
    let firstImageFile: File | null = null;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();
      combinedText +=
        textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ')
          .trim() + '\n';

      if (!firstImageFile) {
        firstImageFile = await this.extractFirstImageFromPdfPage(page);
      }
    }

    return {
      text: combinedText,
      firstImageFile
    };
  }

  private async extractFirstImageFromPdfPage(page: any): Promise<File | null> {
    const operatorList = await page.getOperatorList();
    const imageOpCodes = [
      (pdfjsLib as any).OPS.paintImageXObject,
      (pdfjsLib as any).OPS.paintJpegXObject,
      (pdfjsLib as any).OPS.paintInlineImageXObject,
      (pdfjsLib as any).OPS.paintInlineImageXObjectGroup,
      (pdfjsLib as any).OPS.paintImageMaskXObject
    ];

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      if (!imageOpCodes.includes(operatorList.fnArray[i])) continue;

      const imageData = await this.resolvePdfImageData(page, operatorList.argsArray[i]);
      const file = await this.convertPdfImageDataToFile(imageData);
      if (file) {
        return file;
      }
    }

    return this.renderFirstPdfPageAsImage(page);
  }

  private async resolvePdfImageData(page: any, operatorArgs: any): Promise<any | null> {
    if (!operatorArgs || operatorArgs.length === 0) {
      return null;
    }

    const candidates = this.flattenPdfImageCandidates(operatorArgs);
    for (const candidate of candidates) {
      if (!candidate) continue;

      if (typeof candidate === 'string') {
        const resolved = await this.getPdfObject(page, candidate);
        if (resolved) {
          return resolved;
        }
        continue;
      }

      if (typeof candidate?.objId === 'string') {
        const resolved = await this.getPdfObject(page, candidate.objId);
        if (resolved) {
          return resolved;
        }
      }

      if (typeof candidate?.id === 'string') {
        const resolved = await this.getPdfObject(page, candidate.id);
        if (resolved) {
          return resolved;
        }
      }

      if ((candidate?.data && candidate?.width && candidate?.height) || candidate?.bitmap) {
        return candidate;
      }
    }

    return null;
  }

  private flattenPdfImageCandidates(value: any): any[] {
    if (!Array.isArray(value)) {
      return [value];
    }

    const flattened: any[] = [];
    for (const item of value) {
      if (Array.isArray(item)) {
        flattened.push(...item);
      } else {
        flattened.push(item);
      }
    }

    return flattened;
  }

  private async getPdfObject(page: any, objectId: string): Promise<any | null> {
    const resolvedFrom = async (source: any): Promise<any | null> => {
      if (!source?.get) return null;

      return new Promise<any>((resolve) => {
        source.get(objectId, (obj: any) => resolve(obj || null));
      });
    };

    return (await resolvedFrom(page.objs)) || (await resolvedFrom(page.commonObjs));
  }

  private async convertPdfImageDataToFile(imageData: any): Promise<File | null> {
    if (!imageData) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    if (imageData.bitmap) {
      canvas.width = imageData.bitmap.width;
      canvas.height = imageData.bitmap.height;
      context.drawImage(imageData.bitmap, 0, 0);
    } else if (imageData.data && imageData.width && imageData.height) {
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const clamped =
        imageData.data instanceof Uint8ClampedArray
          ? imageData.data
          : new Uint8ClampedArray(imageData.data);
      const image = new ImageData(clamped, imageData.width, imageData.height);
      context.putImageData(image, 0, 0);
    } else {
      return null;
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;

    return new File([blob], 'pdf-image.png', { type: 'image/png' });
  }

  private async renderFirstPdfPageAsImage(page: any): Promise<File | null> {
    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;

    return new File([blob], 'pdf-page-preview.png', { type: 'image/png' });
  }

  openDeleteModal(equipment: EquipmentModel): void {
    this.deleteError = '';
    this.equipmentToDelete = equipment;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.equipmentToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.equipmentToDelete) {
      return;
    }

    this.equipmentService.delete(this.equipmentToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadEquipments();
      },
      error: () => {
        this.deleteError = 'Unable to delete equipment right now. Please try again.';
      }
    });
  }

  openBulkDeleteModal(): void {
    this.bulkDeleteError = '';
    this.isBulkDeleteModalOpen = true;
  }

  closeBulkDeleteModal(): void {
    this.isBulkDeleteModalOpen = false;
    this.bulkDeleteError = '';
  }

  confirmBulkDelete(): void {
    if (this.selectedIds.size === 0) {
      return;
    }

    const deleteRequests = Array.from(this.selectedIds).map((id) => this.equipmentService.delete(id));
    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.closeBulkDeleteModal();
        this.loadEquipments();
      },
      error: () => {
        this.bulkDeleteError = 'Unable to delete selected equipment right now. Please try again.';
      }
    });
  }

  private resetForm(): void {
    this.newEquipment = {
      name: '',
      description: '',
      status: 'AVAILABLE',
      conditionScore: null,
      imageUrl: ''
    };
    this.isPrefilledFromDocument = false;
    this.selectedImage = null;
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }
    this.imagePreview = '';
    this.isImagePreviewVisible = true;
  }

  private clearSelection(): void {
    this.selectedIds.clear();
  }

  toggleDropdown(equipmentId: number): void {
    if (this.openDropdownId === equipmentId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = equipmentId;
    }
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Close dropdown if click is outside of dropdown container
    if (!target.closest('.dropdown-container')) {
      this.closeDropdown();
    }
  }

  openDetailModal(equipment: EquipmentModel): void {
    this.equipmentToDetail = equipment;
    this.hoveredDetailEquipmentId = null;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.equipmentToDetail = null;
    this.hoveredDetailEquipmentId = null;
  }

  viewMaintenance(equipment: EquipmentModel): void {
    this.closeDetailModal();
    this.router.navigate(['/equipment/maintenance'], {
      queryParams: { equipmentId: equipment.id }
    });
  }

  viewReservations(equipment: EquipmentModel): void {
    this.closeDetailModal();
    this.router.navigate(['/equipment/reservation'], {
      queryParams: { equipmentId: equipment.id }
    });
  }

  onStatusHover(equipmentId: number): void {
    this.hoveredEquipmentId = equipmentId;
  }

  onStatusLeave(): void {
    this.hoveredEquipmentId = null;
  }

  onDetailStatusHover(equipmentId: number): void {
    this.hoveredDetailEquipmentId = equipmentId;
  }

  onDetailStatusLeave(): void {
    this.hoveredDetailEquipmentId = null;
  }

  getClosestMaintenanceForEquipment(equipmentId: number): Maintenance | null {
    return this.closestMaintenanceMap.get(equipmentId) || null;
  }

  shouldShowMaintenanceTooltip(equipmentId: number): boolean {
    return this.hoveredEquipmentId === equipmentId && !!this.getClosestMaintenanceForEquipment(equipmentId);
  }

  shouldShowMaintenanceTooltipDetail(equipmentId: number): boolean {
    return this.hoveredDetailEquipmentId === equipmentId && !!this.getClosestMaintenanceForEquipment(equipmentId);
  }

  getClosestReservationForEquipment(equipmentId: number): ReservationModel | null {
    return this.closestReservationMap.get(equipmentId) || null;
  }

  shouldShowReservationTooltip(equipmentId: number): boolean {
    return this.hoveredEquipmentId === equipmentId && !!this.getClosestReservationForEquipment(equipmentId);
  }

  shouldShowReservationTooltipDetail(equipmentId: number): boolean {
    return this.hoveredDetailEquipmentId === equipmentId && !!this.getClosestReservationForEquipment(equipmentId);
  }
}
