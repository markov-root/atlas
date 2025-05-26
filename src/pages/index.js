// src/pages/index.js
import React from 'react';
import Layout from '@theme/Layout';
import { 
  Hero, 
  ActionCards, 
  // Features, 
  // What,
  // Qualities,
  // Stats,
  Testimonials
} from '../components/Homepage';

export default function Home() {
  return (
    <Layout
      title="AI Safety Atlas"
      description="A comprehensive guide to AI safety and alignment">
      <Hero />
      <ActionCards />
      {/* <Features /> */}
      {/* <What /> */}
      {/* <Qualities /> */}
      {/* <Stats /> */}
      <Testimonials />
    </Layout>
  );
}
