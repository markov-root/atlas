// src/pages/impact.jsx
import React from 'react';
import Layout from '@theme/Layout';
import Hero from '../components/Impact/Hero';
import Summary from '../components/Impact/Summary';
import Testimonials from '../components/Impact/Testimonials';
import Publications from '../components/Impact/Publications';
import Adoption from '../components/Impact/Adoption';
import styles from './impact.module.css';

export default function ImpactPage() {
  return (
    <Layout
      title="Impact - AI Safety Atlas"
      description="Impact and outcomes from AI Safety Atlas">
      
      <div className={styles.impactPageContainer}>
        {/* Hero Section */}
        <Hero />
        
        {/* Summary Section */}
        <Summary />

        {/* Testimonials Section */}
        <Testimonials />

        {/* Publications Section */}
        <Publications />
        
        {/* Adoption Section */}
        <Adoption />
      </div>
      
    </Layout>
  );
}
