// lib/dummy-data.ts

export interface Student {
  id: string;
  name: string;
  email: string;
  branch: 'Computer Science' | 'Mechanical' | 'Electronics' | 'Civil';
  batch: string; // e.g., "2021-2025"
  attendance: {
    subjectId: string;
    totalClasses: number;
    attendedClasses: number;
  }[];
  grades: {
    assignmentId: string;
    marksObtained: number;
  }[];
}

export interface Subject {
  id: string;
  name: string;
  totalClasses: number;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  dueDate: Date;
  totalMarks: number;
}

export interface Grade {
  assignmentId: string;
  studentId: string;
  marksObtained: number;
  submissionDate?: Date;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  date: Date;
  time: string;
  batch: string;
}

export interface Class {
  id: string;
  courseName: string;
  courseCode: string;
  batch: string;
  year: number;
  section: string;
  studentCount: number;
  schedule: { day: string; time: string }[];
}

export interface TeacherStudent {
  id: string;
  rollNumber: string;
  name: string;
  currentAttendance: number;
}

// --- DUMMY DATA GENERATION ---

const SUBJECTS: Subject[] = [
  { id: 'SUB01', name: 'Data Structures', totalClasses: 60 },
  { id: 'SUB02', name: 'Algorithms', totalClasses: 60 },
  { id: 'SUB03', name: 'Database Management', totalClasses: 50 },
  { id: 'SUB04', name: 'Operating Systems', totalClasses: 55 },
  { id: 'SUB05', name: 'Networks', totalClasses: 45 },
  { id: 'SUB06', name: 'Theory of Computation', totalClasses: 50 },
];

const ASSIGNMENTS: Assignment[] = [
  { id: 'ASN01', title: 'Linked List Implementation', subjectId: 'SUB01', dueDate: new Date('2025-11-10'), totalMarks: 100 },
  { id: 'ASN02', title: 'Sorting Algorithm Analysis', subjectId: 'SUB02', dueDate: new Date('2025-11-15'), totalMarks: 100 },
  { id: 'ASN03', title: 'ER Diagram Design', subjectId: 'SUB03', dueDate: new Date('2025-11-20'), totalMarks: 50 },
  { id: 'ASN04', title: 'Process Scheduling Simulation', subjectId: 'SUB04', dueDate: new Date('2025-12-01'), totalMarks: 100 },
  { id: 'ASN05', title: 'Subnetting Exercise', subjectId: 'SUB05', dueDate: new Date('2025-12-05'), totalMarks: 50 },
  { id: 'ASN06', title: 'Finite Automata Design', subjectId: 'SUB06', dueDate: new Date('2025-12-10'), totalMarks: 75 },
  { id: 'ASN07', title: 'Graph Traversal', subjectId: 'SUB01', dueDate: new Date('2025-12-15'), totalMarks: 100 },
];

const STUDENTS: Student[] = Array.from({ length: 50 }, (_, i) => ({
  id: `STU${String(i + 1).padStart(3, '0')}`,
  name: `Student ${i + 1}`,
  email: `student${i + 1}@example.com`,
  branch: (['Computer Science', 'Mechanical', 'Electronics', 'Civil'] as const)[i % 4],
  batch: '2021-2025',
  attendance: SUBJECTS.map(s => ({
    subjectId: s.id,
    totalClasses: Math.floor(s.totalClasses / 2), // Mid-semester
    attendedClasses: Math.floor(Math.random() * (s.totalClasses / 2 - 25) + 25), // Random attendance
  })),
  grades: [],
}));

