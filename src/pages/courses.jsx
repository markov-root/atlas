// src/pages/courses.jsx
import React, { useState } from 'react';
import Layout from '@theme/Layout';
import {
  CoursesHero,
  OngoingCourses,
  UpcomingCourses,
  CourseDetailModal
} from '../components/Courses';
import coursesData from '../data/courses.json';

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleOpenCourse = (course) => {
    console.log("Selected course:", course);
    setSelectedCourse(course);
  };

  const handleCloseModal = () => {
    setSelectedCourse(null);
  };

  return (
    <Layout
      title="Courses Using AI Safety Atlas"
      description="Courses and study groups using AI Safety Atlas materials">
      
      {/* Hero Section - Now includes the Start Your Own Course CTA */}
      <CoursesHero />
      
      {/* Ongoing Courses Section */}
      <OngoingCourses 
        courses={coursesData.ongoing || []} 
        onOpenCourse={handleOpenCourse}
      />
      
      {/* Upcoming Courses Section */}
      <UpcomingCourses 
        courses={coursesData.upcoming || []} 
        onOpenCourse={handleOpenCourse}
      />
      
      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal 
          course={selectedCourse} 
          onClose={handleCloseModal} 
        />
      )}
    </Layout>
  );
}
