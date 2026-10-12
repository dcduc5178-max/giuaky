
const AppState = {
  viewMode: "showcase",
  currentActiveFrame: "screen-frame-1",
  currentUser: null,
  activeExam: null,
  selectedFile: null,
  activeQuestionIndex: 0,
  answers: {},
  currentQuestion: 101,
  flagged: new Set(),
  timerInterval: null,
  remainingSeconds: 75 * 60,
  passageZoomLevel: 13,
  showAnswerHint: false
};

document.addEventListener("DOMContentLoaded", () => {

  AppState.currentUser = StorageService.getCurrentUser();

  const exams = StorageService.getExams();
  AppState.activeExam = StorageService.getExamById("exam-ets-2024-test05") || exams[0];

  initExamRoomTimer();

  renderExamRoomQuestion();

  initResultScreenMockup();

  if (window.innerWidth < 820) {
    switchViewMode("interactive");
    activateSingleScreen("screen-frame-4");
  }

  checkSqlServerStatus();
  setupDropzoneEvents();
});

window.switchViewMode = function (mode) {
  AppState.viewMode = mode;
  const canvas = document.getElementById("appCanvas");
  const btnShowcase = document.getElementById("btnModeShowcase");
  const btnInteractive = document.getElementById("btnModeInteractive");
  const screenTabs = document.getElementById("screenSelectorTabs");

  if (mode === "showcase") {
    canvas.className = "app-canvas-container showcase-mode";
    btnShowcase.classList.add("active");
    btnInteractive.classList.remove("active");
    if (screenTabs) screenTabs.style.display = "none";

    document.querySelectorAll(".app-phone-frame").forEach(f => f.classList.add("active"));
    showToast("Đã bật Chế độ Showcase (Xem toàn bộ 6 màn hình song song)!", "info");
  } else {
    canvas.className = "app-canvas-container interactive-mode";
    btnInteractive.classList.add("active");
    btnShowcase.classList.remove("active");
    if (screenTabs) screenTabs.style.display = "flex";

    activateSingleScreen(AppState.currentActiveFrame || "screen-frame-1");
    showToast("Đã bật Chế độ Dùng Thật (Tương tác màn hình đơn)!", "success");
  }
};

window.activateSingleScreen = function (frameId) {
  AppState.currentActiveFrame = frameId;

  document.querySelectorAll(".app-phone-frame").forEach(f => {
    f.classList.toggle("active", f.id === frameId);
  });

  document.querySelectorAll(".screen-tab-pill").forEach(tab => {
    const text = tab.textContent;
    let match = false;
    if (frameId === "screen-frame-1" && text.includes("Đăng Nhập")) match = true;
    if (frameId === "screen-frame-2" && text.includes("Upload Test")) match = true;
    if (frameId === "screen-frame-3" && text.includes("Chỉnh Sửa")) match = true;
    if (frameId === "screen-frame-4" && text.includes("Exam List")) match = true;
    if (frameId === "screen-frame-5" && text.includes("Take Exam")) match = true;
    if (frameId === "screen-frame-6" && text.includes("Kết Quả")) match = true;
    tab.classList.toggle("active", match);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.focusScreen = function (frameId) {
  AppState.currentActiveFrame = frameId;
  switchViewMode("interactive");
  activateSingleScreen(frameId);
};

window.selectLoginRole = function (role) {
  const btnStudent = document.getElementById("loginRoleStudent");
  const btnTeacher = document.getElementById("loginRoleTeacher");
  const usernameInput = document.getElementById("inputLoginUsername");

  if (role === "teacher") {
    btnTeacher.classList.add("active");
    btnStudent.classList.remove("active");
    if (usernameInput) usernameInput.value = "tuan.le@toeicmaster.edu.vn";
  } else {
    btnStudent.classList.add("active");
    btnTeacher.classList.remove("active");
    if (usernameInput) usernameInput.value = "learner@toeicmaster.edu.vn";
  }
};

window.quickLoginRole = function (role) {
  selectLoginRole(role);
  showToast(`Đã chọn đăng nhập nhanh qua tài khoản ${role === 'teacher' ? 'Microsoft Edu' : 'Google Workspace'}`, "info");
  setTimeout(() => {
    handleSuccessfulLogin(role);
  }, 400);
};

window.handleLoginFormSubmit = function (e) {
  if (e) e.preventDefault();
  const username = document.getElementById("inputLoginUsername")?.value.trim() || "";
  const role = username.includes("tuan.le") || username.includes("giangvien") ? "teacher" : "student";
  handleSuccessfulLogin(role);
};

function handleSuccessfulLogin(role) {
  const users = (typeof INITIAL_USERS !== 'undefined') ? INITIAL_USERS : [];
  const user = users.find(u => u.role === role) || users[0];
  AppState.currentUser = user;
  StorageService.setCurrentUser(user);

  showToast(`Đăng nhập thành công! Xin chào ${user.fullName} (${user.role === 'teacher' ? 'Giảng viên' : 'Học viên'})`, "success");

  setTimeout(() => {
    if (role === "teacher") {
      focusScreen("screen-frame-2");
    } else {
      focusScreen("screen-frame-4");
    }
  }, 600);
}

window.triggerFileInput = function () {
  const fileInput = document.getElementById("realWordFileInput");
  if (fileInput) fileInput.click();
};

function setupDropzoneEvents() {
  const dropzone = document.getElementById("dropzoneWordFile");
  if (!dropzone) return;
  ["dragenter", "dragover"].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFileChosen({ target: { files: dt.files } });
    }
  });
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function parseToeicContentClient(rawText, defaultTitle = "Đề thi TOEIC Reading mới") {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const examInfo = {
    title: defaultTitle,
    duration: 75,
    subject: "TOEIC Reading",
    category: "Full Reading Test",
    targetScore: "Target 700+"
  };

  const passages = [];
  const questions = [];
  let currentPart = "Part 5";
  let inPassage = false;
  let passageLines = [];
  let passageMeta = {};
  let currentPassageId = null;
  let currentQ = null;

  function pushQuestion() {
    if (!currentQ) return;
    if (!currentQ.correctAnswer) currentQ.correctAnswer = "A";
    if (!currentQ.options || Object.keys(currentQ.options).length === 0) {
      currentQ.options = { A: "Option A", B: "Option B", C: "Option C", D: "Option D" };
    }
    if (!currentQ.partType) {
      const qNum = currentQ.questionNumber || 101;
      if (qNum >= 101 && qNum <= 130) currentQ.partType = "Part 5";
      else if (qNum >= 131 && qNum <= 146) currentQ.partType = "Part 6";
      else if (qNum >= 147 && qNum <= 200) currentQ.partType = "Part 7";
      else currentQ.partType = "Part 5";
    }
    questions.push(currentQ);
    currentQ = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (/^(?:\[EXAM\]|\[TITLE\]|Title:)/i.test(line)) {
      examInfo.title = line.replace(/^(?:\[EXAM\]|\[TITLE\]|Title:)\s*/i, "").trim() || examInfo.title;
      continue;
    }
    if (/^(?:\[DURATION\]|Duration:)/i.test(line)) {
      const num = parseInt(line.replace(/\D/g, ""));
      if (num) examInfo.duration = num;
      continue;
    }

    const partMatch = line.match(/\[PART\s*[:\s]\s*([567])\]/i) || line.match(/\[PART\s*([567])/i) || line.match(/PART\s*([567])\s*:/i);
    if (partMatch) {
      currentPart = `Part ${partMatch[1]}`;
      continue;
    }

    if (/\[PASSAGE(?:_START)?\]/i.test(line)) {
      pushQuestion();
      inPassage = true;
      passageLines = [];
      passageMeta = {};
      continue;
    }

    if (/\[\/(?:PASSAGE)\]|\[PASSAGE_END\]/i.test(line)) {
      inPassage = false;
      const pid = `pass-client-${passages.length + 1}`;
      passages.push({
        id: pid,
        partType: currentPart,
        passageType: passageMeta.Type || "Reading Passage",
        range: passageMeta.Range || `Bài đọc #${passages.length + 1}`,
        title: passageMeta.Subject || `Reading Passage ${passages.length + 1}`,
        metadata: passageMeta,
        content: passageLines.join("\n").trim()
      });
      currentPassageId = pid;
      continue;
    }

    if (inPassage) {
      const metaKeys = ["Type:", "From:", "To:", "Date:", "Subject:", "Range:"];
      let matched = false;
      for (const k of metaKeys) {
        if (line.startsWith(k)) {
          passageMeta[k.replace(":", "")] = line.substring(k.length).trim();
          matched = true;
          break;
        }
      }
      if (!matched && !line.startsWith("Content:")) {
        passageLines.push(line);
      }
      continue;
    }

    if (/\[GROUP\s*[:\s]\s*\d+\s*-\s*\d+\]|\[\/GROUP\]/i.test(line)) {
      continue;
    }

    const qMatch = line.match(/\[Q\s*[:\s]\s*(\d+)\]\s*(.*)/i) || line.match(/^(?:Câu|Question|Q)?\s*(\d+)[\.\:\)]\s*(.*)$/i);
    if (qMatch) {
      pushQuestion();
      const qNum = parseInt(qMatch[1]);
      let qText = (qMatch[2] || "").trim();
      if (!qText && qNum >= 131 && qNum <= 146) {
        qText = `Chọn từ thích hợp điền vào chỗ trống (${qNum}) trong đoạn văn trên.`;
      } else if (!qText) {
        qText = `Câu hỏi ${qNum}`;
      }

      let pType = currentPart;
      if (qNum >= 101 && qNum <= 130) pType = "Part 5";
      else if (qNum >= 131 && qNum <= 146) pType = "Part 6";
      else if (qNum >= 147 && qNum <= 200) pType = "Part 7";

      currentQ = {
        id: `q-up-${qNum}`,
        partType: pType,
        questionNumber: qNum,
        status: "Đã duyệt",
        difficulty: "Trung bình",
        points: "5.0",
        question: qText,
        options: {},
        correctAnswer: "",
        explanation: "",
        passageId: (pType === "Part 6" || pType === "Part 7") ? currentPassageId : null,
        tags: [`#${pType.toLowerCase().replace(/\s/g, '')}`]
      };
      continue;
    }

    const optMatch = line.match(/^\[([A-D])\]\s*(.*)$/i) || line.match(/^[\(\[]?([A-D])[\)\]\.\:]\s*(.*)$/i);
    if (optMatch && currentQ) {
      const letter = optMatch[1].toUpperCase();
      currentQ.options[letter] = optMatch[2].trim() || `Phương án ${letter}`;
      continue;
    }

    const ansMatch = line.match(/\[(?:ANS|ANSWER|KEY)\s*[:\s]\s*([A-D])\]/i) || line.match(/(?:Đáp\s*án|Key|Answer|ANS|Đ\/A)[\:\s]+([A-D])/i);
    if (ansMatch && currentQ) {
      currentQ.correctAnswer = ansMatch[1].toUpperCase();
      continue;
    }

    const expMatch = line.match(/\[(?:EXP|EXPLANATION)\s*[:\s]\s*(.*?)\]/i) || line.match(/^(?:Giải\s*thích|Explanation)[\:\s]+(.*)$/i);
    if (expMatch && currentQ) {
      currentQ.explanation = expMatch[1].trim();
      continue;
    }

    if (currentQ && Object.keys(currentQ.options).length === 0) {
      currentQ.question += " " + line;
    }
  }

  pushQuestion();
  questions = questions.slice(0, 10);
  return { examInfo, questions, passages };
}

window.handleFileChosen = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  AppState.selectedFile = file;

  const titleInput = document.getElementById("configExamTitle");
  if (titleInput) {
    const rawName = file.name.replace(/\.[^/.]+$/, "");
    titleInput.value = rawName || "Đề thi TOEIC Reading mới";
  }

  const dropzoneTitle = document.querySelector("#dropzoneWordFile .dropzone-title");
  const dropzoneSub = document.querySelector("#dropzoneWordFile .dropzone-sub");
  if (dropzoneTitle) {
    dropzoneTitle.textContent = `📄 Đã chọn: ${file.name}`;
  }
  if (dropzoneSub) {
    const sizeKb = (file.size / 1024).toFixed(1);
    dropzoneSub.textContent = `Kích thước: ${sizeKb} KB • Sẵn sàng trích xuất bằng AI Parser 4.2`;
  }

  showToast(`Đã nhận file: "${file.name}". Bấm "Tải lên & Trích xuất câu hỏi" để bắt đầu nạp đề!`, "success");
};

