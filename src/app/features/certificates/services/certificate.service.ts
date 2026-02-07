import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Certificate,
  StudentCertificate,
  StudentCertificateWithDetails,
  CertificateStatistics
} from '../models/certificates.model';

@Injectable({ providedIn: 'root' })
export class CertificateService {

  // ================= MOCK MASTER DATA =================

  private certificates: Certificate[] = [
    {
      id: 1,
      certificate_code: 'HSK3',
      certificate_name: 'HSK 3',
      validity_period_months: 24,
      is_permanent: 0,
      status: 'Hoạt động'
    },
    {
      id: 2,
      certificate_code: 'TOPIK2',
      certificate_name: 'TOPIK II',
      validity_period_months: 36,
      is_permanent: 0,
      status: 'Hoạt động'
    },
    {
      id: 3,
      certificate_code: 'JLPTN3',
      certificate_name: 'JLPT N3',
      validity_period_months: 36,
      is_permanent: 0,
      status: 'Hoạt động'
    }
  ];

  private students = [
    { id: 101, student_code: 'HV001', full_name: 'Nguyễn Minh Anh' },
    { id: 102, student_code: 'HV002', full_name: 'Trần Lan' },
    { id: 103, student_code: 'HV003', full_name: 'Lê Nam' }
  ];

  private classes = [
    { id: 11, class_name: 'Trung cấp Trung K1', class_code: 'TC-TQ-K1' },
    { id: 21, class_name: 'TOPIK II K2', class_code: 'TC-HQ-K2' },
    { id: 31, class_name: 'JLPT N3 K1', class_code: 'JP-N3-K1' }
  ];

  private studentCertificates: StudentCertificateWithDetails[] = [
    {
      id: 1,
      student_id: 101,
      certificate_id: 1,
      class_id: 11,
      issued_date: '2025-01-01',
      expiry_date: '2027-01-01',
      certificate_number: 'CERT-001',
      status: 'Đã cấp',
      student_name: 'Nguyễn Minh Anh',
      student_code: 'HV001',
      certificate_name: 'HSK 3',
      certificate_code: 'HSK3'
    }
  ];

  // ================= BASIC =================

  getCertificates(): Observable<Certificate[]> {
    return of(this.certificates);
  }

  getStudentCertificates(): Observable<StudentCertificateWithDetails[]> {
    return of(this.studentCertificates);
  }

  // ================= STUDENT =================

  getStudents(): Observable<any[]> {
    return of(this.students);
  }

  getClasses(): Observable<any[]> {
    return of(this.classes);
  }

  getStudentsInClass(classId: number): Observable<any[]> {
    return of(this.students);
  }

  // ================= CRUD =================

  addStudentCertificate(data: StudentCertificate): Observable<any> {
    const newItem: any = {
      ...data,
      id: Date.now(),
      certificate_number: this.generateCertificateNumber()
    };
    this.studentCertificates.push(newItem);
    return of(newItem);
  }

  updateStudentCertificate(id: number, data: StudentCertificate): Observable<any> {
    const index = this.studentCertificates.findIndex(x => x.id === id);
    if (index >= 0) {
      this.studentCertificates[index] = { ...this.studentCertificates[index], ...data };
    }
    return of(this.studentCertificates[index]);
  }

  deleteStudentCertificate(id: number): Observable<any> {
    this.studentCertificates = this.studentCertificates.filter(x => x.id !== id);
    return of(true);
  }

  // ================= OPTIONS =================

  getCertificateStatusOptions() {
    return [
      { label: 'Đã cấp', value: 'Đã cấp' },
      { label: 'Đã thu hồi', value: 'Đã thu hồi' },
      { label: 'Đã hết hạn', value: 'Đã hết hạn' },
      { label: 'Đang chờ', value: 'Đang chờ' }
    ];
  }

  // ================= HELPER =================

  generateCertificateNumber(): string {
    return 'CERT-' + Math.floor(Math.random() * 999999);
  }

  getCertificateTypeDetails(id: number): Observable<any> {
    const cert = this.certificates.find(x => x.id === id);
    return of({
      isPermanent: cert?.is_permanent === 1,
      validityPeriod: cert?.validity_period_months || null,
      criteria: '',
      status: cert?.status || 'Hoạt động'
    });
  }

  calculateExpiryDate(issuedDate: string, certId: number): Observable<string | null> {
    const cert = this.certificates.find(x => x.id === certId);
    if (!cert || cert.is_permanent === 1) return of(null);

    const d = new Date(issuedDate);
    d.setMonth(d.getMonth() + (cert.validity_period_months || 0));
    return of(d.toISOString().split('T')[0]);
  }

  // ================= STATS =================

  getCertificateStatistics(): Observable<CertificateStatistics> {
    const total = this.studentCertificates.length;
    const issued = this.studentCertificates.filter(x => x.status === 'Đã cấp').length;

    return of({
      total_certificates: total,
      issued_certificates: issued,
      expired_certificates: 0,
      revoked_certificates: 0,
      pending_certificates: 0,
      total_students: new Set(this.studentCertificates.map(x => x.student_id)).size
    });
  }

}
