const INITIAL_EXAMS = [
  {
    id: "exam-ets-2024-test05",
    code: "ETS2024-TEST05-FULL",
    title: "ETS 2024 Test 05 - Reading Full",
    subject: "TOEIC Reading",
    category: "Full Reading Test",
    badge: "ETS 2024",
    duration: 75, 
    passingScore: 350,
    targetScore: "Target 700+",
    totalQuestionsCount: 10,
    rating: 4.9,
    testCount: "15.2k lượt thi",
    creator: "ThS. Lê Hoàng Tuấn (TOEIC 990)",
    createdAt: "2026-10-12",
    status: "active",
    description: "Đề thi TOEIC Reading chuẩn ETS 2024 mới nhất. Bao gồm trọn vẹn Part 5 (Ngữ pháp & Từ loại), Part 6 (Điền đoạn văn) và Part 7 (Đọc hiểu văn bản thương mại đơn, đôi, ba).",
    metrics: {
      completion: 100,
      explained: "10/10",
      reviewNeeded: 3
    },
    passages: [
      {
        id: "pass-techcorp-review",
        partType: "Part 7",
        passageType: "Single Passage (Email)",
        range: "Câu 152 - 154",
        title: "Annual Performance Review Schedule & Guidelines",
        metadata: {
          from: "hr-department@techcorp-solutions.com",
          to: "all-staff@techcorp-solutions.com",
          date: "November 14, 2024 - 09:15 AM",
          subject: "Annual Performance Review Schedule & Guidelines"
        },
        content: `Dear TechCorp Team Members,

As we approach the end of the fourth fiscal quarter, Human Resources is initiating our company-wide Annual Performance Review process. This comprehensive evaluation offers everyone an intentional opportunity to reflect upon quarterly milestones, identify professional aspirations, and align personal goals with our strategic plans for the upcoming year.

Starting next Monday, November 18, all department supervisors will open one-on-one conference slots on the internal portal. Please take time this week to complete your self-assessment questionnaire prior to meeting your direct manager.

Sincerely,
Clarissa Vance, Director of Human Resources`
      },
      {
        id: "pass-it-migration",
        partType: "Part 7",
        passageType: "Memorandum",
        range: "Câu 147 - 148",
        title: "IT Infrastructure System Migration Schedule",
        metadata: {
          from: "it-support@globaltech.com",
          to: "All Regional Staff",
          date: "October 10, 2026",
          subject: "MEMORANDUM: Scheduled Data Center Migration"
        },
        content: `MEMORANDUM: To all regional staff. Please be reminded that the annual IT migration scheduled for this Friday will cause temporary downtime on the central network from 11:00 PM to 04:00 AM. Ensure all project files are saved on cloud backups.`
      }
    ],
    questions: [

      {
            "id": "q-101",
            "partType": "Part 5",
            "questionNumber": 101,
            "status": "Đã duyệt",
            "difficulty": "Dễ",
            "points": "5.0",
            "question": "Customer satisfaction is our top ------ at the Grand Plaza Hotel.",
            "options": {
                  "A": "prioritize",
                  "B": "prioritized",
                  "C": "priority",
                  "D": "prioritizing"
            },
            "correctAnswer": "C",
            "explanation": "Sau tính từ sở hữu 'our' và tính từ 'top' cần một danh từ. Chọn 'priority' (sự ưu tiên hàng đầu).",
            "tags": [
                  "#part5",
                  "#grammar"
            ]
      },
      {
            "id": "q-102",
            "partType": "Part 5",
            "questionNumber": 102,
            "status": "Đã duyệt",
            "difficulty": "Trung bình",
            "points": "5.0",
            "question": "All employees are required to ------ their identification badges upon entering the secure laboratory facility.",
            "options": {
                  "A": "display",
                  "B": "displays",
                  "C": "displayed",
                  "D": "displaying"
            },
            "correctAnswer": "A",
            "explanation": "Cấu trúc bị động 'be required to + V-infinitive'. Chọn 'display' (xuất trình/đeo thẻ).",
            "tags": [
                  "#part5",
                  "#vocabulary"
            ]
      },
      {
            "id": "q-103",
            "partType": "Part 5",
            "questionNumber": 103,
            "status": "Đã duyệt",
            "difficulty": "Dễ",
            "points": "5.0",
            "question": "The marketing director spoke highly of the new campaign, calling it ------ the most creative project of the year.",
            "options": {
                  "A": "easily",
                  "B": "ease",
                  "C": "easier",
                  "D": "easiest"
            },
            "correctAnswer": "A",
            "explanation": "Trạng từ 'easily' đi kèm so sánh nhất mang nghĩa 'chắc chắn là nhất'.",
            "tags": [
                  "#part5",
                  "#vocabulary"
            ]
      },
      {
            "id": "q-104",
            "partType": "Part 5",
            "questionNumber": 104,
            "status": "Đã duyệt",
            "difficulty": "Trung bình",
            "points": "5.0",
            "question": "Mr. Henderson will present his quarterly sales report ------ the board meeting tomorrow.",
            "options": {
                  "A": "during",
                  "B": "while",
                  "C": "between",
                  "D": "among"
            },
            "correctAnswer": "A",
            "explanation": "'During' + cụm danh từ (trong suốt cuộc họp).",
            "tags": [
                  "#part5",
                  "#vocabulary"
            ]
      },
      {
            "id": "q-105",
            "partType": "Part 5",
            "questionNumber": 105,
            "status": "Đã duyệt",
            "difficulty": "Dễ",
            "points": "5.0",
            "question": "The legal counsel advised both parties to reach a mutual ------ before signing the lease.",
            "options": {
                  "A": "agreement",
                  "B": "agree",
                  "C": "agreeable",
                  "D": "agreeably"
            },
            "correctAnswer": "A",
            "explanation": "Sau tính từ 'mutual' cần danh từ 'agreement' (thỏa thuận chung).",
            "tags": [
                  "#part5",
                  "#grammar"
            ]
      },
      {
            "id": "q-106",
            "partType": "Part 5",
            "questionNumber": 106,
            "status": "Đã duyệt",
            "difficulty": "Trung bình",
            "points": "5.0",
            "question": "The accounting team worked diligently to ------ that all invoices were paid before fiscal year-end.",
            "options": {
                  "A": "ensure",
                  "B": "assure",
                  "C": "reassure",
                  "D": "insure"
            },
            "correctAnswer": "A",
            "explanation": "'Ensure that' mang nghĩa đảm bảo rằng điều gì xảy ra.",
            "tags": [
                  "#part5",
                  "#vocabulary"
            ]
      },
      {
            "id": "q-107",
            "partType": "Part 5",
            "questionNumber": 107,
            "status": "Đã duyệt",
            "difficulty": "Dễ",
            "points": "5.0",
            "question": "Passengers are advised to arrive at the airport at least two hours ------ to international departure.",
            "options": {
                  "A": "prior",
                  "B": "previous",
                  "C": "ahead",
                  "D": "beforehand"
            },
            "correctAnswer": "A",
            "explanation": "Cụm cố định 'prior to' + Noun mang nghĩa trước khi.",
            "tags": [
                  "#part5",
                  "#vocabulary"
            ]
      },
      {
            "id": "q-108",
            "partType": "Part 5",
            "questionNumber": 108,
            "status": "Đã duyệt",
            "difficulty": "Trung bình",
            "points": "5.0",
            "question": "The newly designed website is significantly more ------ to navigate than the older version.",
            "options": {
                  "A": "accessible",
                  "B": "access",
                  "C": "accessing",
                  "D": "accessibility"
            },
            "correctAnswer": "A",
            "explanation": "Sau to-be và trạng từ 'more' cần tính từ 'accessible' (dễ tiếp cận).",
            "tags": [
                  "#part5",
                  "#grammar"
            ]
      },
      {
            "id": "q-109",
            "partType": "Part 5",
            "questionNumber": 109,
            "status": "Đã duyệt",
            "difficulty": "Dễ",
            "points": "5.0",
            "question": "Please submit your reimbursement request ------ Friday afternoon to receive payment next week.",
            "options": {
                  "A": "by",
                  "B": "until",
                  "C": "at",
                  "D": "on"
            },
            "correctAnswer": "A",
            "explanation": "'By' + mốc thời gian mang nghĩa trước hoặc chậm nhất vào thời điểm đó.",
            "tags": [
                  "#part5",
                  "#vocabulary"
            ]
      },
      {
            "id": "q-110",
            "partType": "Part 5",
            "questionNumber": 110,
            "status": "Đã duyệt",
            "difficulty": "Trung bình",
            "points": "5.0",
            "question": "Ms. Patel has demonstrated ------ leadership abilities during the company restructuring.",
            "options": {
                  "A": "exceptional",
                  "B": "exceptionally",
                  "C": "except",
                  "D": "exception"
            },
            "correctAnswer": "A",
            "explanation": "Cần tính từ 'exceptional' bổ nghĩa cho cụm danh từ 'leadership abilities'.",
            "tags": [
                  "#part5",
                  "#grammar"
            ]
      }
    ]
  },
  {
    id: "exam-practice-part5",
    code: "PRACTICE-PART5-GRAMMAR",
    title: "Chuyên đề Part 5: Từ loại & Thì động từ",
    subject: "TOEIC Grammar",
    category: "Chuyên đề Part 5",
    badge: "Luyện cấp tốc",
    duration: 20,
    passingScore: 80,
    targetScore: "Target 450+ Reading",
    totalQuestionsCount: 30,
    rating: 4.8,
    testCount: "8.9k lượt thi",
    creator: "Ban Chuyên Môn Ngữ Pháp TOEIC",
    createdAt: "2026-10-08",
    status: "active",
    description: "Tập trung các bẫy ngữ pháp thường gặp, giải chi tiết từng câu. Tỷ lệ chính xác trung bình cộng đồng: 78%.",
    metrics: { completion: 100, explained: "30/30", reviewNeeded: 0 },
    passages: [],
    questions: []
  },
  {
    id: "exam-ets-2023-test08",
    code: "ETS2023-TEST08",
    title: "ETS TOEIC 2023 - Test 08",
    subject: "TOEIC Reading",
    category: "Lịch sử thi",
    badge: "Đã làm ngày 12/10",
    duration: 75,
    passingScore: 300,
    targetScore: "Kết quả: 410 / 495",
    totalQuestionsCount: 10,
    rating: 4.7,
    testCount: "9.1k lượt thi",
    creator: "ETS Academic Center",
    createdAt: "2026-10-05",
    status: "completed",
    description: "Hoàn thành trong 71 phút • 82/100 câu đúng • Part 5: 27/30 (90%), Part 6: 13/16 (81%), Part 7: 42/54 (77%).",
    metrics: { completion: 100, explained: "100/100", reviewNeeded: 0 },
    passages: [],
    questions: []
  },
  {
    id: "exam-hackers-part7",
    code: "HACKERS-PART7-DOUBLE",
    title: "Hackers TOEIC Reading Test 03 - Part 7 Double Passage",
    subject: "TOEIC Reading",
    category: "Đoạn văn kép & ba",
    badge: "Độ khó cao",
    duration: 50,
    passingScore: 200,
    targetScore: "Target 850+",
    totalQuestionsCount: 54,
    rating: 4.8,
    testCount: "6.2k lượt thi",
    creator: "Hackers TOEIC Research Institute",
    createdAt: "2026-10-01",
    status: "active",
    description: "Luyện kỹ năng đối chiếu thông tin đoạn văn kép và từ vựng nâng cao.",
    metrics: { completion: 100, explained: "54/54", reviewNeeded: 2 },
    passages: [],
    questions: []
  }
];

const INITIAL_USERS = [
  {
    id: "user-teacher-01",
    username: "giangvien",
    password: "123",
    role: "teacher",
    fullName: "ThS. Lê Hoàng Tuấn",
    title: "Chuyên Gia Khảo Thí TOEIC (990/990)",
    avatar: "👨‍🏫",
    email: "tuan.le@toeicmaster.edu.vn"
  },
  {
    id: "user-student-01",
    username: "hocvien",
    password: "123",
    role: "student",
    fullName: "Nguyễn Hoàng Nam",
    studentCode: "SV20260101",
    avatar: "🎓",
    email: "learner@toeicmaster.edu.vn"
  }
];
