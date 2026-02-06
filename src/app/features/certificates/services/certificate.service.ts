import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * MODEL ĐÚNG THEO COMPONENT ĐANG DÙNG
 */
export interface StudentCertificateWithDetails {
  id: number;
  student_id: number;

  certificate_id: number;
  certificate_code: string;
  certificate_name: string;

  issued_date: string;
  status: 'issued' | 'pending' | 'revoked';

  student_name?: string;
  course_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  constructor() {}

  /**
   * MOCK DATA FULL
   */
  private certificatesMock: StudentCertificateWithDetails[] = [
    {
      id: 1,
      student_id: 101,
      certificate_id: 1,
      certificate_code: 'CERT-001',
      certificate_name: 'Angular Developer',
      issued_date: '2025-01-10',
      status: 'issued',
      student_name: 'Nguyen Van A',
      course_name: 'Angular Master'
    },
    {
      id: 2,
      student_id: 102,
      certificate_id: 2,
      certificate_code: 'CERT-002',
      certificate_name: 'Java Spring Boot',
      issued_date: '2025-02-15',
      status: 'pending',
      student_name: 'Tran Thi B',
      course_name: 'Spring Boot Pro'
    },
    {
      id: 3,
      student_id: 103,
      certificate_id: 3,
      certificate_code: 'CERT-003',
      certificate_name: 'UI UX Design',
      issued_date: '2025-03-20',
      status: 'issued',
      student_name: 'Le Van C',
      course_name: 'UI UX Expert'
    }
  ];

  /**
   * GET ALL
   */
  getCertificates(): Observable<StudentCertificateWithDetails[]> {
    return of(this.certificatesMock);
  }

  /**
   * GET BY ID
   */
  getCertificateById(id: number): Observable<StudentCertificateWithDetails | undefined> {
    const found = this.certificatesMock.find(c => c.id === id);
    return of(found);
  }

  /**
   * CREATE
   */
  createCertificate(data: StudentCertificateWithDetails): Observable<StudentCertificateWithDetails> {
    const newItem: StudentCertificateWithDetails = {
      ...data,
      id: Date.now()
    };

    this.certificatesMock.push(newItem);
    return of(newItem);
  }

  /**
   * UPDATE
   */
  updateCertificate(
    id: number,
    data: Partial<StudentCertificateWithDetails>
  ): Observable<StudentCertificateWithDetails | null> {

    const index = this.certificatesMock.findIndex(c => c.id === id);

    if (index === -1) return of(null);

    this.certificatesMock[index] = {
      ...this.certificatesMock[index],
      ...data
    };

    return of(this.certificatesMock[index]);
  }

  /**
   * DELETE
   */
  deleteCertificate(id: number): Observable<boolean> {
    const index = this.certificatesMock.findIndex(c => c.id === id);

    if (index === -1) return of(false);

    this.certificatesMock.splice(index, 1);
    return of(true);
  }

  /**
   * THỐNG KÊ TỔNG HỢP
   */
  getCertificateSummary(): Observable<{
    total: number;
    issued: number;
    pending: number;
    revoked: number;
  }> {

    const total = this.certificatesMock.length;
    const issued = this.certificatesMock.filter(c => c.status === 'issued').length;
    const pending = this.certificatesMock.filter(c => c.status === 'pending').length;
    const revoked = this.certificatesMock.filter(c => c.status === 'revoked').length;

    return of({
      total,
      issued,
      pending,
      revoked
    });
  }
}
