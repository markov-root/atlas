// src/pages/index.js
import React from 'react';
import Layout from '@theme/Layout';
import { 
  Hero, 
  Testimonials,
  Supporters
} from '../components/Homepage';

export default function Home() {
  return (
    <Layout
      title="AI Safety Atlas"
      description="A comprehensive guide to AI safety and alignment">
      <Hero />
      <Supporters />
      <Testimonials />
    </Layout>
  );
}
