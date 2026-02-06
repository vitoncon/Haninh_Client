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

  constructor() {}

  // ================= MOCK CERTIFICATE LIST =================

  private certificates: Certificate[] = [
    {
      id: 1,
      certificate_code: 'CERT-001',
      certificate_name: 'Chứng chỉ Angular',
      description: 'Hoàn thành khóa Angular',
      criteria: 'Hoàn thành 80% bài học',
      validity_period_months: 24,
      is_permanent: 0,
      status: 'Hoạt động',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      certificate_code: 'CERT-002',
      certificate_name: 'Chứng chỉ Java',
      validity_period_months: 0,
      is_permanent: 1,
      status: 'Hoạt động',
      created_at: new Date()
    }
  ];

  // ================= MOCK STUDENT CERTIFICATE =================

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
      student_code: 'ST001',
      certificate_name: 'Chứng chỉ Angular',
      certificate_code: 'CERT-001',
      class_name: 'Angular Basic',
      class_code: 'CLS001'
    },
    {
      id: 2,
      student_id: 2,
      certificate_id: 2,
      class_id: 2,
      issued_date: '2024-01-01',
      certificate_number: 'CERTNO-002',
      status: 'Đã cấp',

      student_name: 'Trần Văn B',
      student_code: 'ST002',
      certificate_name: 'Chứng chỉ Java',
      certificate_code: 'CERT-002',
      class_name: 'Java Core',
      class_code: 'CLS002'
    }
  ];

  // ================= CERTIFICATE CRUD =================

  getCertificates(): Observable<Certificate[]> {
    return of(this.certificates);
  }

  getCertificateById(id: number): Observable<Certificate | undefined> {
    return of(this.certificates.find(x => x.id === id));
  }

  createCertificate(data: Certificate): Observable<Certificate> {
    const newItem = {
      ...data,
      id: Date.now(),
      created_at: new Date()
    };

    this.certificates.push(newItem);
    return of(newItem);
  }

  updateCertificate(id: number, data: Certificate): Observable<Certificate> {
    const index = this.certificates.findIndex(x => x.id === id);
    if (index !== -1) {
      this.certificates[index] = {
        ...this.certificates[index],
        ...data,
        updated_at: new Date()
      };
    }
    return of(this.certificates[index]);
  }

  deleteCertificate(id: number): Observable<boolean> {
    this.certificates = this.certificates.filter(x => x.id !== id);
    return of(true);
  }

  // ================= STUDENT CERTIFICATE =================

  getStudentCertificates(
    filters?: CertificateFilters
  ): Observable<StudentCertificateWithDetails[]> {

    let data = [...this.studentCertificates];

    if (filters) {

      if (filters.certificate_id) {
        data = data.filter(x => x.certificate_id === filters.certificate_id);
      }

      if (filters.student_id) {
        data = data.filter(x => x.student_id === filters.student_id);
      }

      if (filters.status) {
        data = data.filter(x => x.status === filters.status);
      }

      if (filters.search) {
        const keyword = filters.search.toLowerCase();
        data = data.filter(x =>
          x.student_name?.toLowerCase().includes(keyword) ||
          x.certificate_name?.toLowerCase().includes(keyword) ||
          x.certificate_number?.toLowerCase().includes(keyword)
        );
      }
    }

    return of(data);
  }

  createStudentCertificate(
    data: StudentCertificate
  ): Observable<StudentCertificate> {

    const newItem = {
      ...data,
      id: Date.now(),
      created_at: new Date()
    };

    this.studentCertificates.push(newItem as StudentCertificateWithDetails);
    return of(newItem);
  }

  updateStudentCertificate(
    id: number,
    data: StudentCertificate
  ): Observable<StudentCertificate> {

    const index = this.studentCertificates.findIndex(x => x.id === id);

    if (index !== -1) {
      this.studentCertificates[index] = {
        ...this.studentCertificates[index],
        ...data,
        updated_at: new Date()
      };
    }

    return of(this.studentCertificates[index]);
  }

  revokeStudentCertificate(id: number): Observable<boolean> {
    const item = this.studentCertificates.find(x => x.id === id);
    if (item) item.status = 'Đã thu hồi';
    return of(true);
  }

  // ================= STATISTICS =================

  getStatistics(): Observable<CertificateStatistics> {

    const total = this.studentCertificates.length;

    const issued = this.studentCertificates.filter(
      x => x.status === 'Đã cấp'
    ).length;

    const expired = this.studentCertificates.filter(
      x => x.status === 'Đã hết hạn'
    ).length;

    const revoked = this.studentCertificates.filter(
      x => x.status === 'Đã thu hồi'
    ).length;

    const pending = this.studentCertificates.filter(
      x => x.status === 'Đang chờ'
    ).length;

    return of({
      total_certificates: total,
      issued_certificates: issued,
      expired_certificates: expired,
      revoked_certificates: revoked,
      pending_certificates: pending,
      total_students: 2
    });
  }
}
