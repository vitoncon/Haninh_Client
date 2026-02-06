import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/* =======================
   MODELS
======================= */

export interface Certificate {
  id: number;
  studentName: string;
  certificateName: string;
  certificateCode: string;
  issueDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

export interface CertificateSummary {
  total: number;
  issued: number;
  expired: number;
  pending: number;
}

/* =======================
   SERVICE
======================= */

@Injectable({
  providedIn: 'root'
})
export class CertificatesService {

  /* =======================
     MOCK DATABASE
  ======================= */

  private certificates: Certificate[] = [
    {
      id: 1,
      studentName: 'Nguyễn Văn An',
      certificateName: 'Angular Basic',
      certificateCode: 'CERT001',
      issueDate: '2025-01-01',
      expiryDate: '2026-01-01',
      status: 'ACTIVE'
    },
    {
      id: 2,
      studentName: 'Trần Thị Bình',
      certificateName: 'Java Spring',
      certificateCode: 'CERT002',
      issueDate: '2023-01-01',
      expiryDate: '2024-01-01',
      status: 'EXPIRED'
    },
    {
      id: 3,
      studentName: 'Lê Văn Cường',
      certificateName: 'NodeJS',
      certificateCode: 'CERT003',
      issueDate: '',
      expiryDate: '',
      status: 'PENDING'
    }
  ];

  /* =======================
     GET LIST
  ======================= */

  getCertificates(): Observable<Certificate[]> {
    return of([...this.certificates]);
  }

  /* =======================
     GET BY ID
  ======================= */

  getCertificateById(id: number): Observable<Certificate | undefined> {
    return of(this.certificates.find(c => c.id === id));
  }

  /* =======================
     CREATE
  ======================= */

  createCertificate(data: Certificate): Observable<Certificate> {
    data.id = this.generateId();
    this.certificates.push(data);
    return of(data);
  }

  /* =======================
     UPDATE (FIX LỖI 2 ARG)
     component gọi:
     updateCertificate(id, data)
  ======================= */

  updateCertificate(id: number, data: Certificate): Observable<Certificate> {
    const index = this.certificates.findIndex(c => c.id === id);

    if (index !== -1) {
      this.certificates[index] = {
        ...data,
        id
      };
    }

    return of(this.certificates[index]);
  }

  /* =======================
     DELETE
  ======================= */

  deleteCertificate(id: number): Observable<boolean> {
    this.certificates = this.certificates.filter(c => c.id !== id);
    return of(true);
  }

  /* =======================
     SUMMARY DASHBOARD
     Tổng CC / Đã cấp / Hết hạn / Chờ cấp
  ======================= */

  getSummary(): Observable<CertificateSummary> {

    const total = this.certificates.length;

    const issued = this.certificates.filter(c =>
      c.status === 'ACTIVE'
    ).length;

    const expired = this.certificates.filter(c =>
      c.status === 'EXPIRED'
    ).length;

    const pending = this.certificates.filter(c =>
      c.status === 'PENDING'
    ).length;

    return of({
      total,
      issued,
      expired,
      pending
    });
  }

  /* =======================
     HELPER
  ======================= */

  private generateId(): number {
    return this.certificates.length
      ? Math.max(...this.certificates.map(c => c.id)) + 1
      : 1;
  }
}