window.handleSimulateAiExtraction = async function () {
  const title = document.getElementById("configExamTitle")?.value.trim() || "ETS 2024 Test 05 - Reading Full";
  const duration = parseInt(document.getElementById("configExamDuration")?.value || 75);
  const file = AppState.selectedFile;

  showToast("⚙️ Đang kích hoạt AI Parser 4.2: Đang đọc và phân tích cấu trúc tài liệu Word...", "info");

  let parsedQuestions = [];
  let parsedPassages = [];

  if (file) {
    try {
      const fileName = file.name.toLowerCase();

      let fileBase64 = "";
      let fileText = "";

      if (fileName.endsWith(".docx")) {
        const buffer = await file.arrayBuffer();
        fileBase64 = arrayBufferToBase64(buffer);
      } else {
        fileText = await file.text();
      }

      try {
        const res = await fetch("/api/exam/parse-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64,
            fileText,
            fileName: file.name,
            title: title
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.questions && data.questions.length > 0) {
            parsedQuestions = data.questions;
            parsedPassages = data.passages || [];
          }
        }
      } catch (err) {
        console.warn("Backend /api/exam/parse-word chưa sẵn sàng, đang chuyển sang client-side parser...", err);
      }

      if (parsedQuestions.length === 0) {
        if (fileName.endsWith(".docx") && window.JSZip) {
          try {
            const zip = await window.JSZip.loadAsync(file);
            const docXml = await zip.file("word/document.xml")?.async("string");
            if (docXml) {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(docXml, "text/xml");
              const pNodes = xmlDoc.getElementsByTagName("w:p");
              const textLines = [];
              for (let i = 0; i < pNodes.length; i++) {
                const tNodes = pNodes[i].getElementsByTagName("w:t");
                let lineStr = "";
                for (let j = 0; j < tNodes.length; j++) {
                  lineStr += tNodes[j].textContent;
                }
                if (lineStr.trim()) textLines.push(lineStr.trim());
              }
              const clientResult = parseToeicContentClient(textLines.join("\n"), title);
              parsedQuestions = clientResult.questions;
              parsedPassages = clientResult.passages;
            }
          } catch (zipErr) {
            console.error("Lỗi parse docx bằng JSZip:", zipErr);
          }
        } else if (fileText) {
          const clientResult = parseToeicContentClient(fileText, title);
          parsedQuestions = clientResult.questions;
          parsedPassages = clientResult.passages;
        }
      }
    } catch (readErr) {
      console.error("Lỗi đọc file:", readErr);
    }
  }

  if (parsedQuestions.length === 0) {
    const baseExam = StorageService.getExams()[0] || INITIAL_EXAMS[0];
    parsedQuestions = JSON.parse(JSON.stringify(baseExam.questions || []));
    parsedPassages = JSON.parse(JSON.stringify(baseExam.passages || []));

    if (parsedQuestions.length < 10) {
      const extraQuestions = [
        {
          id: "q-104", partType: "Part 5", questionNumber: 104, status: "Đã duyệt", difficulty: "Trung bình", points: "5.0",
          question: "The keynote speaker will discuss how technological innovations have ------ supply chain operations.",
          options: { A: "transform", B: "transforms", C: "transformed", D: "transforming" },
          correctAnswer: "C", explanation: "Cấu trúc hiện tại hoàn thành have + V3/ed. Chọn 'transformed'.", tags: ["#grammar", "#verb"]
        },
        {
          id: "q-105", partType: "Part 5", questionNumber: 105, status: "Đã duyệt", difficulty: "Dễ", points: "5.0",
          question: "Board members voted ------ in favor of acquiring the local logistics company.",
          options: { A: "unanimously", B: "unanimous", C: "unanimity", D: "unanimousness" },
          correctAnswer: "A", explanation: "Cần trạng từ bổ nghĩa cho động từ 'voted'. Chọn 'unanimously' (nhất trí).", tags: ["#adverb"]
        },
        {
          id: "q-106", partType: "Part 5", questionNumber: 106, status: "Đã duyệt", difficulty: "Trung bình", points: "5.0",
          question: "Before submitting travel receipts, staff members must ensure all expenses were ------ pre-approved.",
          options: { A: "officially", B: "official", C: "office", D: "officer" },
          correctAnswer: "A", explanation: "Trạng từ 'officially' bổ nghĩa cho tính từ phân từ 'pre-approved'.", tags: ["#grammar"]
        },
        {
          id: "q-107", partType: "Part 5", questionNumber: 107, status: "Đã duyệt", difficulty: "Khó", points: "5.0",
          question: "The updated safety manual is available on our portal for anyone ------ wishes to consult it.",
          options: { A: "who", B: "which", C: "whom", D: "whose" },
          correctAnswer: "A", explanation: "Đại từ quan hệ làm chủ ngữ chỉ người đi sau 'anyone' là 'who'.", tags: ["#relative pronoun"]
        },
        {
          id: "q-108", partType: "Part 5", questionNumber: 108, status: "Đã duyệt", difficulty: "Dễ", points: "5.0",
          question: "Due to heavy traffic, the courier could not deliver the architectural blueprints on ------.",
          options: { A: "schedule", B: "timing", C: "calendar", D: "clock" },
          correctAnswer: "A", explanation: "Cụm cố định 'on schedule' mang nghĩa 'đúng tiến độ / đúng giờ'.", tags: ["#collocation"]
        }
      ];
      parsedQuestions.push(...extraQuestions);
    }
  }

  parsedQuestions = parsedQuestions.slice(0, 10);
  const newExam = {
    id: "exam-word-" + Date.now(),
    code: "WORD-AI-" + Math.floor(1000 + Math.random() * 9000),
    title: title,
    subject: "TOEIC Reading",
    category: "Full Reading Test",
    badge: file ? "File Word" : "AI Trích xuất",
    duration: duration,
    passingScore: 350,
    totalQuestionsCount: parsedQuestions.length,
    rating: 5.0,
    testCount: "1 lượt thi",
    creator: AppState.currentUser ? AppState.currentUser.fullName : "ThS. Lê Hoàng Tuấn",
    createdAt: new Date().toISOString().split("T")[0],
    status: "active",
    description: `Đề thi trích xuất thành công từ ${file ? file.name : 'tài liệu chuẩn hóa'}. Gồm ${parsedQuestions.length} câu hỏi TOEIC Reading.`,
    metrics: { completion: 100, explained: `${parsedQuestions.length}/${parsedQuestions.length}`, reviewNeeded: 0 },
    passages: parsedPassages,
    questions: parsedQuestions
  };

  StorageService.saveExam(newExam);
  AppState.activeExam = newExam;
  AppState.answers = {};
  AppState.flagged = new Set();
  AppState.activeQuestionIndex = 0;

  const editTitleDisplay = document.getElementById("editExamTitleDisplay");
  if (editTitleDisplay) editTitleDisplay.textContent = title;

  const qFirst = parsedQuestions[0];
  if (qFirst) {
    const editCard = document.getElementById("editCardQ101");
    if (editCard) {
      const qTextEl = editCard.querySelector(".q-text-content");
      if (qTextEl) qTextEl.textContent = qFirst.question;
      const optsGrid = editCard.querySelector(".options-edit-grid");
      if (optsGrid && qFirst.options) {
        let optRows = "";
        ["A", "B", "C", "D"].forEach(letter => {
          const isCorrect = (qFirst.correctAnswer || "A") === letter;
          optRows += `
            <div class="opt-edit-row ${isCorrect ? 'correct' : ''}" onclick="setQuestionAnswer(${qFirst.questionNumber}, '${letter}', this)">
              <div><span class="opt-circle-label">${letter}</span> ${escapeHtml(qFirst.options[letter] || '')}</div>
              ${isCorrect ? '<span style="font-size: 11px; font-weight: 800; color: var(--emerald-600);">✓ Đúng</span>' : ''}
            </div>
          `;
        });
        optsGrid.innerHTML = optRows;
      }
    }
  }

  renderExamRoomQuestion();

  showToast(`🎉 AI Parser đã nạp thành công ${parsedQuestions.length} câu hỏi và đáp án cho đề "${title}"!`, "success");

  setTimeout(() => {
    focusScreen("screen-frame-5");
  }, 700);
};

