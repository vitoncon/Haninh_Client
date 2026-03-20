import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FeeWithDetails } from '../models/fees.model';

import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = '/api/student';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getAccessToken() || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }


  /**
   * Get all available courses for students
   */
  getCourses(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl + '/courses', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  /**
   * Get current student's fees
   */
  getMyFees(): Observable<FeeWithDetails[]> {
    return this.http.get<any>(this.apiUrl + '/fees', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  /**
   * Get my courses (if needed)
   */
  getMyCourses(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl + '/my-courses', this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  /**
   * Get QR data for a fee
   */
  getFeeQR(feeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fees/${feeId}/qr`, this.getAuthHeaders());
  }

  /**
   * Submit a payment notification (I have paid)
   */
  submitPayment(feeId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/fees/${feeId}/submit`, {}, this.getAuthHeaders());
  }

  /**
   * Enroll in a new course
   */
  enrollCourse(courseId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/enroll-course`, { course_id: courseId }, this.getAuthHeaders());
  }

  /**
   * Download Invoice PDF for a fee
   */
  getFeeInvoice(feeId: number): Observable<Blob> {

    return this.http.get(`${this.apiUrl}/fees/${feeId}/invoice`, {
      ...this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

}

