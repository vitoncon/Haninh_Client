import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Certificate,
  StudentCertificate,
  StudentCertificateWithDetails,
  CertificateStatistics
} from '../models/certificates.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  // ================= MOCK CERTIFICATE TYPES =================
  private certificates: Certificate[] = [
    {
      id: 1,
      certificate_code: 'HSK3',
      certificate_name: 'Chứng chỉ HSK 3',
      description: 'Chứng chỉ tiếng Trung trình độ trung cấp',
      criteria: 'Hoàn thành khóa + Pass test',
      validity_period_months: 24,
      is_permanent: 0,
      status: 'Hoạt động'
    },
    {
      id: 2,
      certificate_code: 'TOPIK2',
      certificate_name: 'Chứng chỉ TOPIK II',
      description: 'Chứng chỉ tiếng Hàn trung cao cấp',
      criteria: 'Pass TOPIK mock test',
      validity_period_months: 36,
      is_permanent: 0,
      status: 'Hoạt động'
    },
    {
      id: 3,
      certificate_code: 'JLPTN3',
      certificate_name: 'Chứng chỉ JLPT N3',
      description: 'Chứng chỉ tiếng Nhật N3',
      criteria: 'Đạt >= 60% bài test',
      validity_period_months: 36,
      is_permanent: 0,
      status: 'Hoạt động'
    },
    {
      id: 4,
      certificate_code: 'GV-NOINGU',
      certificate_name: 'Chứng nhận giáo viên ngoại ngữ',
      description: 'Chứng nhận nội bộ',
      is_permanent: 1,
      status: 'Hoạt động'
    }
  ];

  // ================= MOCK STUDENT CERTIFICATES =================
  private studentCertificates: StudentCertificateWithDetails[] = [
    {
      id: 1,
      student_id: 101,
      certificate_id: 1,
      class_id: 11,
      issued_date: '2025-12-01',
      expiry_date: '2027-12-01',
      certificate_number: 'HSK3-20251201-001',
      status: 'Đã cấp',
      student_name: 'Nguyễn Minh Anh',
      student_code: 'HV001',
      certificate_name: 'Chứng chỉ HSK 3',
      certificate_code: 'HSK3',
      class_name: 'Trung cấp Trung K1',
      class_code: 'TC-TQ-K1'
    },
    {
      id: 2,
      student_id: 102,
      certificate_id: 2,
      class_id: 21,
      issued_date: '2024-10-10',
      expiry_date: '2027-10-10',
      certificate_number: 'TOPIK2-20241010-002',
      status: 'Đã cấp',
      student_name: 'Trần Thị Lan',
      student_code: 'HV002',
      certificate_name: 'Chứng chỉ TOPIK II',
      certificate_code: 'TOPIK2',
      class_name: 'Trung cấp Hàn K2',
      class_code: 'TC-HQ-K2'
    },
    {
      id: 3,
      student_id: 103,
      certificate_id: 3,
      class_id: 31,
      issued_date: '2023-01-01',
      expiry_date: '2025-01-01',
      certificate_number: 'JLPTN3-20230101-003',
      status: 'Đã hết hạn',
      student_name: 'Lê Hoàng Nam',
      student_code: 'HV003',
      certificate_name: 'Chứng chỉ JLPT N3',
      certificate_code: 'JLPTN3',
      class_name: 'Nhật N3 K1',
      class_code: 'JP-N3-K1'
    },
    {
      id: 4,
      student_id: 104,
      certificate_id: 1,
      class_id: 11,
      issued_date: '2025-05-05',
      expiry_date: '2027-05-05',
      certificate_number: 'HSK3-20250505-004',
      status: 'Đang chờ',
      student_name: 'Phạm Quang Huy',
      student_code: 'HV004',
      certificate_name: 'Chứng chỉ HSK 3',
      certificate_code: 'HSK3',
      class_name: 'Trung cấp Trung K1',
      class_code: 'TC-TQ-K1'
    }
  ];

  // ================= CERTIFICATE TYPES =================
  getCertificates(): Observable<Certificate[]> {
    return of(this.certificates);
  }

  getCertificateById(id: number): Observable<Certificate | undefined> {
    return of(this.certificates.find(x => x.id === id));
  }

  // ================= STUDENT CERTIFICATES =================
  getStudentCertificates(): Observable<StudentCertificateWithDetails[]> {
    return of(this.studentCertificates);
  }

  getStudentCertificateById(id: number): Observable<StudentCertificateWithDetails | undefined> {
    return of(this.studentCertificates.find(x => x.id === id));
  }

  addStudentCertificate(data: StudentCertificate): Observable<any> {
    const newItem: StudentCertificateWithDetails = {
      ...data,
      id: Date.now(),
      student_name: 'Mock Student',
      student_code: 'MOCK',
      certificate_name: this.certificates.find(c => c.id === data.certificate_id)?.certificate_name,
      certificate_code: this.certificates.find(c => c.id === data.certificate_id)?.certificate_code
    };

    this.studentCertificates.push(newItem);
    return of(newItem);
  }

  deleteStudentCertificate(id: number): Observable<boolean> {
    this.studentCertificates =
      this.studentCertificates.filter(x => x.id !== id);
    return of(true);
  }

  // ================= STATISTICS =================
  getCertificateStatistics(): Observable<CertificateStatistics> {

    const total = this.studentCertificates.length;
    const issued = this.studentCertificates.filter(x => x.status === 'Đã cấp').length;
    const expired = this.studentCertificates.filter(x => x.status === 'Đã hết hạn').length;
    const revoked = this.studentCertificates.filter(x => x.status === 'Đã thu hồi').length;
    const pending = this.studentCertificates.filter(x => x.status === 'Đang chờ').length;

    const uniqueStudents = new Set(this.studentCertificates.map(x => x.student_id));

    return of({
      total_certificates: total,
      issued_certificates: issued,
      expired_certificates: expired,
      revoked_certificates: revoked,
      pending_certificates: pending,
      total_students: uniqueStudents.size
    });
  }

}