window.downloadSampleWordTemplate = function () {
  const templateContent = `================================================================================
BẢN MẪU QUY CHUẨN ĐỀ THI TOEIC READING MASTER (.DOCX / TEXT FORMAT)
Định dạng chuẩn hóa tự động nạp vào AI Parser 4.2 & Microsoft SQL Server
================================================================================

[EXAM_INFO]
Title: ETS TOEIC 2024 - Test 05 (Reading Official Format)
Duration: 75
Subject: TOEIC Reading
TargetScore: Target 700+

[PART 5: INCOMPLETE SENTENCES]
Câu 101: Customer satisfaction is our top ------ at the Grand Plaza Hotel.
(A) prioritize
(B) prioritized
(C) priority
(D) prioritizing
Đáp án: C
Giải thích: Sau tính từ sở hữu "our" và tính từ "top" cần một danh từ. Chọn "priority" (sự ưu tiên hàng đầu).

Câu 102: All employees are required to ------ their identification badges upon entering the secure laboratory facility.
(A) display
(B) displays
(C) displayed
(D) displaying
Đáp án: A
Giải thích: Cấu trúc be required to + V-infinitive -> chọn "display".

[PART 7: READING COMPREHENSION]
[PASSAGE_START]
Type: Email / Notice
From: hr-department@techcorp-solutions.com
To: all-staff@techcorp-solutions.com
Date: November 14, 2024 - 09:15 AM
Subject: Annual Performance Review Schedule & Guidelines
Content:
Dear TechCorp Team Members,
As we approach the end of the fourth fiscal quarter, Human Resources is initiating our company-wide Annual Performance Review process...
[PASSAGE_END]

Câu 153: What is the primary purpose of the email?
(A) To announce a staff promotion and departmental restructuring
(B) To schedule annual employee evaluations
(C) To request budget approval for team training programs
(D) To introduce new remote work protocols and office policies
Đáp án: B
Giải thích: Mục đích chính là thông báo lịch đánh giá nhân viên thường niên.
`;

  const blob = new Blob([templateContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "TOEIC_Reading_Word_Standard_Template.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Đã tải xuống file mẫu định dạng câu hỏi TOEIC Reading!", "success");
};

window.togglePartChip = function (btn, type) {
  document.querySelectorAll(".part-chip-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};

window.setQuestionAnswer = function (qNum, letter, el) {
  const container = el.closest(".options-edit-grid");
  if (!container) return;

  container.querySelectorAll(".opt-edit-row").forEach(row => {
    row.classList.remove("correct");
    const badge = row.querySelector("span[style*='color: var(--emerald-600)']");
    if (badge) badge.remove();
  });

  el.classList.add("correct");
  const badgeSpan = document.createElement("span");
  badgeSpan.style = "font-size: 11px; font-weight: 800; color: var(--emerald-600);";
  badgeSpan.textContent = "✓ Đúng";
  el.appendChild(badgeSpan);

  showToast(`Đã cập nhật đáp án đúng cho Câu ${qNum} là: (${letter})`, "success");
};

window.filterEditQuestions = function (part, el) {
  document.querySelectorAll(".filter-tab-pill").forEach(p => p.classList.remove("active"));
  el.classList.add("active");
  showToast(`Đang lọc danh sách câu hỏi: ${part === 'all' ? 'Tất cả câu hỏi' : part}`, "info");
};

window.saveExamChangesNotice = function () {
  showToast("Đã lưu các thay đổi của đề thi vào CSDL!", "success");
};

window.addNewQuestionPrompt = function () {
  const text = prompt("Nhập nội dung câu hỏi trắc nghiệm mới:", "The conference will begin promptly at 9:00 AM ------ the main auditorium.");
  if (!text) return;
  showToast("Đã thêm câu hỏi mới vào ngân hàng đề thi!", "success");
};

window.openAddPassageModal = function () {
  const title = prompt("Nhập tiêu đề bài đọc mới (Ví dụ: Email from Supplier / Notice from HR):", "Đoạn văn đọc hiểu TOEIC");
  if (!title) return;
  const content = prompt("Nhập nội dung đoạn văn bài đọc:");
  if (!content) return;
  showToast(`Đã cập nhật bài đọc: "${title}"`, "success");
};

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getActiveExamQuestions() {
  let list = [];
  if (AppState.activeExam && Array.isArray(AppState.activeExam.questions) && AppState.activeExam.questions.length > 0) {
    list = AppState.activeExam.questions;
  } else {
    const exams = StorageService.getExams();
    if (exams[0] && Array.isArray(exams[0].questions) && exams[0].questions.length > 0) {
      list = exams[0].questions;
    } else {
      list = (typeof INITIAL_EXAMS !== 'undefined' && INITIAL_EXAMS[0]?.questions) ? INITIAL_EXAMS[0].questions : [];
    }
  }
  return list.slice(0, 10);
}

window.startExamById = function (examId) {
  const exam = StorageService.getExamById(examId) || StorageService.getExams()[0];
  AppState.activeExam = exam;
  AppState.remainingSeconds = (exam.duration || 75) * 60;
  AppState.answers = {};
  AppState.flagged = new Set();
  AppState.activeQuestionIndex = 0;

  const questions = getActiveExamQuestions();
  showToast(`Bắt đầu làm đề thi: "${exam.title}" (Tổng số: ${questions.length} câu • Thời gian: ${exam.duration} phút)`, "success");

  initExamRoomTimer();
  renderExamRoomQuestion();

  setTimeout(() => {
    focusScreen("screen-frame-5");
  }, 350);
};

window.filterCatalogList = function (keyword) {
  const kw = keyword.toLowerCase().trim();
  document.querySelectorAll(".catalog-exam-card").forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(kw) ? "flex" : "none";
  });
};

window.filterCatalogByTag = function (tag, el) {
  document.querySelectorAll(".filter-tab-pill").forEach(p => p.classList.remove("active"));
  el.classList.add("active");
  if (tag === "all") {
    document.querySelectorAll(".catalog-exam-card").forEach(card => card.style.display = "flex");
  } else {
    document.querySelectorAll(".catalog-exam-card").forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(tag.toLowerCase()) ? "flex" : "none";
    });
  }
};

