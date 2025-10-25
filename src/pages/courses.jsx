// src/pages/courses.jsx
// Updated to use new modular courses loader with all text from metadata
import React from 'react';
import Layout from '@theme/Layout';
import { CoursesHero } from '../components/Courses';
import SimpleCoursesListing from '../components/Courses/SimpleCoursesListing';
import CertificateSection from '../components/Courses/CertificateSection';
import StartCourseSection from '../components/Courses/StartCourseSection';
import coursesData from '../utils/coursesLoader';
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

      {/* Start Your Own Course Section - standalone, no data needed */}
      <StartCourseSection />
      
      {/* Courses Listing - uses organization data */}
      <div className="container" style={{ padding: '3rem 0' }}>
        <SimpleCoursesListing coursesData={coursesData} />
      </div>
      
    </Layout>
  );
}
