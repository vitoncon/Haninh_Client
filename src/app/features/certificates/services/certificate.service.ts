import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  Certificate,
  StudentCertificate,
  StudentCertificateWithDetails,
  CertificateFilters,
  CertificateStatistics
} from '../models/certificate.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  /* ================= MOCK DATA ================= */

  private certificates: Certificate[] = [
    {
      id: 1,
      certificate_code: 'CERT-ANG',
      certificate_name: 'Chứng chỉ Angular',
      description: 'Hoàn thành khóa Angular',
      validity_period_months: 12,
      is_permanent: 0,
      status: 'Hoạt động',
      created_at: new Date()
    }
  ];

  private studentCertificates: StudentCertificateWithDetails[] = [
    {
      id: 1,
      student_id: 1,
      certificate_id: 1,
      class_id: 1,
      issued_date: '2025-01-01',
      expiry_date: '2026-01-01',
      certificate_number: 'CERT-0001',
      status: 'Đã cấp',

      student_name: 'Nguyễn Văn A',
      student_code: 'HV001',
      certificate_name: 'Chứng chỉ Angular',
      certificate_code: 'CERT-ANG',
      class_name: 'Angular Cơ Bản',
      class_code: 'ANG01'
    }
  ];

  private students = [
    { id: 1, name: 'Nguyễn Văn A', code: 'HV001' },
    { id: 2, name: 'Trần Thị B', code: 'HV002' }
  ];

  private classes = [
    { id: 1, name: 'Angular Cơ Bản', code: 'ANG01' },
    { id: 2, name: 'Angular Nâng Cao', code: 'ANG02' }
  ];

  /* ================= CERTIFICATE ================= */

  getCertificates(): Observable<StudentCertificateWithDetails[]> {
    return of(this.studentCertificates);
  }

  addCertificate(data: Certificate): Observable<Certificate> {
    data.id = Date.now();
    this.certificates.push(data);
    return of(data);
  }

  updateCertificate(id: number, data: Certificate): Observable<boolean> {
    const index = this.certificates.findIndex(c => c.id === id);
    if (index !== -1) {
      this.certificates[index] = { ...this.certificates[index], ...data };
      return of(true);
    }
    return of(false);
  }

  deleteCertificate(id: number): Observable<boolean> {
    this.certificates = this.certificates.filter(c => c.id !== id);
    return of(true);
  }

  /* ================= STUDENT CERTIFICATE ================= */

  getStudentCertificates(filters?: CertificateFilters): Observable<StudentCertificateWithDetails[]> {
    return of(this.studentCertificates);
  }

  addStudentCertificate(data: StudentCertificate): Observable<StudentCertificate> {
    const newCert: StudentCertificateWithDetails = {
      ...data,
      id: Date.now(),
      student_name: 'Mock Student',
      student_code: 'HVXXX',
      certificate_name: 'Mock Certificate',
      certificate_code: 'MOCK',
      class_name: 'Mock Class',
      class_code: 'CLS'
    };
    this.studentCertificates.push(newCert);
    return of(newCert);
  }

  updateStudentCertificate(id: number, data: StudentCertificate): Observable<boolean> {
    const index = this.studentCertificates.findIndex(c => c.id === id);
    if (index !== -1) {
      this.studentCertificates[index] = {
        ...this.studentCertificates[index],
        ...data
      };
      return of(true);
    }
    return of(false);
  }

  deleteStudentCertificate(id: number): Observable<boolean> {
    this.studentCertificates = this.studentCertificates.filter(c => c.id !== id);
    return of(true);
  }

  /* ================= STUDENT / CLASS ================= */

  getStudents(): Observable<any[]> {
    return of(this.students);
  }

  getClasses(): Observable<any[]> {
    return of(this.classes);
  }

  getStudentsInClass(classId: number): Observable<any[]> {
    return of(this.students);
  }

  /* ================= HELPER / OPTIONS ================= */

  getCertificateStatusOptions(): string[] {
    return ['Đã cấp', 'Đã thu hồi', 'Đã hết hạn', 'Đang chờ'];
  }

  generateCertificateNumber(): string {
    return 'CERT-' + Math.floor(100000 + Math.random() * 900000);
  }

  getCertificateTypeDetails(certificateTypeId: number): Observable<Certificate> {
    const cert = this.certificates.find(c => c.id === certificateTypeId);
    return of(cert as Certificate);
  }

  calculateExpiryDate(
    issuedDate: string,
    validityMonths?: number,
    isPermanent?: number
  ): Observable<string | null> {
    if (isPermanent === 1) {
      return of(null);
    }
    if (!validityMonths) {
      return of(null);
    }
    const date = new Date(issuedDate);
    date.setMonth(date.getMonth() + validityMonths);
    return of(date.toISOString().split('T')[0]);
  }

  /* ================= STATISTICS ================= */

  getCertificateStatistics(): Observable<CertificateStatistics> {
    const stats: CertificateStatistics = {
      total_certificates: this.studentCertificates.length,
      issued_certificates: this.studentCertificates.filter(c => c.status === 'Đã cấp').length,
      expired_certificates: this.studentCertificates.filter(c => c.status === 'Đã hết hạn').length,
      revoked_certificates: this.studentCertificates.filter(c => c.status === 'Đã thu hồi').length,
      pending_certificates: this.studentCertificates.filter(c => c.status === 'Đang chờ').length,
      total_students: this.students.length
    };
    return of(stats);
  }
}
