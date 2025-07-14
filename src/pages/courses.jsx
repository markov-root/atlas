// src/pages/courses.jsx - Updated to use your data structure
import React from 'react';
import Layout from '@theme/Layout';
import { CoursesHero } from '../components/Courses';
import SimpleCoursesListing from '../components/Courses/SimpleCoursesListing';
import CertificateSection from '../components/Courses/CertificateSection';
import StartCourseSection from '../components/Courses/StartCourseSection';
import coursesData from '../data/courses.json';
import styles from './courses.module.css';

export default function CoursesPage() {
  // Create certificate info from your data structure
  const certificateInfo = {
    available: true,
    sampleImage: "/img/courses/certificate.png",
    description: "Official LinkedIn certificates available for participants who complete course requirements.",
    requirements: [
      "Attend at least 6 out of 8 weekly sessions", 
      "Complete weekly readings and exercises", 
      "Participate actively in group discussions", 
      "Submit final project or equivalent contribution"
    ]
  };

  return (
    <Layout
      title="AI Safety Courses - AI Safety Atlas"
      description="Discover academic courses, reading groups, and organized programs using AI Safety Atlas materials worldwide.">
      
      {/* Hero Section */}
      <CoursesHero />
      
      {/* Certificate Section - Lead with this */}
      <CertificateSection certificateInfo={certificateInfo} />

      {/* Start Your Own Course Section */}
      <StartCourseSection />
      
      {/* Simple Courses Listing */}
      <div className="container" style={{ padding: '3rem 0' }}>
        <SimpleCoursesListing coursesData={coursesData} />
      </div>
      
      
    </Layout>
  );
}