const GRADES: Grade[] = [];
STUDENTS.forEach(student => {
  ASSIGNMENTS.forEach(assignment => {
    if (assignment.dueDate < new Date()) { // Only grade past assignments
      const submissionDate = new Date(assignment.dueDate);
      const lag = Math.random();
      if (lag > 0.7) { // 30% chance of late submission
        submissionDate.setDate(submissionDate.getDate() + Math.floor(Math.random() * 5) + 1);
      }
      GRADES.push({
        assignmentId: assignment.id,
        studentId: student.id,
        marksObtained: Math.floor(Math.random() * (assignment.totalMarks * 0.8) + (assignment.totalMarks * 0.2)), // Score between 20% and 100%
        submissionDate: submissionDate,
      });
    }
  });
});

const SESSIONS: AttendanceSession[] = [];
const today = new Date();
SUBJECTS.forEach(sub => {
    for(let i=0; i<2; i++){ // 2 sessions per subject today
        SESSIONS.push({
            id: `SES${sub.id}${i}`,
            subjectId: sub.id,
            date: today,
            time: `${9 + i * 2}:00 - ${10 + i * 2}:00`,
            batch: '2021-2025'
        })
    }
})

// Teacher-related dummy data
const CLASSES: Class[] = [
  {
    id: "CLS001",
    courseName: "Data Structures and Algorithms",
    courseCode: "CS301",
    batch: "IT",
    year: 3,
    section: "A",
    studentCount: 45,
    schedule: [
      { day: "Monday", time: "9:00 AM - 10:30 AM" },
      { day: "Wednesday", time: "2:00 PM - 3:30 PM" },
    ],
  },
  {
    id: "CLS002",
    courseName: "Database Management Systems",
    courseCode: "CS302",
    batch: "CSE",
    year: 3,
    section: "B",
    studentCount: 50,
    schedule: [
      { day: "Tuesday", time: "10:30 AM - 12:00 PM" },
      { day: "Thursday", time: "9:00 AM - 10:30 AM" },
    ],
  },
  {
    id: "CLS003",
    courseName: "Operating Systems",
    courseCode: "CS303",
    batch: "IT",
    year: 3,
    section: "B",
    studentCount: 42,
    schedule: [
      { day: "Monday", time: "2:00 PM - 3:30 PM" },
      { day: "Friday", time: "9:00 AM - 10:30 AM" },
    ],
  },
  {
    id: "CLS004",
    courseName: "Computer Networks",
    courseCode: "CS304",
    batch: "CSE",
    year: 3,
    section: "A",
    studentCount: 48,
    schedule: [
      { day: "Wednesday", time: "9:00 AM - 10:30 AM" },
      { day: "Friday", time: "2:00 PM - 3:30 PM" },
    ],
  },
];

const TEACHER_STUDENTS: TeacherStudent[] = Array.from({ length: 50 }, (_, i) => ({
  id: `STU${String(i + 1).padStart(3, '0')}`,
  rollNumber: `IT21${String(i + 1).padStart(3, '0')}`,
  name: `Student ${String.fromCharCode(65 + (i % 26))} ${i + 1}`,
  currentAttendance: Math.floor(Math.random() * 30) + 65, // Random attendance 65-95%
}));


// --- DATA ACCESSOR FUNCTIONS ---

export const getSubjects = () => SUBJECTS;
export const getAssignments = () => ASSIGNMENTS;
export const getStudents = () => STUDENTS;
export const getGrades = () => GRADES;
export const getAttendanceSessions = () => SESSIONS;
export const getClasses = () => CLASSES;
export const getTeacherStudents = () => TEACHER_STUDENTS;

