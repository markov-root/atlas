// src/components/FAQ/FAQSection.jsx
import React from 'react';
import FAQItem from './FAQItem';
import styles from './FAQSection.module.css';

export default function FAQSection({ id, title, description, questions }) {
  return (
    <section className={styles.faqSection} id={id}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>

      {/* Questions List */}
      <div className={styles.questionsContainer}>
        {questions.map((question) => (
          <FAQItem
            key={question.id}
            id={question.id}
            question={question.question}
            shortAnswer={question.shortAnswer}
            detailedAnswer={question.detailedAnswer}
            isExpanded={false} // Start collapsed
          />
        ))}
      </div>
    </section>
  );
}
