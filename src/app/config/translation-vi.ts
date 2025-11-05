// translation-vi.ts
export const vi: any = {
  // Common filter labels
  startsWith: 'Bắt đầu với',
  contains: 'Chứa',
  notContains: 'Không chứa',
  endsWith: 'Kết thúc với',
  equals: 'Bằng',
  notEquals: 'Khác',
  noFilter: 'Không lọc',
  lt: 'Nhỏ hơn',
  lte: 'Nhỏ hơn hoặc bằng',
  gt: 'Lớn hơn',
  gte: 'Lớn hơn hoặc bằng',
  is: 'Là',
  isNot: 'Không là',
  before: 'Trước',
  after: 'Sau',
  clear: 'Xóa lọc',
  apply: 'Áp dụng',
  matchAll: 'Tất cả điều kiện',
  matchAny: 'Bất kỳ điều kiện',
  addRule: 'Thêm điều kiện',
  removeRule: 'Xóa',

  // Calendar & Date
  dayNames: [
    'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư',
    'Thứ năm', 'Thứ sáu', 'Thứ bảy'
  ],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  monthNamesShort: [
    'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
    'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'
  ],
  today: 'Hôm nay',
  weekHeader: 'Tuần',

  // Paginator
  first: 'Trang đầu',
  last: 'Trang cuối',
  next: 'Trang sau',
  previous: 'Trang trước',
  rowsPerPage: 'Số dòng mỗi trang',
  more: 'Xem thêm',
  emptyMessage: 'Không có kết quả',

  // File Upload
  choose: 'Chọn',
  upload: 'Tải lên',
  cancel: 'Hủy',
  remove: 'Xóa',
  invalidFileSize: 'Kích thước tệp không hợp lệ',
  invalidFileType: 'Loại tệp không hợp lệ',
  fileLimit: 'Đã đạt giới hạn số tệp',

  // Messages
  accept: 'Đồng ý',
  reject: 'Từ chối',
  chooseDate: 'Chọn ngày',

  // MultiSelect
  selectedItems: 'học viên đã chọn',
  itemsSelected: 'học viên đã chọn',
  selectedDays: 'thứ đã chọn'
};

// FullCalendar Vietnamese locale
export const fullCalendarViLocale = {
  code: 'vi',
  week: {
    dow: 1, // Monday is the first day of the week
    doy: 4  // The week that contains Jan 4th is the first week of the year
  },
  buttonText: {
    prev: 'Trước',
    next: 'Sau',
    today: 'Hôm nay',
    year: 'Năm',
    month: 'Tháng',
    week: 'Tuần',
    day: 'Ngày',
    list: 'Danh sách'
  },
  weekText: 'Tuần',
  allDayText: 'Cả ngày',
  moreLinkText: 'Khác',
  noEventsText: 'Không có sự kiện nào',
  buttonHints: {
    prev: '$0 Trước',
    next: '$0 Sau',
    today(buttonText: string) {
      return buttonText === 'Ngày' ? 'Hôm nay' : 'Tuần này';
    }
  },
  viewHint(buttonText: string) {
    return 'Xem ' + (buttonText === 'Tuần' ? 'Tuần' : buttonText === 'Tháng' ? 'Tháng' : 'Ngày');
  },
  navLinkHint: 'Đi tới $0',
  moreLinkHint(eventCnt: number) {
    return `Hiển thị thêm ${eventCnt} sự kiện`;
  },
  closeHint: 'Đóng',
  timeHint: 'Thời gian',
  eventHint: 'Sự kiện'
};