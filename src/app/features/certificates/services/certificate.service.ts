import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Certificate,
  StudentCertificate,
  StudentCertificateWithDetails,
  CertificateFilters,
  CertificateStatistics
} from '../models/certificates.model';

/* ================= MOCK STUDENTS ================= */
interface StudentsModel {
  id: number;
  student_code: string;
  full_name: string;
  enrollment_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  /* ========= MOCK STUDENTS (THEO ĐÚNG DATA BẠN GỬI) ========= */
  private mockStudents: StudentsModel[] = [
    { id: 1, student_code: 'HV001', full_name: 'Nguyễn Văn An', enrollment_date: '2024-09-01' },
    { id: 2, student_code: 'HV002', full_name: 'Trần Thị Bình', enrollment_date: '2024-10-15' },
    { id: 3, student_code: 'HV003', full_name: 'Lê Minh Châu', enrollment_date: '2024-06-05' },
    { id: 4, student_code: 'HV004', full_name: 'Phạm Quốc Dũng', enrollment_date: '2023-03-20' }
  ];

  /* ================= MOCK CERTIFICATE TYPES ================= */
  private mockCertificates: Certificate[] = [
    {
      id: 1,
      certificate_code: 'CERT_BASIC',
      certificate_name: 'Chứng chỉ Cơ Bản',
      is_permanent: 0,
      validity_period_months: 12,
      status: 'Hoạt động'
    },
    {
      id: 2,
      certificate_code: 'CERT_ADV',
      certificate_name: 'Chứng chỉ Nâng Cao',
      is_permanent: 1,
      status: 'Hoạt động'
    }
  ];

  /* ================= MOCK STUDENT CERTIFICATES ================= */
  private mockStudentCertificates: StudentCertificate[] = [
    {
      id: 1,
      student_id: 1,
      certificate_id: 1,
      class_id: 101,
      issued_date: '2024-10-01',
      expiry_date: '2025-10-01',
      certificate_number: 'CERT-20241001-001',
      status: 'Đã cấp'
    },
    {
      id: 2,
      student_id: 2,
      certificate_id: 2,
      class_id: 102,
      issued_date: '2024-11-15',
      certificate_number: 'CERT-20241115-002',
      status: 'Đang chờ'
    },
    {
      id: 3,
      student_id: 3,
      certificate_id: 1,
      class_id: 103,
      issued_date: '2024-06-20',
      expiry_date: '2025-06-20',
      certificate_number: 'CERT-20240620-003',
      status: 'Đã hết hạn'
    }
  ];

  constructor() {}

  /* ================= CERTIFICATE ================= */

  getCertificates(): Observable<Certificate[]> {
    return of(this.mockCertificates);
  }

  getCertificateById(id: number): Observable<Certificate> {
    return of(this.mockCertificates.find(c => c.id === id)!);
  }

  /* ================= STUDENT CERTIFICATE ================= */

  getStudentCertificates(): Observable<StudentCertificateWithDetails[]> {
    const data = this.mockStudentCertificates.map(sc => {
      const student = this.mockStudents.find(s => s.id === sc.student_id);
      const cert = this.mockCertificates.find(c => c.id === sc.certificate_id);

      return {
        ...sc,
        student_name: student?.full_name ?? 'N/A',
        student_code: student?.student_code ?? 'N/A',
        certificate_name: cert?.certificate_name ?? 'N/A',
        certificate_code: cert?.certificate_code ?? 'N/A',
        class_name: `Lớp ${sc.class_id}`,
        class_code: `CLS-${sc.class_id}`
      };
    });

    return of(data);
  }

  getStudentCertificateById(id: number): Observable<StudentCertificate> {
    return of(this.mockStudentCertificates.find(sc => sc.id === id)!);
  }

  addStudentCertificate(data: StudentCertificate): Observable<StudentCertificate> {
    const newItem: StudentCertificate = {
      ...data,
      id: Date.now()
    };
    this.mockStudentCertificates.push(newItem);
    return of(newItem);
  }

  updateStudentCertificate(id: number, data: StudentCertificate): Observable<StudentCertificate> {
    const index = this.mockStudentCertificates.findIndex(i => i.id === id);
    if (index > -1) {
      this.mockStudentCertificates[index] = { ...data, id };
    }
    return of(this.mockStudentCertificates[index]);
  }

  deleteStudentCertificate(id: number): Observable<void> {
    this.mockStudentCertificates = this.mockStudentCertificates.filter(i => i.id !== id);
    return of(void 0);
  }

  /* ================= DROPDOWN DATA ================= */

  getStudents(): Observable<any[]> {
    return of(
      this.mockStudents.map(s => ({
        id: s.id,
        student_code: s.student_code,
        full_name: s.full_name,
        enrollment_date: s.enrollment_date
      }))
    );
  }

  getClasses(): Observable<any[]> {
    return of([
      { id: 101, class_name: 'Lớp Angular', class_code: 'CLS-101' },
      { id: 102, class_name: 'Lớp React', class_code: 'CLS-102' },
      { id: 103, class_name: 'Lớp Vue', class_code: 'CLS-103' }
    ]);
  }

  /* ================= STATISTICS ================= */

  getCertificateStatistics(_: CertificateFilters | undefined): Observable<CertificateStatistics> {
    return of({
      total_certificates: this.mockStudentCertificates.length,
      issued_certificates: this.mockStudentCertificates.filter(i => i.status === 'Đã cấp').length,
      expired_certificates: this.mockStudentCertificates.filter(i => i.status === 'Đã hết hạn').length,
      revoked_certificates: this.mockStudentCertificates.filter(i => i.status === 'Đã thu hồi').length,
      pending_certificates: this.mockStudentCertificates.filter(i => i.status === 'Đang chờ').length,
      total_students: new Set(this.mockStudentCertificates.map(i => i.student_id)).size
    });
  }

  /* ================= UTILS ================= */

  generateCertificateNumber(): string {
    return `CERT-${Date.now()}`;
  }

  getCertificateStatusOptions() {
    return [
      { label: 'Đã cấp', value: 'Đã cấp' },
      { label: 'Đang chờ', value: 'Đang chờ' },
      { label: 'Đã thu hồi', value: 'Đã thu hồi' },
      { label: 'Đã hết hạn', value: 'Đã hết hạn' }
    ];
  }
}
