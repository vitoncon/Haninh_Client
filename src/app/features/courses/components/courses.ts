import { Component } from '@angular/core';
import { Course } from '@features/courses/models/courses.model';
import { CourseService } from '@features/courses/services/courses.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';  // ✅ thêm import
import { FormsModule } from '@angular/forms';  // ✅ thêm dòng này

@Component({
  selector: 'app-courses',
  standalone: true,
  templateUrl: './courses.html',
  styleUrls: ['./courses.scss'],
  imports: [CommonModule, TableModule, ButtonModule, SelectButtonModule,FormsModule], 
})
export class Courses {
    courses: Course[] = [];   // 🔥 Khai báo biến này để binding với template

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getCoursesMini().then(data => this.courses = data);
  }
}
