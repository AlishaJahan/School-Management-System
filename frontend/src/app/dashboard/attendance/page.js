"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function MarkAttendance() {
  const [currentUser, setCurrentUser] = useState({ name: "System Administrator", role: "admin" });
  const [selectedClass, setSelectedClass] = useState("LKG");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // 2-Step Workflow: 1 = Selection Page, 2 = Marking Page
  const [step, setStep] = useState(1);

  // Admin exclusive tab: "student" or "teacher"
  const [attendanceType, setAttendanceType] = useState("student");

  // Student active logs state
  const [activeMonth, setActiveMonth] = useState("May 2026");

  // History states
  const [activeSubTab, setActiveSubTab] = useState("record"); // "record" or "history"
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);

  const monthlyStudentStats = {
    "May 2026": {
      present: 18,
      absent: 1,
      holidays: 3,
      total: 22,
      rate: 81.8,
      logs: [
        { date: "2026-05-24", day: "Sunday", subject: "Academic Holiday", status: "holiday" },
        { date: "2026-05-23", day: "Saturday", subject: "Academic Holiday", status: "holiday" },
        { date: "2026-05-22", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-05-21", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-05-20", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-05-19", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-05-18", day: "Monday", subject: "English Literature", status: "present" },
        { date: "2026-05-15", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-05-14", day: "Thursday", subject: "Computer Science", status: "absent" },
        { date: "2026-05-13", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-05-12", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-05-11", day: "Monday", subject: "English Literature", status: "present" },
        { date: "2026-05-10", day: "Sunday", subject: "School Holiday", status: "holiday" },
        { date: "2026-05-08", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-05-07", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-05-06", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-05-05", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-05-04", day: "Monday", subject: "English Literature", status: "present" }
      ]
    },
    "April 2026": {
      present: 20,
      absent: 0,
      holidays: 2,
      total: 22,
      rate: 90.9,
      logs: [
        { date: "2026-04-30", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-04-29", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-04-28", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-04-27", day: "Monday", subject: "English Literature", status: "present" },
        { date: "2026-04-24", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-04-23", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-04-22", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-04-21", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-04-20", day: "Monday", subject: "English Literature", status: "present" },
        { date: "2026-04-17", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-04-16", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-04-15", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-04-14", day: "Tuesday", subject: "Good Friday Holiday", status: "holiday" },
        { date: "2026-04-13", day: "Monday", subject: "Baisakhi Holiday", status: "holiday" },
        { date: "2026-04-10", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-04-09", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-04-08", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-04-07", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-04-06", day: "Monday", subject: "English Literature", status: "present" },
        { date: "2026-04-03", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-04-02", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-04-01", day: "Wednesday", subject: "Mathematics", status: "present" }
      ]
    },
    "March 2026": {
      present: 17,
      absent: 2,
      holidays: 1,
      total: 20,
      rate: 85.0,
      logs: [
        { date: "2026-03-31", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-03-30", day: "Monday", subject: "English Literature", status: "present" },
        { date: "2026-03-27", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-03-26", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-03-25", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-03-24", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-03-23", day: "Monday", subject: "English Literature", status: "absent" },
        { date: "2026-03-20", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-03-19", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-03-18", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-03-17", day: "Tuesday", subject: "Physics", status: "present" },
        { date: "2026-03-16", day: "Monday", subject: "English Literature", status: "present" },
        { date: "2026-03-13", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-03-12", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-03-11", day: "Wednesday", subject: "Mathematics", status: "absent" },
        { date: "2026-03-10", day: "Tuesday", subject: "Maha Shivratri Holiday", status: "holiday" },
        { date: "2026-03-06", day: "Friday", subject: "Database Systems", status: "present" },
        { date: "2026-03-05", day: "Thursday", subject: "Computer Science", status: "present" },
        { date: "2026-03-04", day: "Wednesday", subject: "Mathematics", status: "present" },
        { date: "2026-03-03", day: "Tuesday", subject: "Physics", status: "present" }
      ]
    }
  };

  // Assigned Classes list for Students Attendance - Configured for LKG to Class 12 (Only 11th & 12th have sections)
  const assignedClasses = [
    {
      grade: "LKG",
      subject: "Early Childhood Development",
      room: "Junior Wing A",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "indigo"
    },
    {
      grade: "UKG",
      subject: "Playful Learning & Activities",
      room: "Junior Wing B",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "violet"
    },
    {
      grade: "Class 1",
      subject: "Basic Alphabets & Mathematics",
      room: "Room 101",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "cyan"
    },
    {
      grade: "Class 2",
      subject: "Creative Reading & Prose",
      room: "Room 102",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      color: "emerald"
    },
    {
      grade: "Class 3",
      subject: "Introductory Science & EVS",
      room: "Room 201",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: "indigo"
    },
    {
      grade: "Class 4",
      subject: "Social Science & Geography",
      room: "Room 202",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m0 0l-2-2m2 2l-2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "violet"
    },
    {
      grade: "Class 5",
      subject: "Elementary Math Fractions",
      room: "Room 301",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: "cyan"
    },
    {
      grade: "Class 6",
      subject: "General Sciences & Physics",
      room: "Room 302",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h-2v-4.757z" />
        </svg>
      ),
      color: "emerald"
    },
    {
      grade: "Class 7",
      subject: "Medieval History & Civics",
      room: "Room 401",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      color: "indigo"
    },
    {
      grade: "Class 8",
      subject: "English Literature Studies",
      room: "Room 402",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "violet"
    },
    {
      grade: "Class 9",
      subject: "Foundation Biology & Chemistry",
      room: "Room 501",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: "cyan"
    },
    {
      grade: "Class 10",
      subject: "Computer Science & Application",
      room: "CS Lab 2",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "indigo"
    },
    {
      grade: "Class 11-A",
      subject: "Cyber Security & Networks",
      room: "IT Lab 1",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-6v2m0-5h.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: "cyan"
    },
    {
      grade: "Class 11-B",
      subject: "Applied Mathematics",
      room: "Room 502",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: "indigo"
    },
    {
      grade: "Class 12-A",
      subject: "Web Technologies & Web3",
      room: "Web Lab 1",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      color: "violet"
    },
    {
      grade: "Class 12-B",
      subject: "Database Systems & SQL",
      room: "DBMS Lab 3",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      color: "emerald"
    }
  ];

  // Student database mapped by Class Grades
  const initialStudentDatabase = {
    "Class 10-A": [
      { student_id: 1, name: "Rahul Verma", roll_no: "STU-2026-001", status: "present" },
      { student_id: 3, name: "Priya Sharma", roll_no: "STU-2026-003", status: "present" },
      { student_id: 4, name: "Amit Patel", roll_no: "STU-2026-004", status: "present" },
      { student_id: 5, name: "Sneha Reddy", roll_no: "STU-2026-005", status: "present" },
      { student_id: 6, name: "Vikram Singh", roll_no: "STU-2026-006", status: "present" }
    ],
    "Class 12-B": [
      { student_id: 2, name: "Sana Khan", roll_no: "STU-2026-002", status: "present" },
      { student_id: 7, name: "Aarav Mehta", roll_no: "STU-2026-007", status: "present" },
      { student_id: 8, name: "Diya Iyer", roll_no: "STU-2026-008", status: "present" },
      { student_id: 9, name: "Kabir Sen", roll_no: "STU-2026-009", status: "present" },
      { student_id: 10, name: "Neha Gupta", roll_no: "STU-2026-010", status: "present" }
    ],
    "Class 11-A": [
      { student_id: 11, name: "Rohan Das", roll_no: "STU-2026-011", status: "present" },
      { student_id: 12, name: "Ananya Roy", roll_no: "STU-2026-012", status: "present" },
      { student_id: 13, name: "Yash Malhotra", roll_no: "STU-2026-013", status: "present" },
      { student_id: 14, name: "Tanvi Shah", roll_no: "STU-2026-014", status: "present" },
      { student_id: 15, name: "Abhinav Mishra", roll_no: "STU-2026-015", status: "present" }
    ]
  };

  // Seeding dynamic Teacher database for Admin portal attendance
  const [teachers, setTeachers] = useState([
    { teacher_id: 1, name: "Alisha Jahan", subject: "Computer Science", phone: "+91 9876543210", status: "present" },
    { teacher_id: 2, name: "Rohan Sharma", subject: "Mathematics", phone: "+91 9998887776", status: "present" },
    { teacher_id: 3, name: "Neha Sen", subject: "English Literature", phone: "+91 9123456780", status: "present" },
    { teacher_id: 4, name: "Karan Roy", subject: "Physics", phone: "+91 9890123456", status: "present" }
  ]);

  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Fetch current user details
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    // Load attendance records
    const savedRecordsStr = localStorage.getItem("attendance_records");
    if (savedRecordsStr) {
      try {
        setHistoryRecords(JSON.parse(savedRecordsStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Update visible students when selected class switches
  useEffect(() => {
    let classStudents = initialStudentDatabase[selectedClass];
    if (!classStudents) {
      // Dynamically generate 5 premium dummy students for this class!
      const rollKey = selectedClass.toUpperCase().replace(/[^A-Z0-9]/g, "");
      classStudents = [
        { student_id: 101, name: `Aarav Sharma (${selectedClass})`, roll_no: `STU-${rollKey}-001`, status: "present" },
        { student_id: 102, name: `Isha Patel (${selectedClass})`, roll_no: `STU-${rollKey}-002`, status: "present" },
        { student_id: 103, name: `Rohan Verma (${selectedClass})`, roll_no: `STU-${rollKey}-003`, status: "present" },
        { student_id: 104, name: `Diya Rao (${selectedClass})`, roll_no: `STU-${rollKey}-004`, status: "present" },
        { student_id: 105, name: `Kabir Singh (${selectedClass})`, roll_no: `STU-${rollKey}-005`, status: "present" }
      ];
    }
    setStudents(classStudents);
    setSuccess("");
    setError("");
  }, [selectedClass]);

  // Handle present/absent switch toggle for students
  const handleStudentStatusChange = (studentId, statusValue) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.student_id === studentId ? { ...student, status: statusValue } : student
      )
    );
  };

  // Handle present/absent toggle for teachers
  const handleTeacherStatusChange = (teacherId, statusValue) => {
    setTeachers(prevTeachers =>
      prevTeachers.map(t =>
        t.teacher_id === teacherId ? { ...t, status: statusValue } : t
      )
    );
  };

  // Submit student roll call
  const handleSubmitAttendance = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    const presentCount = students.filter(s => s.status === "present").length;
    const absentCount = students.filter(s => s.status === "absent").length;

    const newRecord = {
      id: Date.now(),
      date: attendanceDate,
      type: "student",
      class_grade: selectedClass,
      present_count: presentCount,
      absent_count: absentCount,
      total_count: students.length,
      roll_call: students.map(s => ({ name: s.name, roll_no: s.roll_no, status: s.status }))
    };

    setTimeout(() => {
      setLoading(false);

      const savedRecordsStr = localStorage.getItem("attendance_records") || "[]";
      let savedRecords = [];
      try {
        savedRecords = JSON.parse(savedRecordsStr);
      } catch (err) {
        console.error(err);
      }
      
      const updatedRecords = [newRecord, ...savedRecords];
      localStorage.setItem("attendance_records", JSON.stringify(updatedRecords));
      setHistoryRecords(updatedRecords);

      setSuccess(`Attendance successfully saved! submitted for ${selectedClass} on ${attendanceDate}. Status: ${presentCount} Present, ${absentCount} Absent.`);
      setTimeout(() => {
        setSuccess("");
        setStep(1);
      }, 4000);
    }, 1000);
  };

  // Submit teacher attendance roll
  const handleSubmitTeacherAttendance = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    const presentCount = teachers.filter(t => t.status === "present").length;
    const absentCount = teachers.filter(t => t.status === "absent").length;

    const newRecord = {
      id: Date.now(),
      date: attendanceDate,
      type: "teacher",
      class_grade: "Faculty Staff",
      present_count: presentCount,
      absent_count: absentCount,
      total_count: teachers.length,
      roll_call: teachers.map(t => ({ name: t.name, subject: t.subject, status: t.status }))
    };

    setTimeout(() => {
      setLoading(false);

      const savedRecordsStr = localStorage.getItem("attendance_records") || "[]";
      let savedRecords = [];
      try {
        savedRecords = JSON.parse(savedRecordsStr);
      } catch (err) {
        console.error(err);
      }
      
      const updatedRecords = [newRecord, ...savedRecords];
      localStorage.setItem("attendance_records", JSON.stringify(updatedRecords));
      setHistoryRecords(updatedRecords);

      setSuccess(`Teacher Attendance successfully registered! (Total: ${presentCount} Present, ${absentCount} Absent) for Date: ${attendanceDate}`);
      setTimeout(() => {
        setSuccess("");
        setStep(1);
      }, 4000);
    }, 1000);
  };

  const markAllStudents = (statusValue) => {
    setStudents(prevStudents =>
      prevStudents.map(student => ({ ...student, status: statusValue }))
    );
  };

  const markAllTeachers = (statusValue) => {
    setTeachers(prevTeachers =>
      prevTeachers.map(t => ({ ...t, status: statusValue }))
    );
  };

  const isDateHolidayOrSunday = (dateStr) => {
    if (!dateStr) return { isBlocked: false };
    
    // Check if Sunday
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) {
      return { isBlocked: true, reason: "Sunday (Weekend Off-Day)" };
    }
    
    const dateFormatted = dateStr; 
    
    const holidays = [
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-01-26", name: "Republic Day" },
      { date: "2026-02-15", name: "Maha Shivratri" },
      { date: "2026-03-04", name: "Holi Festival" },
      { date: "2026-03-20", name: "Eid-ul-Fitr" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-08-15", name: "Independence Day" },
      { date: "2026-08-28", name: "Raksha Bandhan" },
      { date: "2026-10-02", name: "Gandhi Jayanti" },
      { date: "2026-10-20", name: "Dussehra Break" },
      { date: "2026-11-24", name: "Guru Nanak Jayanti" },
      { date: "2026-12-25", name: "Christmas Day" }
    ];
    
    const matchedHoliday = holidays.find(h => h.date === dateFormatted);
    if (matchedHoliday) {
      return { isBlocked: true, reason: matchedHoliday.name };
    }
    
    // const summerStart = new Date("2026-05-25");
    // const summerEnd = new Date("2026-06-30");
    // if (dateObj >= summerStart && dateObj <= summerEnd) {
    //   return { isBlocked: true, reason: "Summer Vacation Break" };
    // }
    
    const diwaliStart = new Date("2026-11-07");
    const diwaliEnd = new Date("2026-11-10");
    if (dateObj >= diwaliStart && dateObj <= diwaliEnd) {
      return { isBlocked: true, reason: "Diwali Holidays Break" };
    }
    
    return { isBlocked: false };
  };

  const handleSelectClassCard = (className) => {
    const blockCheck = isDateHolidayOrSunday(attendanceDate);
    if (blockCheck.isBlocked) {
      setError(`Cannot record attendance! The selected date falls on a ${blockCheck.reason}.`);
      return;
    }
    setSelectedClass(className);
    setStep(2);
  };

  const handleOpenTeacherRollCall = () => {
    const blockCheck = isDateHolidayOrSunday(attendanceDate);
    if (blockCheck.isBlocked) {
      setError(`Cannot record attendance! The selected date falls on a ${blockCheck.reason}.`);
      return;
    }
    setAttendanceType("teacher");
    setSuccess("");
    setError("");
    setStep(2);
  };

  const colorClasses = {
    indigo: "from-indigo-500/10 to-indigo-600/10 text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    cyan: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-400 border-violet-500/20 bg-violet-500/5"
  };

  const glowColors = {
    indigo: "hover:border-indigo-500/30 group-hover:bg-indigo-500/20",
    cyan: "hover:border-cyan-500/30 group-hover:bg-cyan-500/20",
    violet: "hover:border-violet-500/30 group-hover:bg-violet-500/20"
  };

  const badgeColors = {
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/20"
  };

  if (currentUser.role?.toLowerCase() === "student") {
    const stats = monthlyStudentStats[activeMonth] || { logs: [] };

    // Dynamic calculations for overall stats based on the logs
    const presentDays = stats.logs.filter(log => log.status === "present").length;
    const absentDays = stats.logs.filter(log => log.status === "absent").length;
    const holidayDays = stats.logs.filter(log => log.status === "holiday").length;
    const totalWorkingDays = presentDays + absentDays;
    const overallRate = totalWorkingDays > 0 ? parseFloat(((presentDays / totalWorkingDays) * 100).toFixed(1)) : 0.0;

    // Helper to get custom colors and icons for subjects
    const getSubjectDetails = (subjectName) => {
      const name = subjectName.toLowerCase();
      if (name.includes("database")) {
        return {
          color: "emerald",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          )
        };
      } else if (name.includes("computer") || name.includes("science")) {
        return {
          color: "indigo",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )
        };
      } else if (name.includes("math")) {
        return {
          color: "cyan",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )
        };
      } else if (name.includes("physics")) {
        return {
          color: "violet",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          )
        };
      } else {
        return {
          color: "rose",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          )
        };
      }
    };

    const cardColors = {
      emerald: "from-emerald-500/10 to-emerald-600/10 text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30",
      indigo: "from-indigo-500/10 to-indigo-600/10 text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/30",
      cyan: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/30",
      violet: "from-violet-500/10 to-purple-500/10 text-violet-400 border-violet-500/20 bg-violet-500/5 hover:border-violet-500/30",
      rose: "from-rose-500/10 to-pink-500/10 text-rose-400 border-rose-500/20 bg-rose-500/5 hover:border-rose-500/30"
    };

    const progressColors = {
      emerald: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
      indigo: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]",
      cyan: "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
      violet: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]",
      rose: "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
    };

    const badgeColors = {
      emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
      indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
      cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
      violet: "bg-violet-500/15 text-violet-300 border-violet-500/20",
      rose: "bg-rose-500/15 text-rose-300 border-rose-500/20"
    };

    // Calculate subject breakdown dynamically
    const subjectStats = {};
    stats.logs.forEach(log => {
      if (log.status === "holiday") return;
      const sub = log.subject;
      if (!subjectStats[sub]) {
        subjectStats[sub] = { present: 0, absent: 0, total: 0 };
      }
      if (log.status === "present") {
        subjectStats[sub].present += 1;
      } else if (log.status === "absent") {
        subjectStats[sub].absent += 1;
      }
      subjectStats[sub].total += 1;
    });

    const subjectsList = Object.keys(subjectStats).map(sub => {
      const s = subjectStats[sub];
      const rate = s.total > 0 ? parseFloat(((s.present / s.total) * 100).toFixed(1)) : 0.0;
      return {
        subject: sub,
        present: s.present,
        absent: s.absent,
        total: s.total,
        rate: rate
      };
    });

    // Render Monthly Attendance Heatmap Grid
    const renderCalendarHeatmap = () => {
      const logs = stats.logs || [];
      const [monthName, yearStr] = activeMonth.split(" ");
      const year = parseInt(yearStr);
      const monthsMap = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
      };
      const month = monthsMap[monthName];
      
      const totalDays = new Date(year, month + 1, 0).getDate();
      let firstDayIdx = new Date(year, month, 1).getDay();
      firstDayIdx = firstDayIdx === 0 ? 6 : firstDayIdx - 1; // Mon shift

      const cells = [];
      for (let i = 0; i < firstDayIdx; i++) {
        cells.push({ isPadding: true });
      }

      for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const matchedLog = logs.find(log => log.date === dateStr);
        let status = "no-record";
        let subject = "No sessions scheduled";
        
        if (matchedLog) {
          status = matchedLog.status;
          subject = matchedLog.subject;
        } else {
          const dayOfWeek = new Date(year, month, dayNum).getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            status = "weekend";
            subject = "Weekend Off-Day";
          }
        }

        cells.push({
          isPadding: false,
          dayNum,
          dateStr,
          status,
          subject
        });
      }

      const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      return (
        <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-4">
          <div>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              📅 Monthly Attendance Heatmap Grid
            </h4>
            <p className="text-xs text-zinc-400">Visual matrix of your daily verified attendance statuses for the chosen month.</p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-7 gap-2.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {weekDays.map(d => <span key={d}>{d}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-2.5">
              {cells.map((cell, idx) => {
                if (cell.isPadding) {
                  return <div key={`pad-${idx}`} className="aspect-square" />;
                }

                let bgStyle = "bg-white/[0.02] border-white/5 text-zinc-600";
                let glowEffect = "";

                if (cell.status === "present") {
                  bgStyle = "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]";
                  glowEffect = "hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]";
                } else if (cell.status === "absent") {
                  bgStyle = "bg-rose-500/20 border-rose-500/30 text-rose-300 shadow-[0_0_8px_rgba(239,68,68,0.15)]";
                  glowEffect = "hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]";
                } else if (cell.status === "holiday") {
                  bgStyle = "bg-amber-500/15 border-amber-500/20 text-amber-300";
                } else if (cell.status === "weekend") {
                  bgStyle = "bg-zinc-800/30 border-white/5 text-zinc-500";
                }

                return (
                  <div
                    key={cell.dateStr}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative group cursor-pointer transition-all duration-300 ${bgStyle} ${glowEffect}`}
                  >
                    <span className="text-xs font-bold font-mono">{cell.dayNum}</span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-[#09090b] border border-white/10 p-2.5 rounded-xl text-[10px] font-semibold text-zinc-300 z-20 whitespace-nowrap shadow-2xl gap-0.5 pointer-events-none">
                      <span className="text-[9px] font-black uppercase text-indigo-400">{cell.dateStr}</span>
                      <span className="text-white font-extrabold uppercase text-[10px]">Status: {cell.status}</span>
                      <span className="text-zinc-400 font-medium">Activity: {cell.subject}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/20" />
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-800/30 border border-white/5" />
              <span>Weekend</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">My Attendance Analytics</h2>
            <p className="text-zinc-400 text-sm">Review your daily attendance status logs, term percentages, and compliance status.</p>
          </div>
          
          {/* Month Switcher Controls */}
          <div className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-3 border border-white/5 bg-white/[0.01]">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Month:</span>
            <select
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="bg-[#09090b] text-sm text-indigo-300 font-bold border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 transition-colors"
            >
              <option value="May 2026">May 2026</option>
              <option value="April 2026">April 2026</option>
              <option value="March 2026">March 2026</option>
            </select>
          </div>
        </div>

        {/* Low Attendance Flashing Warning Alert */}
        {overallRate < 75.0 && (
          <div className="p-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-rose-400 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-500/10">
            <div className="flex items-center gap-3.5">
              <span className="text-2xl">⚠️</span>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold text-sm uppercase tracking-wide text-white">Critical Low Attendance Alert</h4>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  Your current attendance rate of <strong>{overallRate}%</strong> is below the mandatory <strong>75%</strong> threshold required to appear in final examinations.
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl shadow-md whitespace-nowrap">
              Ineligible Status
            </div>
          </div>
        )}

        {/* Dashboard Analytics & Radial Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Statistics summary cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Overall Attendance rate */}
            <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group border-indigo-500/20 bg-indigo-500/5">
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Attendance Percentage</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-extrabold text-white">{overallRate}%</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  overallRate >= 75.0 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                }`}>
                  {overallRate >= 75.0 ? "Compliant" : "At Risk"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Your average attendance rate is calculated from conducted lectures.</p>
            </div>

            {/* Total Working Days */}
            <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group border-cyan-500/20 bg-cyan-500/5">
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Working Days</span>
              <h3 className="text-4xl font-extrabold text-white">{totalWorkingDays} <span className="text-sm font-semibold text-zinc-500">Days</span></h3>
              <p className="text-xs text-zinc-400">Total academic calendar days scheduled for classes (excluding holidays).</p>
            </div>

            {/* Present days */}
            <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group border-emerald-500/20 bg-emerald-500/5">
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Present lectures</span>
              <h3 className="text-4xl font-extrabold text-white">{presentDays} <span className="text-sm font-semibold text-zinc-500">Days</span></h3>
              <p className="text-xs text-zinc-400">Total verified academic days attended and signed off by class instructors.</p>
            </div>

            {/* Absent days */}
            <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group border-rose-500/20 bg-rose-500/5">
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-rose-500/5 blur-xl group-hover:scale-150 transition-all duration-500" />
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Absent records</span>
              <h3 className="text-4xl font-extrabold text-white">{absentDays} <span className="text-sm font-semibold text-zinc-500">Days</span></h3>
              <p className="text-xs text-zinc-400">Unexcused absent lectures. Please submit medical/leave slips if exempt.</p>
            </div>

          </div>

          {/* Right hand side Column (Radial Donut + Trends Timeline) */}
          <div className="flex flex-col gap-6">
            
            {/* Premium Radial Donut SVG indicator card */}
            <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-6 border-white/5 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Academic Eligibility Ring</span>
                <span className="text-[11px] font-bold text-indigo-400">Target Threshold: 75%</span>
              </div>

              {/* Circular Progress Ring */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="8"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#radialGrad)"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - overallRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  
                  {/* Linear gradient definition */}
                  <defs>
                    <linearGradient id="radialGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Inner ring text */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{overallRate}%</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Eligibility Rate</span>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border text-xs font-bold leading-relaxed w-full ${
                overallRate >= 75.0 
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
                  : "border-rose-500/20 bg-rose-500/10 text-rose-400"
              }`}>
                {overallRate >= 75.0 
                  ? "✓ Active status is compliant to appear in upcoming terminal exams." 
                  : "⚠ Active status is critically below required eligibility threshold."}
              </div>
            </div>

            {/* Monthly comparative trends card */}
            <div className="glass-card p-6 rounded-3xl border-white/5 flex flex-col gap-4 w-full">
              <div>
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Monthly Trend Timeline</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-1">Comparative Aggregates</h4>
              </div>
              <div className="flex flex-col gap-3.5">
                {[
                  { month: "May 2026", rate: 81.8, color: "indigo" },
                  { month: "April 2026", rate: 90.9, color: "emerald" },
                  { month: "March 2026", rate: 85.0, color: "cyan" }
                ].map(item => (
                  <div key={item.month} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400">{item.month}</span>
                      <span className="text-white font-mono font-bold">{item.rate}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'cyan' ? 'bg-cyan-500' : 'bg-indigo-500'
                        }`} 
                        style={{ width: `${item.rate}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Calendar Heatmap matrix */}
        {renderCalendarHeatmap()}

        {/* Subject-Wise Attendance Breakdown Section */}
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">Subject-Wise Attendance Breakdown</h3>
            <p className="text-zinc-400 text-sm">Review your live academic performance and eligibility stats per individual course.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subjectsList.map((item) => {
              const details = getSubjectDetails(item.subject);
              const isCompliant = item.rate >= 75.0;
              
              return (
                <div
                  key={item.subject}
                  className={`glass-card p-6 rounded-3xl flex flex-col gap-5 border transition-all duration-300 relative overflow-hidden group ${cardColors[details.color]}`}
                >
                  {/* Decorative blur elements */}
                  <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-5 blur-xl group-hover:scale-150 transition-all duration-500`} />

                  {/* Card Header: Icon & Subject Title */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${badgeColors[details.color]}`}>
                        {details.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base tracking-tight group-hover:text-indigo-300 transition-colors">
                          {item.subject}
                        </h4>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Academic Course
                        </span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      isCompliant 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {isCompliant ? "Safe" : "Critical"}
                    </span>
                  </div>

                  {/* Linear Progress Bar */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Subject Attendance</span>
                      <span className="text-sm font-black text-white">{item.rate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.03] border border-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColors[details.color]}`}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>

                  {/* Mini-Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Conducted</span>
                      <span className="text-sm font-extrabold text-white">{item.total}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-x border-white/5">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Attended</span>
                      <span className="text-sm font-extrabold text-emerald-400">{item.present}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Missed</span>
                      <span className="text-sm font-extrabold text-rose-400">{item.absent}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily status logs list */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl relative border-white/5">
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h4 className="font-extrabold text-white">Daily Attendance Registry Logs</h4>
            <p className="text-xs text-zinc-500 mt-1">Review verified daily log records for {activeMonth}.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <th className="px-6 py-5">Calendar Date</th>
                  <th className="px-6 py-5">Weekday</th>
                  <th className="px-6 py-5">Assigned Subject</th>
                  <th className="px-6 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.logs.map((log) => {
                  let statusBadge = "";
                  if (log.status === "present") {
                    statusBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                  } else if (log.status === "absent") {
                    statusBadge = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                  } else {
                    statusBadge = "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
                  }

                  return (
                    <tr key={log.date} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs font-semibold text-indigo-300">
                        {new Date(log.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-6 py-5 font-bold text-sm text-zinc-300">
                        {log.day}
                      </td>
                      <td className="px-6 py-5 text-xs font-semibold text-zinc-400">
                        {log.subject}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'present' ? 'bg-emerald-400' : log.status === 'absent' ? 'bg-rose-400' : 'bg-zinc-500'
                          }`} />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  const buttonColors = {
    indigo: "bg-indigo-500 hover:bg-indigo-600",
    cyan: "bg-cyan-500 hover:bg-cyan-600",
    violet: "bg-violet-500 hover:bg-violet-600"
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Daily Portal Attendance</h2>
        <p className="text-zinc-400 text-sm">Select target registers to record roll calls for students or specialized academic staff</p>
      </div>

      {/* Tab Selector */}
      {step === 1 && (currentUser.role === "admin" || currentUser.role === "teacher") && (
        <div className="flex border-b border-white/5 gap-2 mt-2 select-none">
          <button
            onClick={() => setActiveSubTab("record")}
            className={`pb-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
              activeSubTab === "record" ? "border-indigo-400 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Record Roll Call
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`pb-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
              activeSubTab === "history" ? "border-indigo-400 text-indigo-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Attendance History Logs
          </button>
        </div>
      )}

      {/* Success/Error Alerts */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Selection gateway (Students Assigned Classes OR Teachers Attendance Option) */}
      {step === 1 && activeSubTab === "record" && (() => {
        const checkBlock = isDateHolidayOrSunday(attendanceDate);
        
        // Filter classes: Admin sees all, Teachers see only their assigned classes
        let visibleClasses = assignedClasses;
        if (currentUser.role?.toLowerCase() === "teacher") {
          const email = currentUser.email?.toLowerCase() || "";
          if (email.includes("alisha")) {
            // Alisha teaches CS / IT subjects
            visibleClasses = assignedClasses.filter(c => 
              c.grade.includes("10") || c.grade.includes("11-A") || c.grade.includes("12-A") || c.grade.includes("12-B")
            );
          } else if (email.includes("rohan")) {
            // Rohan teaches Mathematics
            visibleClasses = assignedClasses.filter(c => 
              c.grade.includes("1") || c.grade.includes("5") || c.grade.includes("11-B")
            );
          } else {
            // Fallback for other teachers: show a subset of classes aligned with their profile
            visibleClasses = assignedClasses.slice(0, 3);
          }
        }

        return (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Date Selector bar */}
            <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h4 className="font-extrabold text-zinc-100">Set Roll Call Timeline</h4>
                <span className="text-xs text-zinc-400">Choose the calendar date for attendance registration</span>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input
                  type="date"
                  value={attendanceDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    setSuccess("");
                    setError("");
                  }}
                  className="glass-input px-5 py-3 text-sm font-semibold text-white w-full md:w-64"
                />
              </div>
            </div>

            {/* Sunday/Holiday Warning Banner */}
            {checkBlock.isBlocked && (
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm font-semibold animate-fade-in flex items-center gap-3 leading-relaxed">
                <svg className="w-6 h-6 flex-shrink-0 text-rose-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  ⚠ Attendance recording is suspended: The selected date is a <strong>{checkBlock.reason}</strong>. Attendance register marking is completely disabled for weekend off-days and official school holidays.
                </span>
              </div>
            )}

            {/* Admin Exclusive: Segmented slider switches for Student / Teacher categories */}
            {currentUser.role === "admin" && (
              <div className={`glass-card p-6 rounded-2xl flex flex-col gap-4 border-cyan-500/20 bg-cyan-500/5 transition-opacity ${checkBlock.isBlocked ? "opacity-40" : ""}`}>
                <div className="flex flex-col gap-1">
                  <h4 className="font-extrabold text-white">Staff Attendance Portal Segment</h4>
                  <span className="text-xs text-zinc-400">Record and review daily attendance logs of specialized school teachers</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenTeacherRollCall}
                  disabled={checkBlock.isBlocked}
                  className={`glow-btn py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all ${
                    checkBlock.isBlocked ? "opacity-50 cursor-not-allowed shadow-none" : "shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Mark Teacher Attendance</span>
                </button>
              </div>
            )}

            {/* Intelligent low-attendance alert card for teachers/admins */}
            <div className="glass-card p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                <div>
                  <h4 className="font-extrabold text-white text-sm uppercase tracking-wide">Automatic Compliance Alerts</h4>
                  <span className="text-xs text-zinc-400">Students flagged below 75% final-exam attendance threshold</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1.5">
                
                {/* Seeded Warning Student 1 */}
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-300">
                      SK
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-white truncate">Sana Khan</span>
                      <span className="text-[10px] text-zinc-400 truncate">Roll: STU-2026-002 • Class 12-B</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs font-black text-rose-400">60.0% Att.</span>
                    <span className="text-[8px] font-bold text-rose-300 uppercase tracking-widest border border-rose-500/30 px-1.5 py-0.5 rounded bg-rose-500/10 animate-pulse">Ineligible</span>
                  </div>
                </div>

                {/* Seeded warning student 2 */}
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-300">
                      IS
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-white truncate">Isha Patel</span>
                      <span className="text-[10px] text-zinc-400 truncate">Roll: STU-UKG-002 • UKG</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs font-black text-amber-400">74.2% Att.</span>
                    <span className="text-[8px] font-bold text-amber-300 uppercase tracking-widest border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10">Warning</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Assigned Classes Grid Header */}
            <div className="flex flex-col gap-1.5 mt-2">
              <h4 className="text-lg font-bold text-zinc-300 uppercase tracking-widest pl-1">Student Attendance Registers</h4>
              <p className="text-xs text-zinc-500">Choose one of the classroom rolls below to roll call students</p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleClasses.map((item) => (
                <div
                  key={item.grade}
                  onClick={() => {
                    if (checkBlock.isBlocked) return;
                    setAttendanceType("student");
                    handleSelectClassCard(item.grade);
                  }}
                  className={`glass-card p-6 rounded-3xl flex flex-col gap-6 group relative overflow-hidden transition-all duration-300 ${
                    checkBlock.isBlocked 
                      ? "opacity-40 cursor-not-allowed border-white/5 bg-white/[0.01]" 
                      : `glass-card-hover cursor-pointer ${glowColors[item.color]}`
                  }`}
                >
                  {/* Decorative glow */}
                  {!checkBlock.isBlocked && (
                    <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-10 blur-xl group-hover:scale-150 transition-all duration-500`} />
                  )}

                  {/* Card Top */}
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-2xl ${colorClasses[item.color]} flex items-center justify-center border shadow-inner transition-colors duration-300`}>
                      {item.icon}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${badgeColors[item.color]}`}>
                      📍 {item.room}
                    </span>
                  </div>

                  {/* Card Title */}
                  <div className="flex flex-col gap-1 z-10">
                    <h3 className={`text-2xl font-extrabold text-white tracking-tight transition-colors ${!checkBlock.isBlocked ? "group-hover:text-cyan-400" : ""}`}>
                      {item.grade}
                    </h3>
                    <span className="text-xs text-zinc-400 font-semibold">
                      Subject: {item.subject}
                    </span>
                  </div>

                  {/* Card Action Button */}
                  <button
                    type="button"
                    disabled={checkBlock.isBlocked}
                    className={`glow-btn w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all duration-300 ${
                      checkBlock.isBlocked
                        ? "bg-zinc-800 opacity-50 cursor-not-allowed shadow-none"
                        : buttonColors[item.color]
                    }`}
                  >
                    {checkBlock.isBlocked ? "Marking Suspended" : "Mark Student Roll"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Step 1: Attendance History Tab */}
      {step === 1 && activeSubTab === "history" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative border-white/5">
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <h4 className="font-extrabold text-white">Submitted Attendance Registry History</h4>
              <p className="text-xs text-zinc-500 mt-1">Review verified historical attendance logs for classes and teachers.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-5">Calendar Date</th>
                    <th className="px-6 py-5">Roll Type</th>
                    <th className="px-6 py-5">Target Class / Department</th>
                    <th className="px-6 py-5 text-center">Present / Total</th>
                    <th className="px-6 py-5 text-center">Absent</th>
                    <th className="px-6 py-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-zinc-500 font-semibold text-sm">
                        No submitted attendance records found. Mark a class or teacher register to populate logs.
                      </td>
                    </tr>
                  ) : (
                    historyRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-6 py-5 font-mono text-xs font-semibold text-indigo-300">
                          {new Date(record.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            record.type === "student"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-sm text-zinc-300">
                          {record.class_grade}
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-emerald-400 text-sm">
                          {record.present_count} <span className="text-zinc-500 text-xs font-normal">/ {record.total_count}</span>
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-rose-400 text-sm">
                          {record.absent_count}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHistoryRecord(record);
                              setHistoryModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/5 text-xs text-zinc-400 hover:text-white hover:bg-white/10 font-bold transition-all"
                          >
                            View Registry
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Marking Attendance Screen */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Breadcrumb info panel */}
          <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-indigo-500/20 bg-indigo-500/5 shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Currently Marking</span>
              <h4 className="font-extrabold text-lg text-white">
                {attendanceType === "student" ? `${selectedClass} Student Roll Call` : "Active Staff Teacher Registry"}
              </h4>
              <span className="text-xs text-zinc-400 font-medium">
                Date: {new Date(attendanceDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
              >
                ← Back to Selection
              </button>
            </div>
          </div>

          {/* Mass action toggles control panel */}
          <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-2">Quick Register Toggles:</span>
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => attendanceType === "student" ? markAllStudents("present") : markAllTeachers("present")}
                className="px-5 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-bold hover:bg-emerald-500/15 text-xs transition-all uppercase tracking-wider text-center"
              >
                ✓ Mark All Present
              </button>
              <button
                type="button"
                onClick={() => attendanceType === "student" ? markAllStudents("absent") : markAllTeachers("absent")}
                className="px-5 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 font-bold hover:bg-rose-500/15 text-xs transition-all uppercase tracking-wider text-center"
              >
                ✗ Mark All Absent
              </button>
            </div>
          </div>

          {/* STUDENT Attendance Mode */}
          {attendanceType === "student" ? (
            <form onSubmit={handleSubmitAttendance} className="flex flex-col gap-6 animate-fade-in">
              <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <th className="px-6 py-5">Student Information</th>
                        <th className="px-6 py-5">Roll Number</th>
                        <th className="px-6 py-5">Class Grade</th>
                        <th className="px-6 py-5 text-center">Status Selection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {students.map((student) => (
                        <tr key={student.student_id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-300 font-bold uppercase">
                                {student.name.substring(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold text-white text-sm block group-hover:text-indigo-400 transition-colors">
                                  {student.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-mono text-xs text-indigo-300 font-semibold">
                            {student.roll_no}
                          </td>
                          <td className="px-6 py-5 font-medium text-sm text-zinc-300">
                            {selectedClass}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(student.student_id, "present")}
                                className={`px-5 py-2.5 rounded-xl border text-xs font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1.5 ${
                                  student.status === "present"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-inner"
                                    : "border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${student.status === "present" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                                Present
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(student.student_id, "absent")}
                                className={`px-5 py-2.5 rounded-xl border text-xs font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1.5 ${
                                  student.status === "absent"
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-inner"
                                    : "border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${student.status === "absent" ? "bg-rose-400 animate-pulse" : "bg-zinc-500"}`} />
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all text-center"
                >
                  ← Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="glow-btn px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Submitting Roll Call to Database...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Submit Attendance Registry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* TEACHER Attendance Mode (Admin Exclusive) */
            <form onSubmit={handleSubmitTeacherAttendance} className="flex flex-col gap-6 animate-fade-in">
              <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative border-cyan-500/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <th className="px-6 py-5">Teacher Information</th>
                        <th className="px-6 py-5">Department Subject</th>
                        <th className="px-6 py-5">Contact Number</th>
                        <th className="px-6 py-5 text-center">Status Selection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {teachers.map((teacher) => (
                        <tr key={teacher.teacher_id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-300 font-bold uppercase">
                                {teacher.name.substring(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold text-white text-sm block group-hover:text-cyan-400 transition-colors">
                                  {teacher.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-bold text-xs text-cyan-300 font-semibold">
                            {teacher.subject}
                          </td>
                          <td className="px-6 py-5 font-mono text-sm text-zinc-300">
                            {teacher.phone}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleTeacherStatusChange(teacher.teacher_id, "present")}
                                className={`px-5 py-2.5 rounded-xl border text-xs font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1.5 ${
                                  teacher.status === "present"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-inner"
                                    : "border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === "present" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                                Present
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTeacherStatusChange(teacher.teacher_id, "absent")}
                                className={`px-5 py-2.5 rounded-xl border text-xs font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1.5 ${
                                  teacher.status === "absent"
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-inner"
                                    : "border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === "absent" ? "bg-rose-400 animate-pulse" : "bg-zinc-500"}`} />
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all text-center"
                >
                  ← Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="glow-btn px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Submitting Staff Registry to Database...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Submit Teacher Attendance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* History Details Modal overlay */}
      {historyModalOpen && selectedHistoryRecord && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={`Roll Call Registry: ${selectedHistoryRecord.class_grade} (${new Date(selectedHistoryRecord.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })})`}
        >
          <div className="flex flex-col gap-5 select-none">
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-white/[0.01] border border-white/5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Size</span>
                <span className="text-lg font-extrabold text-white">{selectedHistoryRecord.total_count}</span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Present</span>
                <span className="text-lg font-extrabold text-emerald-400">{selectedHistoryRecord.present_count}</span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Absent</span>
                <span className="text-lg font-extrabold text-rose-400">{selectedHistoryRecord.absent_count}</span>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">{selectedHistoryRecord.type === "student" ? "Roll Number" : "Subject"}</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedHistoryRecord.roll_call?.map((member, i) => (
                    <tr key={i} className="text-xs">
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] uppercase font-bold ${
                          selectedHistoryRecord.type === 'student' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-cyan-500/10 text-cyan-300'
                        }`}>
                          {member.name.substring(0, 2)}
                        </div>
                        {member.name}
                      </td>
                      <td className="py-3 font-medium text-zinc-400 font-mono">
                        {selectedHistoryRecord.type === "student" ? member.roll_no : member.subject}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          member.status === "present"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="w-full py-3.5 rounded-xl border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all text-center"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
