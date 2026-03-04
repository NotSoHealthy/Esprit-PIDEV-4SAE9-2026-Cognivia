import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { ComplaintModel } from '../model/complaint.model';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly imageUploadEndpoint =
    'https://api.imgbb.com/1/upload?key=6917397c87588ed4436eac425b613c6e';

  getComplaintsByPatientId(patientId: number): Observable<ComplaintModel[]> {
    return this.http.get<ComplaintModel[]>(
      `${this.apiBaseUrl}/Equipment/complaint/patient/${patientId}`,
    );
  }

  getAllComplaints(): Observable<ComplaintModel[]> {
    return this.http.get<ComplaintModel[]>(
      `${this.apiBaseUrl}/Equipment/complaint`,
    );
  }

  submitComplaint(complaint: Partial<ComplaintModel>): Observable<ComplaintModel> {
    return this.http.post<ComplaintModel>(
      `${this.apiBaseUrl}/Equipment/complaint/submit`,
      complaint,
    );
  }

  validateComplaint(
    complaint: ComplaintModel,
    adminId: number | string,
  ): Observable<ComplaintModel> {
    return this.http.put<ComplaintModel>(
      `${this.apiBaseUrl}/Equipment/complaint/validate`,
      { ...complaint, handledByAdminId: adminId },
    );
  }

  dismissComplaint(
    complaint: ComplaintModel,
    adminId: number | string,
    resolutionDecision: string,
  ): Observable<ComplaintModel> {
    return this.http.put<ComplaintModel>(
      `${this.apiBaseUrl}/Equipment/complaint/dismiss`,
      { ...complaint, handledByAdminId: adminId, resolutionDecision },
    );
  }

  startInvestigation(complaint: ComplaintModel): Observable<ComplaintModel> {
    return this.http.put<ComplaintModel>(
      `${this.apiBaseUrl}/Equipment/complaint/investigate`,
      complaint,
    );
  }

  takeAction(complaint: ComplaintModel): Observable<ComplaintModel> {
    return this.http.put<ComplaintModel>(
      `${this.apiBaseUrl}/Equipment/complaint/take-action`,
      complaint,
    );
  }

  appealComplaint(complaint: ComplaintModel): Observable<ComplaintModel> {
    return this.http.put<ComplaintModel>(
      `${this.apiBaseUrl}/Equipment/complaint/appeal`,
      complaint,
    );
  }

  closeComplaint(complaint: ComplaintModel): Observable<ComplaintModel> {
    return this.http.put<ComplaintModel>(
      `${this.apiBaseUrl}/Equipment/complaint/close`,
      complaint,
    );
  }

  deleteComplaint(complaintId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/Equipment/complaint/${complaintId}`,
    );
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<{ data: { url: string } }>(this.imageUploadEndpoint, formData)
      .pipe(map((response) => response.data.url));
  }

  getPatientDetails(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/care/patient/${patientId}`);
  }

  getDoctorDetails(doctorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/care/doctor/${doctorId}`);
  }

  getCaregiverDetails(caregiverId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/care/caregiver/${caregiverId}`);
  }
}
