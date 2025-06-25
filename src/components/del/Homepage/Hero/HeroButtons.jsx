// src/components/Homepage/Hero/HeroButtons.jsx
import React from 'react';
import { ActionButtonTooltip } from '../../UI/Tooltip';
import styles from './HeroButtons.module.css';

export default function HeroButtons() {
  return (
    <div className={styles.buttonsArea}>
      <ActionButtonTooltip content="Explore explanations of AI safety concepts">
        <button className={styles.button}>
          <img src="/img/home/read.svg" alt="" className={styles.icon} />
          <span className={styles.buttonText}>Read textbook</span>
        </button>
      </ActionButtonTooltip>
      
      <ActionButtonTooltip content="Get materials to teach AI safety effectively">
        <button className={styles.button}>
          <img src="/img/home/facilitate.svg" alt="" className={styles.icon} />
          <span className={styles.buttonText}>Apply to courses</span>
        </button>
      </ActionButtonTooltip>
      
      <ActionButtonTooltip content="Support our mission and build AI safety knowledge infrastructure.">
        <button className={styles.button}>
          <img src="/img/home/support.svg" alt="" className={styles.icon} />
          <span className={styles.buttonText}>Support our work</span>
        </button>
      </ActionButtonTooltip>
    </div>
  );
}
