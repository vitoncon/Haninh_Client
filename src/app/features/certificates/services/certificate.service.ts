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

  // ===== MOCK CERTIFICATES =====
  private certificates: Certificate[] = [
    {
      id: 1,
      certificate_code: 'CERT_FE_001',
      certificate_name: 'Frontend Developer',
      description: 'Chứng chỉ lập trình Frontend',
      criteria: 'Hoàn thành khóa FE + Project',
      validity_period_months: 12,
      is_permanent: 0,
      status: 'Hoạt động',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      certificate_code: 'CERT_BE_001',
      certificate_name: 'Backend Developer',
      description: 'Chứng chỉ Backend',
      criteria: 'Pass Backend Exam',
      validity_period_months: 0,
      is_permanent: 1,
      status: 'Hoạt động',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // ===== MOCK STUDENT CERTIFICATES =====
  private studentCertificates: StudentCertificateWithDetails[] = [
    {
      id: 1,
      student_id: 101,
      certificate_id: 1,
      class_id: 10,
      issued_date: '2025-01-01',
      expiry_date: '2026-01-01',
      certificate_number: 'CERT-NO-001',
      status: 'Đã cấp',
      student_name: 'Nguyễn Văn A',
      certificate_name: 'Frontend Developer',
      certificate_code: 'CERT_FE_001'
    }
  ];

  // ===============================
  // CERTIFICATE CRUD
  // ===============================

  getCertificates(): Observable<Certificate[]> {
    return of(this.certificates);
  }

  getCertificateById(id: number): Observable<Certificate | undefined> {
    return of(this.certificates.find(x => x.id === id));
  }

  createCertificate(data: Certificate): Observable<Certificate> {
    const newItem = {
      ...data,
      id: Date.now()
    };

    this.certificates.push(newItem);
    return of(newItem);
  }

  updateCertificate(id: number, data: Certificate): Observable<boolean> {
    const index = this.certificates.findIndex(x => x.id === id);

    if (index >= 0) {
      this.certificates[index] = {
        ...this.certificates[index],
        ...data,
        id
      };
    }

    return of(true);
  }

  deleteCertificate(id: number): Observable<boolean> {
    this.certificates = this.certificates.filter(x => x.id !== id);
    return of(true);
  }

  // ===============================
  // STUDENT CERTIFICATE CRUD
  // ===============================

  getStudentCertificates(): Observable<StudentCertificateWithDetails[]> {
    return of(this.studentCertificates);
  }

  getStudentCertificateById(
    id: number
  ): Observable<StudentCertificateWithDetails | undefined> {
    return of(this.studentCertificates.find(x => x.id === id));
  }

  createStudentCertificate(
    data: StudentCertificate
  ): Observable<StudentCertificate> {

    const newItem: StudentCertificateWithDetails = {
      ...data,
      id: Date.now()
    };

    this.studentCertificates.push(newItem);
    return of(newItem);
  }

  // ⚠ QUAN TRỌNG — 2 PARAM giống component bạn đang gọi
  updateStudentCertificate(
    id: number,
    data: StudentCertificate
  ): Observable<boolean> {

    const index = this.studentCertificates.findIndex(x => x.id === id);

    if (index >= 0) {
      this.studentCertificates[index] = {
        ...this.studentCertificates[index],
        ...data,
        id
      };
    }

    return of(true);
  }

  deleteStudentCertificate(id: number): Observable<boolean> {
    this.studentCertificates =
      this.studentCertificates.filter(x => x.id !== id);

    return of(true);
  }

  // ===============================
  // FILTER MOCK
  // ===============================

  filterStudentCertificates(
    filters: CertificateFilters
  ): Observable<StudentCertificateWithDetails[]> {

    let result = [...this.studentCertificates];

    if (filters.certificate_id) {
      result = result.filter(x => x.certificate_id === filters.certificate_id);
    }

    if (filters.student_id) {
      result = result.filter(x => x.student_id === filters.student_id);
    }

    if (filters.status) {
      result = result.filter(x => x.status === filters.status);
    }

    return of(result);
  }

  // ===============================
  // STATISTICS MOCK
  // ===============================

  getStatistics(): Observable<CertificateStatistics> {

    return of({
      total_certificates: this.certificates.length,
      issued_certificates: this.studentCertificates.filter(x => x.status === 'Đã cấp').length,
      expired_certificates: this.studentCertificates.filter(x => x.status === 'Đã hết hạn').length,
      revoked_certificates: this.studentCertificates.filter(x => x.status === 'Đã thu hồi').length,
      pending_certificates: this.studentCertificates.filter(x => x.status === 'Đang chờ').length,
      total_students: new Set(this.studentCertificates.map(x => x.student_id)).size
    });

  }

}
