import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/* ================= MODELS ================= */

export interface Certificate {
  id: number;
  certificate_number: string;
  student_id: number;
  student_name: string;
  class_id: number;
  class_name: string;
  status: string;
  issue_date: string;
  expiry_date: string;
}

export interface CertificateFilters {
  keyword?: string;
  status?: string;
  class_id?: number;
}

/* ================= SERVICE ================= */

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  constructor() {}

  /* ================= MOCK DATA ================= */

  private mockCertificates: Certificate[] = [
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
    },
    {
      id: 2,
      certificate_number: 'CERT002',
      student_id: 2,
      student_name: 'Trần Thị Bình',
      class_id: 2,
      class_name: 'React Advanced',
      status: 'Expired',
      issue_date: '2023-01-01',
      expiry_date: '2024-01-01'
    }
  ];

  private mockStudents: any[] = [
    { id: 1, full_name: 'Nguyễn Văn An', student_code: 'HV001' },
    { id: 2, full_name: 'Trần Thị Bình', student_code: 'HV002' }
  ];

  private mockClasses: any[] = [
    { id: 1, class_name: 'Angular Basic' },
    { id: 2, class_name: 'React Advanced' }
  ];

  private mockCertificateTypes: any[] = [
    { id: 1, name: 'Completion', validity_months: 12 }
  ];

  /* ================= CERTIFICATE CRUD ================= */

  getCertificates(filters?: CertificateFilters): Observable<Certificate[]> {
    let data = [...this.mockCertificates];

    if (filters?.keyword) {
      data = data.filter(x =>
        x.student_name.toLowerCase().includes(filters.keyword!.toLowerCase())
      );
    }

    if (filters?.status) {
      data = data.filter(x => x.status === filters.status);
    }

    if (filters?.class_id) {
      data = data.filter(x => x.class_id === filters.class_id);
    }

    return of(data);
  }

  getStudentCertificates(): Observable<Certificate[]> {
    return of(this.mockCertificates);
  }

  getCertificateById(id: number): Observable<Certificate | undefined> {
    return of(this.mockCertificates.find(x => x.id === id));
  }

  addStudentCertificate(data: Partial<Certificate>): Observable<Certificate> {
    const newItem: Certificate = {
      id: Date.now(),
      certificate_number: data.certificate_number || this.generateCertificateNumber(),
      student_id: data.student_id || 0,
      student_name: data.student_name || '',
      class_id: data.class_id || 0,
      class_name: data.class_name || '',
      status: data.status || 'Active',
      issue_date: data.issue_date || new Date().toISOString(),
      expiry_date: data.expiry_date || new Date().toISOString()
    };

    this.mockCertificates.push(newItem);
    return of(newItem);
  }

  updateStudentCertificate(id: number, data: Partial<Certificate>): Observable<Certificate> {
    const index = this.mockCertificates.findIndex(x => x.id === id);

    if (index !== -1) {
      this.mockCertificates[index] = {
        ...this.mockCertificates[index],
        ...data
      };
      return of(this.mockCertificates[index]);
    }

    return of(data as Certificate);
  }

  deleteStudentCertificate(id: number): Observable<boolean> {
    this.mockCertificates = this.mockCertificates.filter(x => x.id !== id);
    return of(true);
  }

  /* ================= BASE CRUD ================= */

  createCertificate(data: Partial<Certificate>): Observable<Certificate> {
    return this.addStudentCertificate(data);
  }

  updateCertificate(id: number, data: Partial<Certificate>): Observable<Certificate> {
    return this.updateStudentCertificate(id, data);
  }

  deleteCertificate(id: number): Observable<boolean> {
    return this.deleteStudentCertificate(id);
  }

  /* ================= STATISTICS ================= */

  getCertificateStatistics(filters?: CertificateFilters): Observable<any> {
    const total = this.mockCertificates.length;
    const active = this.mockCertificates.filter(x => x.status === 'Active').length;
    const expired = this.mockCertificates.filter(x => x.status === 'Expired').length;

    return of({
      total,
      active,
      expired
    });
  }

  /* ================= STUDENTS ================= */

  getStudents(): Observable<any[]> {
    return of(this.mockStudents);
  }

  getStudentsInClass(classId: number): Observable<any[]> {
    return of(this.mockStudents.filter(x => x.id));
  }

  /* ================= CLASSES ================= */

  getClasses(): Observable<any[]> {
    return of(this.mockClasses);
  }

  /* ================= CERTIFICATE TYPES ================= */

  getCertificateTypes(): Observable<any[]> {
    return of(this.mockCertificateTypes);
  }

  getCertificateTypeDetails(id: number): Observable<any> {
    return of(this.mockCertificateTypes.find(x => x.id === id));
  }

  /* ================= OPTIONS ================= */

  getCertificateStatusOptions(): any[] {
    return [
      { label: 'Active', value: 'Active' },
      { label: 'Expired', value: 'Expired' },
      { label: 'Revoked', value: 'Revoked' }
    ];
  }

  /* ================= UTIL ================= */

  generateCertificateNumber(): string {
    return 'CERT-' + Math.floor(Math.random() * 1000000);
  }

  calculateExpiryDate(issueDate: string, months: number): Observable<string> {
    const d = new Date(issueDate);
    d.setMonth(d.getMonth() + months);
    return of(d.toISOString());
  }

}
