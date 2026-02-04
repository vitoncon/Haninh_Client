import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './courses.html',
  styleUrls: ['./courses.css'],
})
export class CoursesComponent {
  courses = [
    {
      id: 1,
      name: 'Tiếng Anh Giao Tiếp',
      language: 'English',
      level: 'Cơ bản – Trung cấp',
      duration: '3 tháng',
      price: '2.500.000 VNĐ',
      description: 'Khóa học tiếng Anh giao tiếp dành cho người mất gốc',
      image: 'assets/images/english.jpg',
    },
    {
      id: 2,
      name: 'Tiếng Hàn TOPIK I',
      language: 'Korean',
      level: 'Sơ cấp',
      duration: '4 tháng',
      price: '3.200.000 VNĐ',
      description: 'Luyện thi TOPIK I từ cơ bản đến nâng cao',
      image: 'assets/images/korean.jpg',
    },
    {
      id: 3,
      name: 'Tiếng Trung HSK 3',
      language: 'Chinese',
      level: 'Trung cấp',
      duration: '5 tháng',
      price: '3.800.000 VNĐ',
      description: 'Khóa học luyện thi HSK 3 bài bản',
      image: 'assets/images/chinese.jpg',
    },
  ];
}
