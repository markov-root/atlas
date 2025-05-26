// src/components/Homepage/ActionCards.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Heart, ArrowRight } from 'lucide-react';
import styles from './ActionCards.module.css';

export default function ActionCards() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Small delay to let hero load first, then animate in
    const timer = setTimeout(() => setIsLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const stakeholderActions = [
    {
      id: 'learn',
      icon: BookOpen,
      label: 'Learn',
      description: 'Start with fundamentals',
      href: '/chapters/',
      primary: true
    },
    {
      id: 'teach',
      icon: GraduationCap,
      label: 'Teach',
      description: 'Get materials',
      href: '/teaching-resources',
      primary: false
    },
    {
      id: 'join',
      icon: Users,
      label: 'Join',
      description: 'Find groups',
      href: '/courses',
      primary: false
    },
    {
      id: 'support',
      icon: Heart,
      label: 'Support',
      description: 'Help us grow',
      href: '#funding',
      primary: false
    }
  ];

  return (
    <section className={styles.actionSection}>
      <div className={styles.container}>
        <div className={`${styles.actionGrid} ${isLoaded ? styles.loaded : ''}`}>
          {stakeholderActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={action.id}
                href={action.href}
                className={`${styles.actionCard} ${action.primary ? styles.primary : styles.secondary}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Icon className={styles.actionIcon} />
                <div className={styles.actionContent}>
                  <span className={styles.actionLabel}>{action.label}</span>
                  <span className={styles.actionDescription}>{action.description}</span>
                </div>
                <ArrowRight className={styles.actionArrow} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
