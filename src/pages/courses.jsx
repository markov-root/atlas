// src/pages/courses.jsx
import React from 'react';
import Layout from '@theme/Layout';
import { CoursesHero, CoursesList } from '../components/Courses';
import coursesData from '../data/courses.json';

export default function CoursesPage() {
  // Use the simplified courses structure
  const allCourses = coursesData.courses || [];

  return (
    <Layout
      title="Courses Using AI Safety Atlas"
      description="Courses and study groups using AI Safety Atlas materials">
      
      {/* Hero Section */}
      <CoursesHero />
      
      {/* Single Unified Courses List */}
      <div className="container" style={{ padding: '4rem 0' }}>
        <CoursesList courses={allCourses} />
      </div>
      
    </Layout>
  );
}
