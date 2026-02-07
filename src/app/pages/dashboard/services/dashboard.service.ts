import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface DashboardStatistics {
  totalStudents: number;
  totalClasses: number;
  activeClasses: number;
  totalCourses: number;
  totalRevenue: number;
  recentRegistrations: number;
  attendanceRate: number;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  // ===== MOCK STATISTICS =====
  getDashboardStatistics(): Observable<DashboardStatistics> {
    return of({
      totalStudents: 1280,
      totalClasses: 45,
      activeClasses: 32,
      totalCourses: 18,
      totalRevenue: 1250000000,
      recentRegistrations: 95,
      attendanceRate: 87
    });
  }

  // ===== MOCK RECENT STUDENTS =====
  getRecentStudents(): Observable<any[]> {
  return of([
    {
      student_name: 'Nguyễn Văn A',
      email: 'a@gmail.com',
      phone: '0900000001',
      created_at: '2026-02-01'
    },
    {
      student_name: 'Trần Thị B',
      email: 'b@gmail.com',
      phone: '0900000002',
      created_at: '2026-02-02'
    },
    {
      student_name: 'Lê Văn C',
      email: 'c@gmail.com',
      phone: '0900000003',
      created_at: '2026-02-03'
    },
    {
      student_name: 'Phạm Thị D',
      email: 'd@gmail.com',
      phone: '0900000004',
      created_at: '2026-02-04'
    },
    {
      student_name: 'Hoàng Văn E',
      email: 'e@gmail.com',
      phone: '0900000005',
      created_at: '2026-02-05'
    }
  ]);
}
}

  // ===== MOCK CLASS DISTRIBUTION =====
  getClassDistributionByCourse(): Observable<ChartData> {
    return of({
      labels: [
        'HSK 3',
        'HSK 4',
        'JLPT N4',
        'TOPIK 2'
      ],
      datasets: [
        {
          label: 'Số lớp',
          data: [12, 8, 10, 6],
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ]
        }
      ]
    });
  }

  // ===== MOCK REVENUE CHART =====
  getRevenueChartData(): Observable<ChartData> {
    return of({
      labels: [
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12',
        'Tháng 1',
        'Tháng 2'
      ],
      datasets: [
        {
          label: 'Doanh thu (VNĐ)',
          data: [
            150000000,
            180000000,
            210000000,
            240000000,
            260000000,
            280000000
          ],
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          tension: 0.4
        }
      ]
    });
  }

  // ===== MOCK PAYMENT STATUS =====
  getPaymentStatusDistribution(): Observable<ChartData> {
    return of({
      labels: [
        'Đã thanh toán',
        'Chưa thanh toán',
        'Quá hạn',
        'Còn nợ'
      ],
      datasets: [
        {
          data: [320, 95, 40, 60],
          backgroundColor: [
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#6B7280'
          ]
        }
      ]
    });
  }

  // ===== MOCK TOP COURSES =====
  getTopCoursesByRevenue(): Observable<any[]> {
    return of([
      { course_name: 'HSK 4', revenue: 320000000 },
      { course_name: 'JLPT N3', revenue: 280000000 },
      { course_name: 'TOPIK 3', revenue: 250000000 },
      { course_name: 'HSK 3', revenue: 210000000 },
      { course_name: 'JLPT N4', revenue: 180000000 }
    ]);
  }

  // ===== MOCK UPCOMING CLASSES =====
  getUpcomingClasses(): Observable<any[]> {
    return of([
      {
        class_name: 'HSK 4 - Ca tối',
        start_date: '2026-02-10'
      },
      {
        class_name: 'TOPIK 2 - Ca sáng',
        start_date: '2026-02-12'
      },
      {
        class_name: 'JLPT N4 - Ca tối',
        start_date: '2026-02-15'
      }
    ]);
  }
}
