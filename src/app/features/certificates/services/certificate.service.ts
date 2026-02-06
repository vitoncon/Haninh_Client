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
      certificate_code: 'CERT001',
      student_name: 'Nguyễn Văn An',
      class_name: 'Angular Basic',
      certificate_type: 'Completion',
      issue_date: '2024-01-10',
      expiry_date: '2025-01-10',
      status: 'Active'
    },
    {
      id: 2,
      certificate_code: 'CERT002',
      student_name: 'Trần Thị Bình',
      class_name: 'React Advanced',
      certificate_type: 'Completion',
      issue_date: '2023-01-10',
      expiry_date: '2024-01-10',
      status: 'Expired'
    }
  ];

  private mockStudentsInClass: any[] = [
    {
      id: 1,
      student_code: 'HV001',
      full_name: 'Nguyễn Văn An'
    },
    {
      id: 2,
      student_code: 'HV002',
      full_name: 'Trần Thị Bình'
    },
    {
      id: 3,
      student_code: 'HV003',
      full_name: 'Lê Minh Châu'
    }
  ];

  // ================= LIST CERTIFICATES =================

  getCertificates(filters?: CertificateFilters): Observable<any[]> {
    return of(this.mockCertificates);
  }

  getCertificateById(id: number): Observable<any> {
    const cert = this.mockCertificates.find(x => x.id === id);
    return of(cert);
  }

  createCertificate(data: any): Observable<any> {
    const newItem = {
      id: Date.now(),
      ...data
    };
    this.mockCertificates.push(newItem);
    return of(newItem);
  }

  updateCertificate(id: number, data: any): Observable<any> {
    const index = this.mockCertificates.findIndex(x => x.id === id);
    if (index !== -1) {
      this.mockCertificates[index] = {
        ...this.mockCertificates[index],
        ...data
      };
    }
    return of(this.mockCertificates[index]);
  }

  deleteCertificate(id: number): Observable<boolean> {
    this.mockCertificates = this.mockCertificates.filter(x => x.id !== id);
    return of(true);
  }

  // ================= STATISTICS =================

  getCertificateStatistics(filters?: CertificateFilters): Observable<any> {
    return of({
      total: 120,
      active: 80,
      expired: 40
    });
  }

  // ================= STUDENTS IN CLASS =================

  getStudentsInClass(classId: number): Observable<any[]> {
    return of(this.mockStudentsInClass);
  }

  // ================= CERTIFICATE TYPE =================

  getCertificateTypes(): Observable<any[]> {
    return of([
      { id: 1, name: 'Completion', validity_months: 12 },
      { id: 2, name: 'Participation', validity_months: 6 }
    ]);
  }

  getCertificateTypeDetails(id: number): Observable<any> {
    return of({
      id,
      name: 'Completion',
      validity_months: 12,
      description: 'Chứng chỉ hoàn thành khóa học'
    });
  }

  // ================= DATE CALC =================

  calculateExpiryDate(issueDate: string, months: number): Observable<string> {
    const date = new Date(issueDate);
    date.setMonth(date.getMonth() + months);
    return of(date.toISOString());
  }

}
