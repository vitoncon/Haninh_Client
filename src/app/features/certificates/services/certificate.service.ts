import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface CertificateFilters {
  keyword?: string;
  status?: string;
  class_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  constructor() {}

  // ================= MOCK DATA =================

  private mockCertificates: any[] = [
    {
      id: 1,
      certificate_number: 'CERT001',
      student_id: 1,
      student_name: 'Nguyễn Văn An',
      class_id: 1,
      class_name: 'Angular Basic',
      status: 'Active',
      issue_date: '2024-01-01',
      expiry_date: '2025-01-01'
    }
  ];

  private mockStudents = [
    { id: 1, full_name: 'Nguyễn Văn An', student_code: 'HV001' },
    { id: 2, full_name: 'Trần Thị Bình', student_code: 'HV002' }
  ];

  private mockClasses = [
    { id: 1, class_name: 'Angular Basic' },
    { id: 2, class_name: 'React Advanced' }
  ];

  // ================= CERTIFICATE =================

  getCertificates(filters?: CertificateFilters): Observable<any[]> {
    return of(this.mockCertificates);
  }

  getStudentCertificates(): Observable<any[]> {
    return of(this.mockCertificates);
  }

  getCertificateById(id: number): Observable<any> {
    return of(this.mockCertificates.find(x => x.id === id));
  }

  addStudentCertificate(data: any): Observable<any> {
    const newItem = {
      id: Date.now(),
      ...data
    };
    this.mockCertificates.push(newItem);
    return of(newItem);
  }

  updateStudentCertificate(data: any): Observable<any> {
    const index = this.mockCertificates.findIndex(x => x.id === data.id);
    if (index !== -1) {
      this.mockCertificates[index] = data;
    }
    return of(data);
  }

  deleteStudentCertificate(id: number): Observable<boolean> {
    this.mockCertificates = this.mockCertificates.filter(x => x.id !== id);
    return of(true);
  }

  // ================= BASE CRUD =================

  createCertificate(data: any): Observable<any> {
    return this.addStudentCertificate(data);
  }

  updateCertificate(id: number, data: any): Observable<any> {
    return this.updateStudentCertificate({ id, ...data });
  }

  deleteCertificate(id: number): Observable<boolean> {
    return this.deleteStudentCertificate(id);
  }

  // ================= STATISTICS =================

  getCertificateStatistics(filters?: CertificateFilters): Observable<any> {
    return of({
      total: 10,
      active: 7,
      expired: 3
    });
  }

  // ================= STUDENTS =================

  getStudents(): Observable<any[]> {
    return of(this.mockStudents);
  }

  getStudentsInClass(classId: number): Observable<any[]> {
    return of(this.mockStudents);
  }

  // ================= CLASSES =================

  getClasses(): Observable<any[]> {
    return of(this.mockClasses);
  }

  // ================= TYPES =================

  getCertificateTypes(): Observable<any[]> {
    return of([
      { id: 1, name: 'Completion', validity_months: 12 }
    ]);
  }

  getCertificateTypeDetails(id: number): Observable<any> {
    return of({
      id,
      name: 'Completion',
      validity_months: 12
    });
  }

  // ================= OPTIONS =================

  getCertificateStatusOptions(): any[] {
    return [
      { label: 'Active', value: 'Active' },
      { label: 'Expired', value: 'Expired' },
      { label: 'Revoked', value: 'Revoked' }
    ];
  }

  // ================= UTIL =================

  generateCertificateNumber(): string {
    return 'CERT-' + Math.floor(Math.random() * 1000000);
  }

  calculateExpiryDate(issueDate: string, months: number): Observable<string> {
    const d = new Date(issueDate);
    d.setMonth(d.getMonth() + months);
    return of(d.toISOString());
  }

}
