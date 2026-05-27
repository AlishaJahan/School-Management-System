"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

const defaultDummyStudents = [
  { student_id: 1, name: "Rahul Verma", email: "rahul@school.com", roll_no: "STU-2026-001", class_grade: "Class 10-A", status: "active", enrollment_date: "2026-04-01" },
  { student_id: 2, name: "Sana Khan", email: "sana@school.com", roll_no: "STU-2026-002", class_grade: "Class 12-B", status: "active", enrollment_date: "2026-04-02" },
  { student_id: 3, name: "Priya Sharma", email: "priya@school.com", roll_no: "STU-2026-003", class_grade: "Class 10-A", status: "active", enrollment_date: "2026-04-01" },
  { student_id: 4, name: "Amit Patel", email: "amit@school.com", roll_no: "STU-2026-004", class_grade: "Class 10-A", status: "active", enrollment_date: "2026-04-01" },
  { student_id: 5, name: "Sneha Reddy", email: "sneha@school.com", roll_no: "STU-2026-005", class_grade: "Class 10-A", status: "active", enrollment_date: "2026-04-01" },
  { student_id: 6, name: "Vikram Singh", email: "vikram@school.com", roll_no: "STU-2026-006", class_grade: "Class 10-A", status: "active", enrollment_date: "2026-04-01" },
  { student_id: 7, name: "Aarav Mehta", email: "aarav@school.com", roll_no: "STU-2026-007", class_grade: "Class 12-B", status: "active", enrollment_date: "2026-04-02" },
  { student_id: 8, name: "Diya Iyer", email: "diya@school.com", roll_no: "STU-2026-008", class_grade: "Class 12-B", status: "active", enrollment_date: "2026-04-02" },
  { student_id: 9, name: "Kabir Sen", email: "kabir@school.com", roll_no: "STU-2026-009", class_grade: "Class 12-B", status: "active", enrollment_date: "2026-04-02" },
  { student_id: 10, name: "Neha Gupta", email: "neha@school.com", roll_no: "STU-2026-010", class_grade: "Class 12-B", status: "active", enrollment_date: "2026-04-02" },
  { student_id: 11, name: "Rohan Das", email: "rohan@school.com", roll_no: "STU-2026-011", class_grade: "Class 11-A", status: "active", enrollment_date: "2026-04-03" },
  { student_id: 12, name: "Ananya Roy", email: "ananya@school.com", roll_no: "STU-2026-012", class_grade: "Class 11-A", status: "active", enrollment_date: "2026-04-03" },
  { student_id: 13, name: "Yash Malhotra", email: "yash@school.com", roll_no: "STU-2026-013", class_grade: "Class 11-A", status: "active", enrollment_date: "2026-04-03" },
  { student_id: 14, name: "Tanvi Shah", email: "tanvi@school.com", roll_no: "STU-2026-014", class_grade: "Class 11-A", status: "active", enrollment_date: "2026-04-03" },
  { student_id: 15, name: "Abhinav Mishra", email: "abhinav@school.com", roll_no: "STU-2026-015", class_grade: "Class 11-A", status: "active", enrollment_date: "2026-04-03" }
];