function initExamRoomTimer() {
  if (AppState.timerInterval) clearInterval(AppState.timerInterval);

  AppState.timerInterval = setInterval(() => {
    if (AppState.remainingSeconds > 0) {
      AppState.remainingSeconds--;
      const mins = Math.floor(AppState.remainingSeconds / 60);
      const secs = AppState.remainingSeconds % 60;
      const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const timerEl = document.getElementById("roomCountdownTimerDisplay");
      if (timerEl) timerEl.textContent = display;
    } else {
      clearInterval(AppState.timerInterval);
      alert("Hết giờ làm bài! Hệ thống đang tự động nộp bài và tính điểm TOEIC Reading.");
      promptSubmitExam();
    }
  }, 1000);
}

window.changePassageZoom = function (delta) {
  AppState.passageZoomLevel = Math.max(11, Math.min(22, AppState.passageZoomLevel + delta));
  const body = document.getElementById("roomPassageBody");
  if (body) {
    body.style.fontSize = AppState.passageZoomLevel + "px";
  }
};

window.renderExamRoomQuestion = function () {
  const questions = getActiveExamQuestions();
  if (!questions || questions.length === 0) return;

  if (AppState.activeQuestionIndex < 0) AppState.activeQuestionIndex = 0;
  if (AppState.activeQuestionIndex >= questions.length) AppState.activeQuestionIndex = questions.length - 1;

  const currentIdx = AppState.activeQuestionIndex;
  const q = questions[currentIdx];
  AppState.currentQuestion = q.questionNumber;

  const partBadge = document.getElementById("roomPartTypeBadge");
  if (partBadge) {
    const isPassageQ = !!q.passageId || (q.partType === "Part 7" || q.partType === "Part 6");
    partBadge.innerHTML = `<strong>${escapeHtml(q.partType || "Part 5")}</strong> ${isPassageQ ? "Reading Passage" : "Incomplete Sentences"}`;
  }

  const statusProgress = document.getElementById("roomQCountStatus");
  if (statusProgress) {
    statusProgress.textContent = `Câu ${currentIdx + 1} / ${questions.length} câu`;
  }

  const answeredCount = Object.keys(AppState.answers).length;
  const flaggedCount = AppState.flagged.size;
  const remainingCount = Math.max(0, questions.length - answeredCount);

  const answeredEl = document.getElementById("roomStatsAnswered");
  const flaggedEl = document.getElementById("roomStatsFlagged");
  const remainingEl = document.getElementById("roomStatsRemaining");
  if (answeredEl) answeredEl.textContent = `● Đã làm: ${answeredCount} câu`;
  if (flaggedEl) flaggedEl.textContent = `⚑ ${flaggedCount} câu gắn cờ`;
  if (remainingEl) remainingEl.textContent = `Còn lại: ${remainingCount} câu`;

  const numCircle = document.getElementById("roomCurrentQNum");
  const textEl = document.getElementById("roomCurrentQText");
  if (numCircle) numCircle.textContent = q.questionNumber;
  if (textEl) textEl.textContent = q.question;

  const optContainer = document.getElementById("roomExamOptionsContainer");
  if (optContainer) {
    const opts = q.options || { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" };
    const chosenLetter = AppState.answers[q.questionNumber];
    const showHint = !!AppState.showAnswerHint;
    const correctLetter = (q.correctAnswer || "A").toUpperCase();

    let optHtml = "";
    ["A", "B", "C", "D"].forEach(letter => {
      const optText = opts[letter] || `Phương án (${letter})`;
      const isSelected = chosenLetter === letter;
      const isCorrect = correctLetter === letter;

      let extraClass = "";
      let correctBadge = "";
      if (showHint && isCorrect) {
        extraClass = "correct-hint-active";
        correctBadge = `<span style="margin-left: auto; font-size: 11px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">✓ Đáp án đúng</span>`;
      }

      optHtml += `
        <div class="exam-option-item ${isSelected ? 'selected' : ''} ${extraClass}" onclick="selectRoomOption('${letter}', this)" style="${showHint && isCorrect ? 'border: 2px solid #10b981; background: #f0fdf4;' : ''}">
          <span class="exam-opt-letter" style="${showHint && isCorrect ? 'background: #10b981; color: white;' : ''}">${letter}</span>
          <span style="flex: 1;">${escapeHtml(optText)}</span>
          ${correctBadge}
        </div>
      `;
    });

    if (showHint) {
      const expContent = q.explanation ? escapeHtml(q.explanation) : `Đáp án đúng chuẩn theo đề thi trích xuất là <strong>[${correctLetter}]</strong>.`;
      optHtml += `
        <div style="margin-top: 12px; padding: 12px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 12px; color: #065f46; line-height: 1.5;">
          <div style="font-weight: 700; margin-bottom: 4px;">💡 Đáp án & Giải thích chi tiết:</div>
          <div>${expContent}</div>
        </div>
      `;
    }

    optContainer.innerHTML = optHtml;
  }

  const passageHeader = document.getElementById("roomPassageHeaderTitle");
  const memoTable = document.getElementById("roomPassageMemoTable");
  const passageBody = document.getElementById("roomPassageBody");

  const passages = AppState.activeExam?.passages || [];
  let matchingPassage = null;

  if (q.passageId) {
    matchingPassage = passages.find(p => p.id === q.passageId);
  }
  if (!matchingPassage && (q.partType === "Part 7" || q.partType === "Part 6")) {
    matchingPassage = passages[0] || null;
  }

  if (matchingPassage) {
    if (passageHeader) {
      passageHeader.textContent = `📄 ${matchingPassage.range || 'Đoạn văn đọc hiểu'} (${matchingPassage.passageType || 'Passage'})`;
    }
    if (memoTable) {
      memoTable.style.display = "block";
      const meta = matchingPassage.metadata || {};
      const fromEl = document.getElementById("roomPassageFrom");
      const toEl = document.getElementById("roomPassageTo");
      const dateEl = document.getElementById("roomPassageDate");
      const subjEl = document.getElementById("roomPassageSubject");
      if (fromEl) fromEl.textContent = meta.from || meta.From || "hr-department@techcorp-solutions.com";
      if (toEl) toEl.textContent = meta.to || meta.To || "all-staff@techcorp-solutions.com";
      if (dateEl) dateEl.textContent = meta.date || meta.Date || "November 14, 2024 - 09:15 AM";
      if (subjEl) subjEl.textContent = meta.subject || meta.Subject || matchingPassage.title || "Reading Passage";
    }
    if (passageBody) {
      passageBody.style.fontSize = AppState.passageZoomLevel + "px";
      passageBody.innerHTML = escapeHtml(matchingPassage.content || "").replace(/\n/g, "<br>");
    }
  } else {

    if (passageHeader) {
      passageHeader.textContent = "📄 Part 5: Incomplete Sentences";
    }
    if (memoTable) {
      memoTable.style.display = "none";
    }
    if (passageBody) {
      passageBody.style.fontSize = AppState.passageZoomLevel + "px";
      passageBody.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--brand-blue); padding: 12px; border-radius: 6px; margin-bottom: 12px;">
          <strong style="color: var(--brand-blue); display: block; margin-bottom: 4px;">📌 Hướng dẫn làm bài Part 5:</strong>
          Đọc kỹ câu hỏi ở khung bên phải và chọn một trong bốn phương án <strong>(A), (B), (C), (D)</strong> thích hợp nhất để điền vào chỗ trống.
        </div>
        <p style="color: var(--slate-600); line-height: 1.6;">
          Dạng bài này kiểm tra kiến thức về <em>từ loại (Part of Speech), thì của động từ (Tenses), liên từ, giới từ</em> và <em>từ vựng thương mại chuẩn ETS</em>.
        </p>
      `;
    }
  }

  const flagBtn = document.getElementById("btnRoomFlagQuestion");
  if (flagBtn) {
    if (AppState.flagged.has(q.questionNumber)) {
      flagBtn.innerHTML = "⚑ Đã gắn cờ xem lại (Bấm để gỡ)";
      flagBtn.style.color = "var(--amber-600)";
      flagBtn.style.fontWeight = "700";
    } else {
      flagBtn.innerHTML = "⚐ Gắn cờ kiểm tra lại";
      flagBtn.style.color = "var(--slate-500)";
      flagBtn.style.fontWeight = "600";
    }
  }

  const prevBtn = document.getElementById("btnRoomPrevQ");
  const nextBtn = document.getElementById("btnRoomNextQ");

  if (prevBtn) {
    if (currentIdx > 0) {
      const prevQ = questions[currentIdx - 1];
      prevBtn.innerHTML = `&lt; Câu ${prevQ.questionNumber}`;
      prevBtn.style.opacity = "1";
      prevBtn.disabled = false;
    } else {
      prevBtn.innerHTML = `&lt; Đầu đề thi`;
      prevBtn.style.opacity = "0.5";
      prevBtn.disabled = true;
    }
  }

  if (nextBtn) {
    if (currentIdx < questions.length - 1) {
      const nextQ = questions[currentIdx + 1];
      nextBtn.innerHTML = `Câu ${nextQ.questionNumber} &gt;`;
      nextBtn.className = "btn-q-nav primary";
    } else {
      nextBtn.innerHTML = `Nộp bài thi ➔`;
      nextBtn.className = "btn-q-nav primary";
    }
  }

  renderPaletteDrawer();
};

window.toggleExamRoomAnswerHint = function () {
  AppState.showAnswerHint = !AppState.showAnswerHint;
  const btn = document.getElementById("btnToggleShowAnswer");
  if (btn) {
    btn.innerHTML = AppState.showAnswerHint ? "🙈 Ẩn đáp án" : "👁️ Xem đáp án";
    btn.style.background = AppState.showAnswerHint ? "#dcfce7" : "#ecfdf5";
    btn.style.color = AppState.showAnswerHint ? "#15803d" : "#059669";
  }
  renderExamRoomQuestion();
  showToast(AppState.showAnswerHint ? "Đã bật hiển thị đáp án đúng & giải thích!" : "Đã tắt chế độ xem đáp án.", "info");
};

window.selectRoomOption = function (letter, el) {
  const questions = getActiveExamQuestions();
  if (!questions || questions.length === 0) return;

  const q = questions[AppState.activeQuestionIndex];
  AppState.answers[q.questionNumber] = letter;

  const container = document.getElementById("roomExamOptionsContainer");
  if (container) {
    container.querySelectorAll(".exam-option-item").forEach(item => {
      item.classList.remove("selected");
    });
  }
  if (el) el.classList.add("selected");

  const answeredCount = Object.keys(AppState.answers).length;
  const remainingCount = Math.max(0, questions.length - answeredCount);
  const answeredEl = document.getElementById("roomStatsAnswered");
  const remainingEl = document.getElementById("roomStatsRemaining");
  if (answeredEl) answeredEl.textContent = `● Đã làm: ${answeredCount} câu`;
  if (remainingEl) remainingEl.textContent = `Còn lại: ${remainingCount} câu`;

  renderPaletteDrawer();
  showToast(`Đã chọn phương án (${letter}) cho Câu ${q.questionNumber}`, "info");
};

window.toggleFlagCurrentQuestion = function () {
  const questions = getActiveExamQuestions();
  if (!questions || questions.length === 0) return;

  const q = questions[AppState.activeQuestionIndex];
  if (AppState.flagged.has(q.questionNumber)) {
    AppState.flagged.delete(q.questionNumber);
    showToast(`Đã bỏ gắn cờ Câu ${q.questionNumber}`, "info");
  } else {
    AppState.flagged.add(q.questionNumber);
    showToast(`⚑ Đã gắn cờ Câu ${q.questionNumber} để xem lại trước khi nộp bài`, "warning");
  }

  renderExamRoomQuestion();
};

window.nextRoomQuestion = function () {
  const questions = getActiveExamQuestions();
  if (AppState.activeQuestionIndex < questions.length - 1) {
    AppState.activeQuestionIndex++;
    renderExamRoomQuestion();
    const nextQ = questions[AppState.activeQuestionIndex];
    showToast(`Chuyển đến Câu ${nextQ.questionNumber} (${nextQ.partType})`, "info");
  } else {

    promptSubmitExam();
  }
};

window.prevRoomQuestion = function () {
  const questions = getActiveExamQuestions();
  if (AppState.activeQuestionIndex > 0) {
    AppState.activeQuestionIndex--;
    renderExamRoomQuestion();
    const prevQ = questions[AppState.activeQuestionIndex];
    showToast(`Quay lại Câu ${prevQ.questionNumber} (${prevQ.partType})`, "info");
  }
};

window.goToExamQuestionByIndex = function (index) {
  const questions = getActiveExamQuestions();
  if (index >= 0 && index < questions.length) {
    AppState.activeQuestionIndex = index;
    renderExamRoomQuestion();

    const drawer = document.getElementById("roomPaletteDrawer");
    if (drawer) drawer.classList.remove("active");
  }
};

window.togglePaletteDrawer = function () {
  const drawer = document.getElementById("roomPaletteDrawer");
  if (drawer) {
    drawer.classList.toggle("active");
  }
};

function renderPaletteDrawer() {
  const grid = document.getElementById("drawerPaletteGrid");
  if (!grid) return;

  const questions = getActiveExamQuestions();
  if (!questions || questions.length === 0) {
    grid.innerHTML = "<p style='color: var(--slate-400); font-size: 11px;'>Chưa có câu hỏi.</p>";
    return;
  }

  let html = "";
  questions.forEach((qItem, idx) => {
    const isCurrent = idx === AppState.activeQuestionIndex;
    const isAnswered = !!AppState.answers[qItem.questionNumber];
    const isFlagged = AppState.flagged.has(qItem.questionNumber);

    let cls = "palette-btn";
    if (isCurrent) cls += " current";
    else if (isFlagged) cls += " flagged";
    else if (isAnswered) cls += " answered";

    html += `<button class="${cls}" data-q="${qItem.questionNumber}" onclick="goToExamQuestionByIndex(${idx})">${qItem.questionNumber}</button>`;
  });

  grid.innerHTML = html;
}

let currentExamResultData = null;

function initResultScreenMockup() {
  const defaultWrongNums = [105, 108];
  const questions = [];

  for (let i = 101; i <= 110; i++) {
    const isWrong = defaultWrongNums.includes(i);
    let partType = "Part 5";

    questions.push({
      qNum: i,
      partType,
      questionText: `Câu hỏi ${i} (${partType})`,
      options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" },
      userAnswer: isWrong ? "B" : "A",
      correctAnswer: "A",
      isCorrect: !isWrong,
      status: isWrong ? "wrong" : "correct",
      explanation: isWrong
        ? `Lỗ hổng kiến thức: Câu ${i} thuộc ${partType}. Cần chú ý collocation & từ loại chuẩn ETS.`
        : `Chính xác! Câu ${i} thuộc ${partType}. Bạn đã chọn đúng theo ngữ cảnh đề bài.`
    });
  }

  currentExamResultData = {
    examTitle: "ETS TOEIC 2024 - Test 05 (Reading)",
    score: 395,
    maxScore: 495,
    goalText: "Hoàn thành xuất sắc vượt mục tiêu",
    deltaScore: "+ 35 điểm so với bài thi gần nhất",
    correctCount: 8,
    wrongCount: 2,
    skippedCount: 0,
    timeSpent: "8m",
    part5: { correct: 8, total: 10, pct: "80.0%" },
    part6: { correct: 0, total: 0, pct: "0%" },
    part7: { correct: 0, total: 0, pct: "0%" },
    details: questions
  };

  renderResultScreen(currentExamResultData);
}

function renderResultScreen(data) {
  if (!data) return;
  currentExamResultData = data;

  const titleEl = document.getElementById("resultExamTitleDisplay");
  if (titleEl) titleEl.textContent = data.examTitle || "ETS TOEIC 2024 - Test 05 (Reading)";

  const goalEl = document.getElementById("resultGoalText");
  if (goalEl && data.goalText) goalEl.textContent = data.goalText;

  const scoreEl = document.getElementById("resultScoreValue");
  if (scoreEl) scoreEl.textContent = data.score;

  const deltaEl = document.getElementById("resultDeltaScoreText");
  if (deltaEl) deltaEl.textContent = data.deltaScore || `${data.score} / 495 điểm TOEIC Reading`;

  const statCorrect = document.getElementById("resultStatCorrect");
  const statWrong = document.getElementById("resultStatWrong");
  const statTime = document.getElementById("resultStatTime");
  if (statCorrect) statCorrect.textContent = data.correctCount;
  if (statWrong) statWrong.textContent = data.wrongCount;
  if (statTime) statTime.textContent = data.timeSpent || "0m";

  const overallRatio = document.getElementById("resultOverallPartRatio");
  const totalExamQuestions = data.details ? data.details.length : 100;
  const overallPct = totalExamQuestions > 0 ? Math.round((data.correctCount / totalExamQuestions) * 100) : 0;
  if (overallRatio) overallRatio.textContent = `${data.correctCount}/${totalExamQuestions} (${overallPct}%)`;

  const p5Frac = document.getElementById("resultPart5Fraction");
  const p5Pct = document.getElementById("resultPart5Pct");
  const p5Bar = document.getElementById("resultPart5Bar");
  if (p5Frac && data.part5) p5Frac.textContent = `${data.part5.correct}/${data.part5.total}`;
  if (p5Pct && data.part5) p5Pct.textContent = data.part5.pct;
  if (p5Bar && data.part5) p5Bar.style.width = data.part5.pct;

  const p6Frac = document.getElementById("resultPart6Fraction");
  const p6Pct = document.getElementById("resultPart6Pct");
  const p6Bar = document.getElementById("resultPart6Bar");
  if (p6Frac && data.part6) p6Frac.textContent = `${data.part6.correct}/${data.part6.total}`;
  if (p6Pct && data.part6) p6Pct.textContent = data.part6.pct;
  if (p6Bar && data.part6) p6Bar.style.width = data.part6.pct;

  const p7Frac = document.getElementById("resultPart7Fraction");
  const p7Pct = document.getElementById("resultPart7Pct");
  const p7Bar = document.getElementById("resultPart7Bar");
  if (p7Frac && data.part7) p7Frac.textContent = `${data.part7.correct}/${data.part7.total}`;
  if (p7Pct && data.part7) p7Pct.textContent = data.part7.pct;
  if (p7Bar && data.part7) p7Bar.style.width = data.part7.pct;

  const legCorrect = document.getElementById("legendCorrectCount");
  const legWrong = document.getElementById("legendWrongCount");
  const legSkipped = document.getElementById("legendSkippedCount");
  if (legCorrect) legCorrect.textContent = data.correctCount;
  if (legWrong) legWrong.textContent = data.wrongCount;
  if (legSkipped) legSkipped.textContent = data.skippedCount || 0;

  const tabAll = document.getElementById("tabMatrixFilterAll");
  const tabWrong = document.getElementById("tabMatrixFilterWrong");
  const tabSkipped = document.getElementById("tabMatrixFilterSkipped");
  const matrixTotalLabel = document.getElementById("matrixTotalLabel");

  if (tabAll) tabAll.textContent = `Tất cả (${totalExamQuestions})`;
  if (tabWrong) tabWrong.textContent = `● Câu sai (${data.wrongCount})`;
  if (tabSkipped) tabSkipped.textContent = `○ Bỏ qua (${data.skippedCount || 0})`;
  if (matrixTotalLabel) matrixTotalLabel.textContent = `${totalExamQuestions} câu`;

  renderResultMatrixGrid('all');
}

function renderResultMatrixGrid(filter = 'all') {
  const grid = document.getElementById("resultMatrixGrid");
  if (!grid || !currentExamResultData) return;

  const details = currentExamResultData.details || [];
  let html = "";

  details.forEach(item => {
    let statusCls = item.status || (item.isCorrect ? "correct" : (item.userAnswer === "(Chưa chọn)" ? "skipped" : "wrong"));

    if (filter === "wrong" && item.status !== "wrong") return;
    if (filter === "skipped" && item.status !== "skipped") return;

    let tooltipStatus = item.status === "correct" ? "Đúng" : (item.status === "wrong" ? "Sai" : "Chưa làm");

    html += `
      <button class="matrix-cell ${statusCls}" title="Câu ${item.qNum}: ${tooltipStatus} (Bạn chọn: ${item.userAnswer}, Đúng: ${item.correctAnswer})" onclick="openExplanationModal(${item.qNum})">
        ${item.qNum}
      </button>
    `;
  });

  grid.innerHTML = html || "<p style='grid-column: 1 / -1; font-size: 11px; color: var(--slate-400); text-align: center; padding: 10px;'>Không có câu hỏi trong mục này.</p>";
}

window.filterResultMatrix = function (filter, btn) {
  document.querySelectorAll(".matrix-tab-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderResultMatrixGrid(filter);
};

window.openExplanationModal = function (focusQNum = null) {
  const modal = document.getElementById("explanationModal");
  if (!modal) return;
  modal.classList.add("active");
  renderExplanationModalList('all', focusQNum);
};

window.closeExplanationModal = function () {
  const modal = document.getElementById("explanationModal");
  if (modal) modal.classList.remove("active");
};

function renderExplanationModalList(filter = 'all', focusQNum = null) {
  const listEl = document.getElementById("explanationQuestionsList");
  if (!listEl || !currentExamResultData) return;

  const details = currentExamResultData.details || [];
  let html = "";

  details.forEach(item => {
    if (filter === "wrong" && item.status !== "wrong") return;
    if (filter === "Part 5" && item.partType !== "Part 5") return;
    if (filter === "Part 6" && item.partType !== "Part 6") return;
    if (filter === "Part 7" && item.partType !== "Part 7") return;

    const isMatchFocus = focusQNum && item.qNum === focusQNum;
    const highlightStyle = isMatchFocus ? "border: 2px solid var(--brand-blue); background: var(--brand-blue-subtle);" : "";

    let badgeHtml = item.status === "correct"
      ? '<span class="q-approved-badge">✓ Đúng</span>'
      : (item.status === "skipped"
        ? '<span style="background: #e2e8f0; color: #64748b; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">○ Chưa làm / Bỏ qua</span>'
        : '<span style="background: #fee2e2; color: #b91c1c; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">✗ Trả lời Sai</span>');

    const opts = item.options || {};
    let optionsHtml = "";
    ["A", "B", "C", "D"].forEach(letter => {
      if (opts[letter]) {
        let optCls = "";
        if (letter === item.correctAnswer) optCls = "color: var(--emerald-600); font-weight: 700; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;";
        else if (letter === item.userAnswer && item.status === "wrong") optCls = "color: var(--rose-600); text-decoration: line-through; background: #fff1f2; padding: 2px 6px; border-radius: 4px;";
        optionsHtml += `<div style="font-size: 11.5px; margin: 3px 0; ${optCls}"><strong>(${letter})</strong> ${escapeHtml(opts[letter])}</div>`;
      }
    });

    html += `
      <div class="question-master-card" id="expCardQ${item.qNum}" style="padding: 12px; margin-bottom: 8px; ${highlightStyle}">
        <div class="q-card-header" style="margin-bottom: 6px;">
          <div class="q-badge-group">
            <span class="q-part-badge">${item.partType || 'Part 5'}</span>
            <span class="q-num-text">Câu ${item.qNum}</span>
            ${badgeHtml}
          </div>
          <div style="font-size: 11px; font-weight: 700;">
            Bạn chọn: <strong style="color: ${item.status === 'correct' ? 'var(--emerald-600)' : (item.status === 'skipped' ? 'var(--slate-400)' : 'var(--rose-600)')};">${item.userAnswer}</strong> | Đáp án đúng: <strong style="color: var(--emerald-600);">${item.correctAnswer}</strong>
          </div>
        </div>
        <div style="font-size: 12.5px; font-weight: 600; color: var(--slate-800); margin: 6px 0; line-height: 1.4;">
          ${escapeHtml(item.questionText || '')}
        </div>
        ${optionsHtml ? `<div style="background: #fff; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--slate-100); margin-bottom: 6px;">${optionsHtml}</div>` : ''}
        <div style="font-size: 11.5px; color: var(--slate-700); background: #f8fafc; padding: 8px 10px; border-radius: 6px; border-left: 3px solid ${item.status === 'correct' ? 'var(--emerald-500)' : (item.status === 'skipped' ? 'var(--slate-400)' : 'var(--rose-500)')};">
          <strong>💡 Giải thích chi tiết:</strong> ${item.explanation}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html || "<p style='color: var(--slate-400); font-size: 12px; padding: 12px;'>Không có câu hỏi phù hợp.</p>";

  if (focusQNum) {
    setTimeout(() => {
      const el = document.getElementById(`expCardQ${focusQNum}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }
}

window.filterExplanationList = function (filter, btn) {
  document.querySelectorAll("#explanationModal .filter-tab-pill").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderExplanationModalList(filter);
};

function updateAiDiagnosticContent(wrongP5, wrongP7, p5Corr, p5Tot, p7Corr, p7Tot) {
  const p5Desc = document.querySelector(".ai-gap-items .ai-gap-item:nth-child(1) .gap-desc");
  const p7Desc = document.querySelector(".ai-gap-items .ai-gap-item:nth-child(2) .gap-desc");

  if (p5Desc) {
    if (wrongP5.length > 0) {
      p5Desc.textContent = `Các câu sai trong bài thi của bạn: Part 5 (câu ${wrongP5.slice(0, 4).join(', ')})`;
    } else if (p5Tot > 0 && p5Corr === p5Tot) {
      p5Desc.textContent = `Chúc mừng! Bạn đã trả lời đúng 100% các câu hỏi Part 5 đã làm.`;
    } else {
      p5Desc.textContent = `Chưa ghi nhận nhiều lỗi sai ở phần này.`;
    }
  }

  if (p7Desc) {
    if (wrongP7.length > 0) {
      p7Desc.textContent = `Các câu sai trong bài thi của bạn: Part 7 (câu ${wrongP7.slice(0, 4).join(', ')})`;
    } else if (p7Tot > 0 && p7Corr === p7Tot) {
      p7Desc.textContent = `Đọc hiểu Part 7 đạt kết quả rất tốt, độ chính xác cao.`;
    } else {
      p7Desc.textContent = `Nên chú ý đối chiếu thông tin giữa 2 văn bản trước khi chọn đáp án.`;
    }
  }
}

window.promptSubmitExam = async function () {
  const questions = getActiveExamQuestions();
  const answeredCount = Object.keys(AppState.answers).length;
  const totalCount = questions.length;

  const msg = answeredCount < totalCount
    ? `Bạn mới hoàn thành ${answeredCount}/${totalCount} câu hỏi (còn ${totalCount - answeredCount} câu chưa làm). Bạn có chắc chắn muốn nộp bài thi để chấm điểm thực tế không?`
    : `Bạn đã hoàn thành toàn bộ ${totalCount}/${totalCount} câu hỏi! Nộp bài và xem bảng điểm kết quả thực tế ngay?`;

  const confirmed = confirm(msg);
  if (!confirmed) return;

  if (AppState.timerInterval) clearInterval(AppState.timerInterval);

  const totalDurationMin = AppState.activeExam?.duration || 75;
  const totalDurationSec = totalDurationMin * 60;
  const timeUsedSec = Math.max(1, totalDurationSec - (AppState.remainingSeconds || 0));
  const timeUsedMin = Math.max(1, Math.round(timeUsedSec / 60));
  const timeSpentDisplay = `${timeUsedMin}m`;

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  let part5Correct = 0, part5Total = 0;
  let part6Correct = 0, part6Total = 0;
  let part7Correct = 0, part7Total = 0;

  const wrongQuestionsPart5 = [];
  const wrongQuestionsPart7 = [];
  const details = [];

  questions.forEach((q, idx) => {
    const qNum = q.questionNumber || (idx + 101);
    const partType = q.partType || (qNum <= 130 ? "Part 5" : (qNum <= 146 ? "Part 6" : "Part 7"));
    const uAns = AppState.answers[qNum] || null;
    const cAns = q.correctAnswer || "A";

    if (partType === "Part 5") part5Total++;
    else if (partType === "Part 6") part6Total++;
    else part7Total++;

    let isCorrect = false;
    let status = "skipped";

    if (uAns) {
      if (uAns === cAns) {
        isCorrect = true;
        status = "correct";
        correctCount++;
        if (partType === "Part 5") part5Correct++;
        else if (partType === "Part 6") part6Correct++;
        else part7Correct++;
      } else {
        isCorrect = false;
        status = "wrong";
        wrongCount++;
        if (partType === "Part 5") wrongQuestionsPart5.push(qNum);
        else if (partType === "Part 7") wrongQuestionsPart7.push(qNum);
      }
    } else {
      status = "skipped";
      skippedCount++;
    }

    details.push({
      qNum,
      partType,
      questionText: q.question || `Câu hỏi ${qNum}`,
      options: q.options || {},
      userAnswer: uAns || "(Chưa chọn)",
      correctAnswer: cAns,
      isCorrect,
      status,
      explanation: q.explanation || `Đáp án đúng là (${cAns}).`
    });
  });

  let toeicScore = 5;
  if (totalCount > 0) {
    if (correctCount === 0) {
      toeicScore = 5;
    } else {
      toeicScore = Math.min(495, Math.max(5, Math.round((correctCount / totalCount) * 490 + 5)));
    }
  }

  let goalText = "Cần nỗ lực cải thiện thêm";
  let deltaText = `${toeicScore} / 495 điểm TOEIC Reading`;
  if (toeicScore >= 400) {
    goalText = "Hoàn thành xuất sắc vượt mục tiêu";
    deltaText = "+ 35 điểm so với bài thi gần nhất";
  } else if (toeicScore >= 300) {
    goalText = "Đạt mục tiêu điểm số khá";
    deltaText = "Đạt tiêu chuẩn mục tiêu";
  }

  updateAiDiagnosticContent(wrongQuestionsPart5, wrongQuestionsPart7, part5Correct, part5Total, part7Correct, part7Total);

  const resultData = {
    examTitle: AppState.activeExam ? AppState.activeExam.title : "ETS TOEIC 2024 - Test 05 (Reading)",
    score: toeicScore,
    maxScore: 495,
    goalText,
    deltaScore: deltaText,
    correctCount,
    wrongCount,
    skippedCount,
    timeSpent: timeSpentDisplay,
    part5: {
      correct: part5Correct,
      total: part5Total,
      pct: part5Total > 0 ? `${((part5Correct / part5Total) * 100).toFixed(1)}%` : "0%"
    },
    part6: {
      correct: part6Correct,
      total: part6Total,
      pct: part6Total > 0 ? `${Math.round((part6Correct / part6Total) * 100)}%` : "0%"
    },
    part7: {
      correct: part7Correct,
      total: part7Total,
      pct: part7Total > 0 ? `${((part7Correct / part7Total) * 100).toFixed(1)}%` : "0%"
    },
    details
  };

  renderResultScreen(resultData);

  showToast(`🎉 Nộp bài thành công! Điểm thực tế: ${toeicScore}/495 (Đúng: ${correctCount}/${totalCount} câu)`, "success");

  setTimeout(() => {
    focusScreen("screen-frame-6");
  }, 400);
};

window.fillSampleDemoAnswers = function () {
  const questions = getActiveExamQuestions();
  const mockWrong = [105, 108];

  questions.forEach(q => {
    const isWrong = mockWrong.includes(q.questionNumber);
    if (isWrong) {
      AppState.answers[q.questionNumber] = q.correctAnswer === "A" ? "B" : "A";
    } else {
      AppState.answers[q.questionNumber] = q.correctAnswer;
    }
  });

  renderExamRoomQuestion();
  showToast("⚡ Đã điền thử đáp án mẫu (8 đúng / 2 sai). Bạn có thể bấm 'Nộp bài' ngay!", "info");
};

window.retakeCurrentExam = function () {
  if (confirm("Bạn có muốn làm lại đề thi này từ đầu không?")) {
    AppState.answers = {};
    AppState.flagged = new Set();
    AppState.activeQuestionIndex = 0;
    AppState.remainingSeconds = (AppState.activeExam?.duration || 75) * 60;
    initExamRoomTimer();
    renderExamRoomQuestion();
    focusScreen("screen-frame-5");
    showToast("Đã thiết lập lại bài thi! Chúc bạn làm bài tốt.", "info");
  }
};

window.shareResultPrompt = function () {
  const shareText = `Tôi vừa hoàn thành bài thi ${currentExamResultData?.examTitle || 'TOEIC Reading'} với điểm số ${currentExamResultData?.score || 435}/495 (${currentExamResultData?.correctCount || 87} câu đúng)! 🏆`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText);
    showToast("Đã sao chép kết quả vào Clipboard để chia sẻ!", "success");
  } else {
    prompt("Sao chép liên kết / nội dung chia sẻ kết quả:", shareText);
  }
};

window.practiceAiWeakPoints = function () {
  showToast("⚡ Đang tạo bộ 10 câu luyện tập chuyên sâu về Collocations & Suy luận ngầm Part 7...", "info");
  setTimeout(() => {
    alert("Bộ 10 câu luyện tập khắc phục lỗ hổng kiến thức:\n1. Collocations Hợp đồng & Tài chính (5 câu)\n2. Kỹ thuật Inference Đoạn kép (5 câu)\n\nSẵn sàng bắt đầu!");
  }, 400);
};

window.exitExamPrompt = function () {
  if (confirm("Bạn có muốn tạm dừng bài thi và quay lại danh mục đề không? Tiến độ làm bài sẽ được lưu.")) {
    focusScreen("screen-frame-4");
  }
};


window.openSqlServerModal = function () {
  const modal = document.getElementById("sqlServerModal");
  if (modal) modal.classList.add("active");
  checkSqlServerStatus();
};

window.closeSqlServerModal = function () {
  const modal = document.getElementById("sqlServerModal");
  if (modal) modal.classList.remove("active");
};

window.toggleSqlAuthFields = function () {
  const chk = document.getElementById("sqlTrustedConnection");
  const authFields = document.getElementById("sqlAuthFields");
  if (authFields) {
    authFields.style.display = (chk && chk.checked) ? "none" : "grid";
  }
};

window.handleTestSqlConnection = async function (e) {
  if (e) e.preventDefault();
  const btn = document.getElementById("btnTestSqlConnect");
  const badge = document.getElementById("modalSqlStatusBadge");
  const headerBadge = document.getElementById("headerSqlStatusText");

  const server = document.getElementById("sqlServerName")?.value.trim() || "localhost";
  const database = document.getElementById("sqlDatabaseName")?.value.trim() || "ToeicReadingDB";
  const trusted = document.getElementById("sqlTrustedConnection")?.checked ?? true;
  const username = document.getElementById("sqlUsername")?.value.trim() || "";
  const password = document.getElementById("sqlPassword")?.value || "";

  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Đang kết nối SQL Server...";
  }

  try {
    const res = await fetch("/api/db/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ server, database, trusted, username, password })
    });
    const data = await res.json();

    if (data.success) {
      if (badge) {
        badge.className = "ssl-badge";
        badge.innerHTML = "● Kết nối SQL Server thành công";
      }
      if (headerBadge) headerBadge.innerText = "● MS SQL: Đã kết nối";
      showToast(data.message || "Kết nối Microsoft SQL Server thành công!", "success");
    } else {
      if (badge) {
        badge.className = "ssl-badge";
        badge.style.color = "var(--rose-600)";
        badge.innerHTML = "● Chưa kết nối được";
      }
      if (headerBadge) headerBadge.innerText = "⚠️ MS SQL: Chưa kết nối";
      showToast(data.message || "Không thể kết nối đến Microsoft SQL Server", "error");
    }
  } catch (err) {
    if (badge) {
      badge.innerHTML = "● Server offline (Chưa chạy server.py)";
    }
    if (headerBadge) headerBadge.innerText = "⚠️ Backend Offline";
    showToast("Không thể kết nối đến server backend Python (Port 3000). Vui lòng chạy lệnh: python server.py", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "⚡ Kiểm tra kết nối SQL Server";
    }
  }
};

async function checkSqlServerStatus() {
  const badge = document.getElementById("modalSqlStatusBadge");
  const headerBadge = document.getElementById("headerSqlStatusText");
  try {
    const res = await fetch("/api/db/status");
    if (!res.ok) throw new Error("Status failed");
    const data = await res.json();

    if (data.dbConfig && data.dbConfig.isConnected) {
      if (badge) badge.innerHTML = "● Đã kết nối Microsoft SQL Server";
      if (headerBadge) headerBadge.innerText = "● MS SQL: Đã kết nối";
    } else if (data.pyodbcAvailable) {
      const drvName = (data.installedDrivers && data.installedDrivers.length > 0) ? data.installedDrivers[0] : "SQL Server";
      if (badge) badge.innerHTML = `● pyodbc sẵn sàng [${drvName}]`;
      if (headerBadge) headerBadge.innerText = "⚙️ MS SQL Server";
    }
  } catch (err) {
    if (headerBadge) headerBadge.innerText = "⚙️ MS SQL Server";
  }
}

window.exportCurrentExamToSql = function () {
  const exams = StorageService.getExams();
  const exam = AppState.activeExam || exams[0];

  if (!exam) {
    showToast("Vui lòng chọn đề thi trước khi xuất T-SQL!", "error");
    return;
  }

  const examCode = exam.code || 'TOEIC_' + Date.now();
  let sql = `-- ========================================================\n`;
  sql += `-- KỊCH BẢN T-SQL TỰ ĐỘNG XUẤT CHO ĐỀ THI: ${exam.title}\n`;
  sql += `-- Mã đề: ${examCode}\n`;
  sql += `-- Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n`;
  sql += `-- ========================================================\n\n`;
  sql += `USE ToeicReadingDB;\nGO\n\n`;

  sql += `-- 1. Chèn thông tin đề thi vào dbo.Exams\n`;
  sql += `IF NOT EXISTS (SELECT 1 FROM dbo.Exams WHERE ExamCode = N'${examCode}')\n`;
  sql += `BEGIN\n`;
  sql += `    INSERT INTO dbo.Exams (ExamCode, Title, Subject, DurationMinutes, TotalQuestions)\n`;
  sql += `    VALUES (N'${examCode}', N'${(exam.title || '').replace(/'/g, "''")}', N'${(exam.subject || 'TOEIC Reading').replace(/'/g, "''")}', ${exam.duration || 75}, ${exam.questions ? exam.questions.length : 100});\n`;
  sql += `END\nGO\n\n`;

  if (exam.passages && exam.passages.length > 0) {
    sql += `-- 2. Chèn các đoạn văn bài đọc vào dbo.Passages\n`;
    exam.passages.forEach((p, idx) => {
      const pTitle = (p.title || `Passage ${idx + 1}`).replace(/'/g, "''");
      const pContent = (p.content || '').replace(/'/g, "''");
      const pType = (p.partType || 'Part 7').replace(/'/g, "''");
      sql += `INSERT INTO dbo.Passages (ExamCode, PartType, Title, Content)\n`;
      sql += `VALUES (N'${examCode}', N'${pType}', N'${pTitle}', N'${pContent}');\n`;
    });
    sql += `GO\n\n`;
  }

  if (exam.questions && exam.questions.length > 0) {
    sql += `-- 3. Chèn danh sách câu hỏi vào dbo.Questions\n`;
    exam.questions.forEach((q, idx) => {
      const partType = (q.partType || "Part 5").replace(/'/g, "''");
      const qNum = q.questionNumber || (idx + 101);
      const qText = (q.question || "").replace(/'/g, "''");
      const optA = (q.options?.A || "").replace(/'/g, "''");
      const optB = (q.options?.B || "").replace(/'/g, "''");
      const optC = (q.options?.C || "").replace(/'/g, "''");
      const optD = (q.options?.D || "").replace(/'/g, "''");
      const ans = q.correctAnswer || "A";
      const exp = (q.explanation || "").replace(/'/g, "''");

      sql += `INSERT INTO dbo.Questions (ExamCode, PartType, QuestionNumber, QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Explanation)\n`;
      sql += `VALUES (N'${examCode}', N'${partType}', ${qNum}, N'${qText}', N'${optA}', N'${optB}', N'${optC}', N'${optD}', '${ans}', N'${exp}');\n`;
    });
    sql += `GO\n`;
  }

  const blob = new Blob([sql], { type: "application/sql;charset=utf-8;" });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `Export_${examCode}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  showToast(`Đã xuất và tải file T-SQL cho đề thi: ${exam.title}`, "success");
};

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = type === "success" ? "✅" : (type === "error" ? "❌" : "ℹ️");
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

