// src/pages/courses.jsx
import React from 'react';
import Layout from '@theme/Layout';
import { CoursesHero } from '../components/Courses';
import SimpleCoursesListing from '../components/Courses/SimpleCoursesListing';
import CertificateSection from '../components/Courses/CertificateSection';
import StartCourseSection from '../components/Courses/StartCourseSection';
import coursesData from '../utils/coursesLoader';
import courseStartData from '../data/courses/course-start.json';
import styles from './courses.module.css';

export default function CoursesPage() {
  const pageData = coursesData.metadata?.page || coursesData.page;
  
  return (
    <Layout
      title={pageData.title}
      description={pageData.metaDescription}>
      
      {/* Hero Section - uses data from courses-metadata.json */}
      <CoursesHero heroData={coursesData.hero} />
      
      {/* Certificate Section - uses data from courses-metadata.json */}
      <CertificateSection certificateInfo={coursesData.certificateInfo} />
      
      {/* Courses Listing - uses organization data - STUDENTS SEE THIS FIRST */}
      <div className="container" style={{ padding: '3rem 0' }}>
        <SimpleCoursesListing coursesData={coursesData} />
      </div>

      {/* Start Your Own Course Section - for educators/organizers - NOW AT BOTTOM */}
      <StartCourseSection content={courseStartData} />
      
    </Layout>
  );
}
