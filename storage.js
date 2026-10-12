const STORAGE_KEYS = {
  EXAMS: "toeic_master_exams_v2025",
  CURRENT_USER: "toeic_master_current_user_v2025",
  SUBMISSIONS: "toeic_master_submissions_v2025"
};

const StorageService = {
  getExams() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
      if (data) {
        const exams = JSON.parse(data);
        if (Array.isArray(exams) && exams.length > 0) {
          exams.forEach(e => {
            if (Array.isArray(e.questions) && e.questions.length > 10) {
              e.questions = e.questions.slice(0, 10);
              e.totalQuestionsCount = 10;
            }
          });
          return exams;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const defaultExams = (typeof INITIAL_EXAMS !== 'undefined') ? JSON.parse(JSON.stringify(INITIAL_EXAMS)) : [];
    defaultExams.forEach(e => {
      if (Array.isArray(e.questions) && e.questions.length > 10) {
        e.questions = e.questions.slice(0, 10);
        e.totalQuestionsCount = 10;
      }
    });
    this.saveExams(defaultExams);
    return defaultExams;
  },

  saveExams(exams) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    } catch (e) {
      console.error(e);
    }
  },

  getExamById(id) {
    const exams = this.getExams();
    return exams.find(e => e.id === id) || null;
  },

  saveExam(examData) {
    if (examData && Array.isArray(examData.questions) && examData.questions.length > 10) {
      examData.questions = examData.questions.slice(0, 10);
      examData.totalQuestionsCount = 10;
    }
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === examData.id);
    if (index >= 0) {
      exams[index] = { ...exams[index], ...examData, updatedAt: new Date().toISOString() };
    } else {
      exams.unshift({
        ...examData,
        id: examData.id || "exam-" + Date.now(),
        createdAt: new Date().toISOString().split("T")[0]
      });
    }
    this.saveExams(exams);
    return examData;
  },

  deleteExam(id) {
    let exams = this.getExams();
    exams = exams.filter(e => e.id !== id);
    this.saveExams(exams);
    return exams;
  },

  addQuestionToExam(examId, question) {
    const exams = this.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam) return null;
    
    if (!exam.questions) exam.questions = [];
    if (exam.questions.length >= 10) {
      return null;
    }
    const newQ = {
      id: "q-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      ...question
    };
    exam.questions.push(newQ);
    this.saveExams(exams);
    return newQ;
  },

  updateQuestion(examId, questionId, updatedData) {
    const exams = this.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam || !exam.questions) return false;
    
    const qIndex = exam.questions.findIndex(q => q.id === questionId);
    if (qIndex >= 0) {
      exam.questions[qIndex] = { ...exam.questions[qIndex], ...updatedData };
      this.saveExams(exams);
      return true;
    }
    return false;
  },

  deleteQuestion(examId, questionId) {
    const exams = this.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam || !exam.questions) return false;
    
    exam.questions = exam.questions.filter(q => q.id !== questionId);
    this.saveExams(exams);
    return true;
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    const defaultUser = (typeof INITIAL_USERS !== 'undefined' && INITIAL_USERS.length > 0)
      ? INITIAL_USERS[0]
      : (typeof USERS !== 'undefined' ? USERS[0] : null);
    if (defaultUser) {
      this.setCurrentUser(defaultUser);
    }
    return defaultUser;
  },

  setCurrentUser(user) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  },

  clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  saveSubmission(submission) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      const list = data ? JSON.parse(data) : [];
      list.unshift({
        ...submission,
        id: "sub-" + Date.now(),
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  },

  getSubmissions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  resetToDefault() {
    const list = (typeof INITIAL_EXAMS !== 'undefined') ? JSON.parse(JSON.stringify(INITIAL_EXAMS)) : [];
    list.forEach(e => {
      if (Array.isArray(e.questions) && e.questions.length > 10) {
        e.questions = e.questions.slice(0, 10);
        e.totalQuestionsCount = 10;
      }
    });
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(list));
    return list;
  }
};
