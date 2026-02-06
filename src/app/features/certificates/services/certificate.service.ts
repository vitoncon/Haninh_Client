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

  // ===== MOCK DATA =====

  private students = [
    { id: 1, student_code: 'HV001', full_name: 'Nguyễn Văn A', class_id: 1 },
    { id: 2, student_code: 'HV002', full_name: 'Trần Thị B', class_id: 1 },
    { id: 3, student_code: 'HV003', full_name: 'Lê Văn C', class_id: 2 }
  ];

  private classes = [
    { id: 1, class_code: 'CLS01', class_name: 'Lớp Spa K1' },
    { id: 2, class_code: 'CLS02', class_name: 'Lớp Spa K2' }
  ];

  private certificateTypes: Certificate[] = [
    {
      id: 1,
      certificate_code: 'CERT-SPA',
      certificate_name: 'Chứng chỉ Spa',
      validity_period_months: 12,
      is_permanent: 0,
      status: 'Hoạt động'
    },
    {
      id: 2,
      certificate_code: 'CERT-MASTER',
      certificate_name: 'Chứng chỉ Master',
      validity_period_months: 0,
      is_permanent: 1,
      status: 'Hoạt động'
    }
  ];

  private studentCertificates: StudentCertificateWithDetails[] = [];

  // ===== STUDENT CERTIFICATES =====

  getStudentCertificates(): Observable<StudentCertificateWithDetails[]> {
    return of(this.studentCertificates);
  }

  addStudentCertificate(data: StudentCertificate): Observable<any> {

    const newItem: StudentCertificateWithDetails = {
      ...data,
      id: Date.now(),
      student_name: this.students.find(s => s.id === data.student_id)?.full_name,
      student_code: this.students.find(s => s.id === data.student_id)?.student_code,
      certificate_name: this.certificateTypes.find(c => c.id === data.certificate_id)?.certificate_name,
      certificate_code: this.certificateTypes.find(c => c.id === data.certificate_id)?.certificate_code,
      class_name: this.classes.find(c => c.id === data.class_id)?.class_name
    };

    this.studentCertificates.unshift(newItem);
    return of(newItem);
  }

  updateStudentCertificate(data: StudentCertificate): Observable<any> {

    const index = this.studentCertificates.findIndex(x => x.id === data.id);

    if (index >= 0) {
      this.studentCertificates[index] = {
        ...this.studentCertificates[index],
        ...data
      };
    }

    return of(true);
  }

  deleteStudentCertificate(id: number): Observable<any> {
    this.studentCertificates =
      this.studentCertificates.filter(x => x.id !== id);

    return of(true);
  }

  // ===== MASTER DATA =====

  getStudents(): Observable<any[]> {
    return of(this.students);
  }

  getClasses(): Observable<any[]> {
    return of(this.classes);
  }

  getStudentsInClass(classId: number): Observable<any[]> {
    return of(this.students.filter(s => s.class_id === classId));
  }

  getCertificates(): Observable<Certificate[]> {
    return of(this.certificateTypes);
  }

  // ===== CERTIFICATE TYPE =====

  getCertificateTypeDetails(id: number): Observable<Certificate | undefined> {
    return of(this.certificateTypes.find(x => x.id === id));
  }

  // ===== EXPIRY DATE =====

  calculateExpiryDate(
    issuedDate: string,
    certificateId: number
  ): Observable<string | undefined> {

    const cert = this.certificateTypes.find(c => c.id === certificateId);

    if (!cert || cert.is_permanent === 1) return of(undefined);

    const months = cert.validity_period_months || 0;

    const date = new Date(issuedDate);
    date.setMonth(date.getMonth() + months);

    return of(date.toISOString().split('T')[0]);
  }

  // ===== STATISTICS =====

  getCertificateStatistics(): Observable<CertificateStatistics> {

    const total = this.studentCertificates.length;

    return of({
      total_certificates: total,
      issued_certificates: this.studentCertificates.filter(x => x.status === 'Đã cấp').length,
      expired_certificates: this.studentCertificates.filter(x => x.status === 'Đã hết hạn').length,
      revoked_certificates: this.studentCertificates.filter(x => x.status === 'Đã thu hồi').length,
      pending_certificates: this.studentCertificates.filter(x => x.status === 'Đang chờ').length,
      total_students: this.students.length
    });
  }

  // ===== OPTIONS =====

  getCertificateStatusOptions() {
    return [
      { label: 'Đã cấp', value: 'Đã cấp' },
      { label: 'Đang chờ', value: 'Đang chờ' },
      { label: 'Đã hết hạn', value: 'Đã hết hạn' },
      { label: 'Đã thu hồi', value: 'Đã thu hồi' }
    ];
  }

  // ===== UTIL =====

  generateCertificateNumber(): string {
    return 'CERT-' + Math.floor(100000 + Math.random() * 900000);
  }

}
