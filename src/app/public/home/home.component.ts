import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

export interface Course {
  name: string;
  level: string;
  price: string;
  description: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Review {
  name: string;
  role: string;
  content: string;
  rating: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    RippleModule,
    CardModule,
    TagModule,
    DividerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    courses: Course[] = [
        {
          name: 'Tiếng Anh giao tiếp cơ bản',
          level: 'Beginner',
          price: '3.800.000đ',
          description: 'Phát triển kỹ năng nghe – nói tiếng Anh trong các tình huống giao tiếp hằng ngày'
        },
        {
          name: 'Tiếng Anh IELTS Foundation',
          level: 'Beginner - Intermediate',
          price: '5.500.000đ',
          description: 'Xây dựng nền tảng từ vựng, ngữ pháp và kỹ năng làm bài IELTS cho người mới bắt đầu'
        },
        {
          name: 'IELTS Intensive 6.5+',
          level: 'Advanced',
          price: '8.500.000đ',
          description: 'Luyện chuyên sâu 4 kỹ năng IELTS, cam kết đầu ra từ 6.5+'
        },
        {
          name: 'Tiếng Trung giao tiếp HSK 1-2',
          level: 'Beginner',
          price: '4.200.000đ',
          description: 'Học tiếng Trung từ cơ bản, luyện phát âm chuẩn và giao tiếp thông dụng'
        },
        {
          name: 'Tiếng Trung HSK 3-4',
          level: 'Intermediate',
          price: '6.000.000đ',
          description: 'Phát triển toàn diện nghe – nói – đọc – viết, chuẩn bị thi HSK cấp trung'
        },
        {
          name: 'Tiếng Hàn giao tiếp TOPIK 1',
          level: 'Beginner',
          price: '4.500.000đ',
          description: 'Học tiếng Hàn giao tiếp cơ bản, làm quen bảng chữ cái Hangul và hội thoại thực tế'
        },
        {
          name: 'Tiếng Hàn TOPIK 2',
          level: 'Intermediate',
          price: '6.800.000đ',
          description: 'Luyện thi TOPIK cấp trung, nâng cao kỹ năng đọc hiểu và viết'
        }
      ];
      

      features: Feature[] = [
        {
          icon: 'pi pi-robot',
          title: 'AI tư vấn khóa học phù hợp',
          description: 'Hệ thống AI phân tích nhu cầu học tập để gợi ý khóa học phù hợp với bạn'
        },
        {
          icon: 'pi pi-chart-line',
          title: 'Lộ trình học cá nhân hóa',
          description: 'Chương trình học được thiết kế theo trình độ và mục tiêu học của từng học viên'
        },
        {
          icon: 'pi pi-users',
          title: 'Giảng viên chuyên môn cao',
          description: 'Đội ngũ giảng viên nhiều năm kinh nghiệm giảng dạy ngoại ngữ'
        },
        {
          icon: 'pi pi-book',
          title: 'Tài liệu chuẩn quốc tế',
          description: 'Sử dụng giáo trình cập nhật theo tiêu chuẩn IELTS, HSK và TOPIK'
        },
        {
          icon: 'pi pi-headphones',
          title: 'Hỗ trợ học viên 24/7',
          description: 'Đội ngũ tư vấn và trợ lý AI luôn sẵn sàng hỗ trợ trong suốt quá trình học'
        }
      ];
      
  reviews: Review[] = [
    {
      name: 'Nguyễn Văn A',
      role: 'Sinh viên',
      content: 'Khóa học rất hay, giảng viên nhiệt tình và AI tư vấn rất hữu ích!',
      rating: 5
    },
    {
      name: 'Trần Thị B',
      role: 'Nhân viên văn phòng',
      content: 'Lộ trình học được cá nhân hóa phù hợp với lịch trình bận rộn của tôi.',
      rating: 5
    },
    {
      name: 'Lê Văn C',
      role: 'Freelancer',
      content: 'Chất lượng giảng dạy tốt, kiến thức thực tế và áp dụng được ngay.',
      rating: 5
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  scrollToCourses(): void {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  navigateToChat(): void {
    this.router.navigate(['/public-ai-chat']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  getLevelSeverity(level: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warn';
      case 'advanced':
        return 'danger';
      default:
        return 'info';
    }
  }
}
