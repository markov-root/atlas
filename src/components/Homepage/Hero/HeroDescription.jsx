// src/components/Homepage/Hero/HeroDescription.jsx
import React from 'react';
import styles from './HeroDescription.module.css';

export default function HeroDescription() {
  return (
    <div className={styles.descriptionArea}>
      <p className={styles.description}>
        Systematic explanations of AI safety concepts that accelerate understanding, 
        reduce research debt, and multiply impact across the entire community. 
        Every hour saved in understanding multiplies across hundreds of researchers and students.
      </p>
    </div>
  );
}
