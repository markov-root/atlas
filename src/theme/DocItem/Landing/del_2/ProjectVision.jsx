// src/theme/DocItem/Landing/ProjectVision.jsx
import React from 'react';
import styles from './ProjectVision.module.css';

export default function ProjectVision() {
  return (
    <div className={styles.visionContainer}>
      <div className={styles.visionContent}>
        
        {/* Left Side - Question */}
        <div className={styles.questionSection}>
          <h2 className={styles.question}>
            What is the AI Safety Atlas?
          </h2>
        </div>
        
        {/* Right Side - Answer */}
        <div className={styles.answerSection}>
          <p className={styles.answer}>
            We transform scattered AI safety knowledge into systematic explanations. 
            The Atlas performs the essential interpretive labor—creating clear, connected pathways 
            through complex research so new contributors can understand and advance safety work 
            instead of spending months piecing together the landscape.
          </p>
          
        </div>
        
      </div>
    </div>
  );
}
