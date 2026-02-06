import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  Certificate,
  StudentCertificate,
  StudentCertificateWithDetails,
  CertificateFilters,
  CertificateStatistics
} from '../models/certificates.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  // ================= MOCK DATA =================

  private certificates: Certificate[] = [
    {
      id: 1,
      certificate_code: 'CERT-001',
      certificate_name: 'Chứng chỉ Angular',
      validity_period_months: 24,
      is_permanent: 0,
      status: 'Hoạt động'
    },
    {
      id: 2,
      certificate_code: 'CERT-002',
      certificate_name: 'Chứng chỉ Java',
      is_permanent: 1,
      status: 'Hoạt động'
    }
  ];

  private studentCertificates: StudentCertificateWithDetails[] = [
    {
      id: 1,
      student_id: 1,
      certificate_id: 1,
      class_id: 1,
      issued_date: '2025-01-01',
      expiry_date: '2027-01-01',
      certificate_number: 'CERTNO-001',
      status: 'Đã cấp',
      student_name: 'Nguyễn Văn A',
      certificate_name: 'Chứng chỉ Angular'
    }
  ];

  // ================= MOCK LIST =================

  getStudents(): Observable<any[]> {
    return of([
      { id: 1, student_name: 'Nguyễn Văn A', student_code: 'ST001' },
      { id: 2, student_name: 'Trần Văn B', student_code: 'ST002' }
    ]);
  }

  getClasses(): Observable<any[]> {
    return of([
      { id: 1, class_name: 'Angular Basic' },
      { id: 2, class_name: 'Java Core' }
    ]);
  }

  getStudentsInClass(classId: number): Observable<any[]> {
    return this.getStudents();
  }

  // ================= CERTIFICATE CRUD =================

  getCertificates(): Observable<Certificate[]> {
    return of(this.certificates);
  }

  getCertificateTypeDetails(id: number): Observable<Certificate | undefined> {
    return of(this.certificates.find(x => x.id === id));
  }

  // ================= STUDENT CERTIFICATE =================

  getStudentCertificates(
    filters?: CertificateFilters
  ): Observable<StudentCertificateWithDetails[]> {
    return of(this.studentCertificates);
  }

  addStudentCertificate(
    data: StudentCertificate
  ): Observable<StudentCertificate> {

    const newItem = {
      ...data,
      id: Date.now()
    };

    this.studentCertificates.push(newItem as any);
    return of(newItem);
  }

  deleteStudentCertificate(id: number): Observable<boolean> {
    this.studentCertificates =
      this.studentCertificates.filter(x => x.id !== id);

    return of(true);
  }

  // ================= HELPER =================

  generateCertificateNumber(): string {
    return 'CERT-' + Date.now();
  }

  getCertificateStatusOptions() {
    return [
      { label: 'Đã cấp', value: 'Đã cấp' },
      { label: 'Đã thu hồi', value: 'Đã thu hồi' },
      { label: 'Đã hết hạn', value: 'Đã hết hạn' },
      { label: 'Đang chờ', value: 'Đang chờ' }
    ];
  }

  calculateExpiryDate(
    issuedDate: string,
    months?: number
  ): Observable<string> {

    if (!months) return of('');

    const date = new Date(issuedDate);
    date.setMonth(date.getMonth() + months);

    return of(date.toISOString().split('T')[0]);
  }

  // ================= STATISTICS =================

  getCertificateStatistics(): Observable<CertificateStatistics> {

    const total = this.studentCertificates.length;

    return of({
      total_certificates: total,
      issued_certificates: total,
      expired_certificates: 0,
      revoked_certificates: 0,
      pending_certificates: 0,
      total_students: 2
    });
  }
}
