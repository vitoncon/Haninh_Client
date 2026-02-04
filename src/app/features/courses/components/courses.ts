import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.html',
  styleUrls: ['./courses.scss']
})
export class CoursesComponent implements OnInit {

  courses = [
    {
      id: 1,
      code: 'ENG-BASIC',
      name: 'Tiếng Anh Giao Tiếp Cơ Bản',
      language: 'English',
      level: 'Beginner',
      description: 'Khóa học dành cho người mất gốc, tập trung giao tiếp hằng ngày.',
      duration: '3 tháng',
      sessions: 36,
      schedule: 'T2 – T4 – T6 (18:30 – 20:00)',
      teacher: 'Mr. John',
      price: 2500000,
      discount: 10,
      status: 'Đang mở',
      image: 'https://via.placeholder.com/400x250?text=English'
    },
    {
      id: 2,
      code: 'KOR-TOPIK1',
      name: 'Tiếng Hàn TOPIK I',
      language: 'Korean',
      level: 'Beginner',
      description: 'Luyện thi TOPIK I, ngữ pháp và từ vựng trọng tâm.',
      duration: '4 tháng',
      sessions: 48,
      schedule: 'T3 – T5 – T7 (19:00 – 21:00)',
      teacher: 'Cô Kim',
      price: 3200000,
      discount: 0,
      status: 'Đang mở',
      image: 'https://via.placeholder.com/400x250?text=Korean'
    },
    {
      id: 3,
      code: 'CHI-HSK2',
      name: 'Tiếng Trung HSK 2',
      language: 'Chinese',
      level: 'Elementary',
      description: 'Phù hợp người mới bắt đầu, luyện nghe – nói – đọc – viết.',
      duration: '3.5 tháng',
      sessions: 42,
      schedule: 'T2 – T5 (18:00 – 20:00)',
      teacher: 'Cô Lý',
      price: 3000000,
      discount: 15,
      status: 'Sắp khai giảng',
      image: 'https://via.placeholder.com/400x250?text=Chinese'
    },
    {
      id: 4,
      code: 'ENG-IELTS',
      name: 'IELTS 6.5+',
      language: 'English',
      level: 'Intermediate',
      description: 'Cam kết đầu ra IELTS 6.5+, luyện đề sát thực tế.',
      duration: '5 tháng',
      sessions: 60,
      schedule: 'T2 – T4 – T6 (19:00 – 21:00)',
      teacher: 'Ms. Anna',
      price: 6500000,
      discount: 20,
      status: 'Đang mở',
      image: 'https://via.placeholder.com/400x250?text=IELTS'
    }
  ];

  ngOnInit(): void {
    // mock trực tiếp – không gọi API
  }
}