export default function StudentsManagement() {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("students_cache");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return defaultDummyStudents;
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 2-Step Workflow: 1 = Class Cards Selection, 2 = Students List & Actions
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState("LKG");

  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roll_no: "",
    class_grade: "",
    enrollment_date: new Date().toISOString().split("T")[0],
    status: "active"
  });

  // Assigned classes list - Configured for LKG to Class 12 (Only 11th & 12th have sections)
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

  const fetchAllStudents = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllStudents(data);
        localStorage.setItem("students_cache", JSON.stringify(data));
        
        // Update dashboard cache too
        const cachedCounts = localStorage.getItem("dashboard_counts");
        let updatedCounts = { students: data.length, teachers: 4 };
        if (cachedCounts) {
          try {
            const parsed = JSON.parse(cachedCounts);
            updatedCounts = { ...parsed, students: data.length };
          } catch (e) {}
        }
        localStorage.setItem("dashboard_counts", JSON.stringify(updatedCounts));
      }
    } catch (err) {
      console.log("Failed to fetch all students, using cached/mock list.");
    }
  };

  const getStudentCountForClass = (className) => {
    return allStudents.filter(student => {
      const studentClass = student.class_grade.toLowerCase();
      const target = className.toLowerCase();
      if (target === "class 10") {
        return studentClass === "class 10" || studentClass === "class 10-a";
      }
      return studentClass === target;
    }).length;
  };

  const fetchStudents = async (searchTerm = "") => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const url = searchTerm
        ? `http://localhost:5000/api/students?search=${encodeURIComponent(searchTerm)}`
        : "http://localhost:5000/api/students";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch student list");
      
      // Filter students by selected class grade to display class-wise data
      const classFiltered = data.filter(student => {
        const studentClass = student.class_grade.toLowerCase();
        const selected = selectedClass.toLowerCase();
        if (selected === "class 10") {
          return studentClass === "class 10" || studentClass === "class 10-a";
        }
        return studentClass === selected;
      });
      setStudents(classFiltered);
    } catch (err) {
      setError(err.message || "Failed to connect to database. Loading dummy student rolls.");
      
      const classFiltered = allStudents.filter(student => {
        const studentClass = student.class_grade.toLowerCase();
        const selected = selectedClass.toLowerCase();
        
        let match = false;
        if (selected === "class 10") {
          match = studentClass === "class 10" || studentClass === "class 10-a";
        } else {
          match = studentClass === selected;
        }

        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          match = match && (
            student.name.toLowerCase().includes(s) ||
            student.email.toLowerCase().includes(s) ||
            student.roll_no.toLowerCase().includes(s)
          );
        }
        return match;
      });

      if (classFiltered.length === 0 && !searchTerm) {
        const safeKey = selectedClass.toLowerCase().replace(/[^a-z0-9]/g, "");
        const rollKey = selectedClass.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const seeded = [
          { student_id: Date.now() + 1, name: `Aarav Sharma (${selectedClass})`, email: `aarav.${safeKey}@school.com`, roll_no: `STU-${rollKey}-001`, class_grade: selectedClass, status: "active", enrollment_date: "2026-04-01" },
          { student_id: Date.now() + 2, name: `Isha Patel (${selectedClass})`, email: `isha.${safeKey}@school.com`, roll_no: `STU-${rollKey}-002`, class_grade: selectedClass, status: "active", enrollment_date: "2026-04-01" },
          { student_id: Date.now() + 3, name: `Rohan Verma (${selectedClass})`, email: `rohan.${safeKey}@school.com`, roll_no: `STU-${rollKey}-003`, class_grade: selectedClass, status: "active", enrollment_date: "2026-04-01" },
          { student_id: Date.now() + 4, name: `Diya Rao (${selectedClass})`, email: `diya.${safeKey}@school.com`, roll_no: `STU-${rollKey}-004`, class_grade: selectedClass, status: "active", enrollment_date: "2026-04-01" },
          { student_id: Date.now() + 5, name: `Kabir Singh (${selectedClass})`, email: `kabir.${safeKey}@school.com`, roll_no: `STU-${rollKey}-005`, class_grade: selectedClass, status: "active", enrollment_date: "2026-04-01" }
        ];
        
        const updatedAll = [...allStudents, ...seeded];
        setAllStudents(updatedAll);
        localStorage.setItem("students_cache", JSON.stringify(updatedAll));
        setStudents(seeded);
      } else {
        setStudents(classFiltered);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(search);
    fetchAllStudents();
  }, [selectedClass]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearch(term);
    fetchStudents(term);
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData({
      name: "",
      email: "",
      password: "",
      roll_no: "",
      class_grade: selectedClass, // Auto-assign the selected class!
      enrollment_date: new Date().toISOString().split("T")[0],
      status: "active"
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setModalMode("edit");
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: "", 
      roll_no: student.roll_no,
      class_grade: student.class_grade,
      enrollment_date: student.enrollment_date ? student.enrollment_date.split("T")[0] : "",
      status: student.status
    });
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      let res;
      let data;

      if (modalMode === "add") {
        res = await fetch("http://localhost:5000/api/students", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`http://localhost:5000/api/students/${selectedStudent.student_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      }

      data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process record");

      setSuccess(modalMode === "add" ? "Student registered successfully!" : "Student profile updated successfully!");
      setModalOpen(false);
      fetchStudents(search);
      fetchAllStudents();

      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      if (err.message.includes("Failed to connect") || err.message.includes("fetch") || err.message.includes("NetworkError")) {
        // Fallback local operations
        if (modalMode === "add") {
          const newStudent = {
            student_id: Date.now(),
            name: formData.name,
            email: formData.email,
            roll_no: formData.roll_no,
            class_grade: formData.class_grade,
            status: "active",
            enrollment_date: formData.enrollment_date
          };
          const updatedAll = [newStudent, ...allStudents];
          setAllStudents(updatedAll);
          localStorage.setItem("students_cache", JSON.stringify(updatedAll));
        } else {
          const updatedAll = allStudents.map(s => 
            s.student_id === selectedStudent.student_id
              ? { ...s, name: formData.name, email: formData.email, roll_no: formData.roll_no, class_grade: formData.class_grade, status: formData.status }
              : s
          );
          setAllStudents(updatedAll);
          localStorage.setItem("students_cache", JSON.stringify(updatedAll));
        }
        setSuccess(modalMode === "add" ? "Student registered locally successfully!" : "Student profile updated locally successfully!");
        setModalOpen(false);
        setTimeout(() => {
          fetchStudents(search);
          fetchAllStudents();
        }, 100);
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(err.message || "Operation failed.");
      }
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;

    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete student record");

      setSuccess("Student record successfully deleted.");
      fetchStudents(search);
      fetchAllStudents();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      if (err.message.includes("Failed to connect") || err.message.includes("fetch") || err.message.includes("NetworkError")) {
        const updatedAll = allStudents.filter(s => s.student_id !== id);
        setAllStudents(updatedAll);
        localStorage.setItem("students_cache", JSON.stringify(updatedAll));
        setSuccess("Student record successfully deleted locally.");
        setTimeout(() => {
          fetchStudents(search);
          fetchAllStudents();
        }, 100);
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(err.message || "Failed to delete student.");
      }
    }
  };

  const handleSelectClassCard = (className) => {
    setSelectedClass(className);
    setSearch("");
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

  const buttonColors = {
    indigo: "bg-indigo-500 hover:bg-indigo-600",
    cyan: "bg-cyan-500 hover:bg-cyan-600",
    violet: "bg-violet-500 hover:bg-violet-600"
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Top Title Section */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Student Enrollment Registry</h2>
        <p className="text-zinc-400 text-sm">Manage class grades, roll assignments, and registry directories</p>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {error && !error.includes("Failed to connect") && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm font-semibold animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Assigned Class Cards Grid (Selection Screen) */}
      {step === 1 && (
        <div className="flex flex-col gap-6 animate-fade-in mt-4">
          <div className="flex flex-col gap-1.5 pl-1">
            <h4 className="text-lg font-bold text-zinc-300 uppercase tracking-widest">Select Class to Manage Students</h4>
            <p className="text-xs text-zinc-500">Choose one of your assigned classroom blocks to open its student records registry</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            {assignedClasses.map((item) => (
              <div
                key={item.grade}
                onClick={() => handleSelectClassCard(item.grade)}
                className={`glass-card glass-card-hover p-6 rounded-3xl flex flex-col gap-6 cursor-pointer group relative overflow-hidden ${glowColors[item.color]}`}
              >
                {/* Decorative glow */}
                <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-10 blur-xl group-hover:scale-150 transition-all duration-500`} />

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
                  <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                    {item.grade}
                  </h3>
                  <div className="flex flex-col gap-0.5 text-xs text-zinc-400 font-semibold">
                    <span>Subject: {item.subject}</span>
                    <span className="text-[11px] text-zinc-300 font-bold mt-1.5 flex items-center gap-1.5 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5 w-fit">
                      🎓 {getStudentCountForClass(item.grade)} Enrolled
                    </span>
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  type="button"
                  className={`glow-btn w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all duration-300 ${buttonColors[item.color]}`}
                >
                  Manage Students
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Manage Students Table & Actions */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Breadcrumb info panel */}
          <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-indigo-500/20 bg-indigo-500/5 shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Active Workspace</span>
              <h4 className="font-extrabold text-lg text-white">
                Managing {selectedClass} Students
              </h4>
              <span className="text-xs text-zinc-400 font-medium">
                Double-click records to review school profiles, edit roll keys, or register new students.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
              >
                ← Back to classes
              </button>

              <button
                onClick={handleOpenAddModal}
                className="glow-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Register Student</span>
              </button>
            </div>
          </div>

          {/* Search bar control panel */}
          <div className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search students by name, email, roll ID..."
                value={search}
                onChange={handleSearchChange}
                className="glass-input pl-11 pr-4 py-3.5 text-sm font-medium w-full"
              />
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold pr-2">
                <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Querying...</span>
              </div>
            )}
          </div>

          {/* Students Data Table */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-5">Student Information</th>
                    <th className="px-6 py-5">Roll ID</th>
                    <th className="px-6 py-5">Class Grade</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Enrollment Date</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-zinc-500 font-semibold text-sm">
                        No student records matching filters found in {selectedClass}.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-300 font-bold uppercase">
                              {student.name.substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-white text-sm block group-hover:text-indigo-400 transition-colors">
                                {student.name}
                              </span>
                              <span className="text-xs text-zinc-400 block">{student.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-indigo-300 font-semibold">
                          {student.roll_no}
                        </td>
                        <td className="px-6 py-5 font-medium text-sm text-zinc-300">
                          {student.class_grade}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              student.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${student.status === "active" ? "bg-emerald-400" : "bg-rose-400"}`} />
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-zinc-400 text-xs font-semibold">
                          {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/5 bg-white/5 text-zinc-300 hover:text-white hover:bg-indigo-500 hover:border-indigo-400 transition-all"
                              title="Edit Student Record"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.student_id)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center border border-rose-500/10 bg-rose-500/5 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-400 transition-all"
                              title="Delete Student Record"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-xs font-bold"
            >
              ← Back to Classroom Selections
            </button>
          </div>
        </div>
      )}

      {/* Create / Update Student Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "add" ? "Register New Student Account" : "Modify Student Records"}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Rahul Verma"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g. rahul@school.com"
              className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              required
            />
          </div>

          {modalMode === "add" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Initial Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank for standard 'student123'"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Roll ID</label>
              <input
                type="text"
                name="roll_no"
                value={formData.roll_no}
                onChange={handleInputChange}
                placeholder="e.g. STU-2026-003"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Class Grade</label>
              <input
                type="text"
                name="class_grade"
                value={formData.class_grade}
                onChange={handleInputChange}
                placeholder="e.g. Class 10-A"
                className="glass-input px-4 py-3.5 text-sm w-full font-medium"
                disabled // Class grade is disabled during creation to enforce class-wise integrity!
                required
              />
            </div>
          </div>

          {modalMode === "add" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Enrollment Date</label>
              <input
                type="date"
                name="enrollment_date"
                value={formData.enrollment_date}
                onChange={handleInputChange}
                className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white appearance-none"
                required
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Academic Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="glass-input px-4 py-3.5 text-sm w-full font-medium text-white appearance-none"
              >
                <option value="active" className="bg-[#09090b]">Active Status</option>
                <option value="suspended" className="bg-[#09090b]">Suspended Status</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:opacity-95"
            >
              {modalMode === "add" ? "Submit Registration" : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