export const getPersonalizedStudentData = (studentId: string = 'STU001') => {
  const student = STUDENTS.find(s => s.id === studentId);
  if (!student) throw new Error('Student not found');

  const classAverageAttendance = STUDENTS.reduce((acc, s) => {
    const totalAttended = s.attendance.reduce((sum, att) => sum + att.attendedClasses, 0);
    const totalPossible = s.attendance.reduce((sum, att) => sum + att.totalClasses, 0);
    return acc + (totalAttended / totalPossible);
  }, 0) / STUDENTS.length;

  const studentAttendance = student.attendance.reduce((acc, att) => {
    const subject = SUBJECTS.find(s => s.id === att.subjectId);
    if (!subject) return acc;
    return {
      totalAttended: acc.totalAttended + att.attendedClasses,
      totalPossible: acc.totalPossible + att.totalClasses,
    };
  }, { totalAttended: 0, totalPossible: 0 });

  const recentGrades = GRADES
    .filter(g => g.studentId === studentId)
    .map(g => {
      const assignment = ASSIGNMENTS.find(a => a.id === g.assignmentId);
      return { ...g, assignment };
    })
    .sort((a, b) => b.assignment!.dueDate.getTime() - a.assignment!.dueDate.getTime())
    .slice(0, 3);

  const pendingAssignments = ASSIGNMENTS.filter(a => a.dueDate >= new Date());

  const lowAttendanceSubjects = student.attendance
    .filter(att => (att.attendedClasses / att.totalClasses) < 0.75)
    .map(att => SUBJECTS.find(s => s.id === att.subjectId)?.name)
    .filter(Boolean) as string[];

  return {
    student,
    attendance: {
      rate: studentAttendance.totalPossible > 0 ? studentAttendance.totalAttended / studentAttendance.totalPossible : 0,
      classAverage: classAverageAttendance,
    },
    recentGrades,
    actionItems: {
      pendingAssignments,
      lowAttendanceSubjects,
    }
  };
};

export const getManagementStats = (studentId: string = 'STU001') => {
    const student = STUDENTS.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const totalClasses = SESSIONS.length;
    const studentAttendance = student.attendance.reduce((acc, att) => {
      const subject = SUBJECTS.find(s => s.id === att.subjectId);
      if (!subject) return acc;
      return {
        totalAttended: acc.totalAttended + att.attendedClasses,
        totalPossible: acc.totalPossible + att.totalClasses,
      };
    }, { totalAttended: 0, totalPossible: 0 });

    const classesAttended = studentAttendance.totalAttended;

    const attendanceRate = totalClasses > 0 
        ? ((classesAttended / totalClasses) * 100).toFixed(1) + '%'
        : '0%';

    const classesMissed = studentAttendance.totalPossible - classesAttended;

    return {
        totalClasses,
        classesAttended,
        attendanceRate,
        classesMissed,
    }
}

export const getGradeAttendanceCorrelation = () => {
    return STUDENTS.map(student => {
        const totalAttended = student.attendance.reduce((sum, att) => sum + att.attendedClasses, 0);
        const totalPossible = student.attendance.reduce((sum, att) => sum + att.totalClasses, 0);
        const attendanceRate = totalPossible > 0 ? (totalAttended / totalPossible) * 100 : 0;

        const studentGrades = GRADES.filter(g => g.studentId === student.id);
        const totalMarks = studentGrades.reduce((sum, g) => {
            const assignment = ASSIGNMENTS.find(a => a.id === g.assignmentId);
            return sum + (g.marksObtained / (assignment?.totalMarks || 100));
        }, 0);
        const averageGrade = studentGrades.length > 0 ? (totalMarks / studentGrades.length) * 100 : 0;

        return {
            name: student.name,
            attendance: attendanceRate,
            grade: averageGrade,
        }
    });
}

export const getLowAttendanceSubjects = () => {
    const subjectAttendance = SUBJECTS.map(subject => {
        let totalAttended = 0;
        let totalPossible = 0;
        STUDENTS.forEach(student => {
            const att = student.attendance.find(a => a.subjectId === subject.id);
            if (att) {
                totalAttended += att.attendedClasses;
                totalPossible += att.totalClasses;
            }
        });
        const rate = totalPossible > 0 ? totalAttended / totalPossible : 0;
        return {
            id: subject.id,
            name: subject.name,
            attendanceRate: rate * 100,
            branch: 'Computer Science', // Dummy branch
        }
    });

    return subjectAttendance.filter(s => s.attendanceRate < 75);
}
