// src/theme/Footer/ContactForm.js
import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './ContactForm.module.css';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    // Create a mailto link as a simple way to handle the form submission
    const mailtoLink = `mailto:contact@aisafetyatlas.com?subject=Contact Form: ${formData.name}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
    setStatus('sent');
    
    // Reset form after submission
    setFormData({
      name: '',
      email: '',
      message: ''
    });

    // Clear the status after a delay
    setTimeout(() => setStatus(''), 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.contactForm}>
      <h3 className={styles.contactHeading}>Get in Touch</h3>
      <p className={styles.contactDescription}>
        Have questions about AI safety or want to contribute? Send us a message.
      </p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={styles.formControl}
              placeholder="Your name"
            />
          </div>

          <div className={styles.formGroup}>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.formControl}
              placeholder="Your email"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="3"
            className={styles.formControl}
            placeholder="Your message"
          />
        </div>

        <button 
          type="submit" 
          className={clsx(
            styles.submitButton,
            {
              [styles.sending]: status === 'sending',
              [styles.sent]: status === 'sent'
            }
          )}
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Sending...' : 
           status === 'sent' ? 'Message Sent!' : 
           'Send Message'}
        </button>
      </form>
    </div>
  );
}

function StayCoordinated() {
  const ConnectButton = ({ icon, title, subtitle, href }) => (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.connectButton}
    >
      <div className={styles.connectIcon}>{icon}</div>
      <span className={styles.connectSubtitle}>{subtitle}</span>
      <span className={styles.connectTitle}>{title}</span>
    </a>
  );

  return (
    <div className={styles.stayCoordinated}>
      <h3 className={styles.coordinatedHeading}>Stay Coordinated</h3>
      <p className={styles.coordinatedDescription}>Connect with us and join our community</p>
      
      <div className={styles.connectButtons}>
        <ConnectButton
          icon={
            <svg viewBox="0 0 24 24" className={styles.buttonIcon} fill="none" stroke="currentColor">
              <path d="M19 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V8h14v12z" />
            </svg>
          }
          title="Calendar"
          subtitle="View Our"
          href="#"
        />

        <ConnectButton
          icon={
            <svg viewBox="0 0 24 24" className={styles.buttonIcon} fill="none" stroke="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" />
            </svg>
          }
          title="Streams"
          subtitle="Join Our"
          href="#"
        />

        <ConnectButton
          icon={
            <svg viewBox="0 0 24 24" className={styles.buttonIcon} fill="none" stroke="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          }
          title="Email"
          subtitle="Send Us"
          href="mailto:contact@aisafetyatlas.com"
        />
      </div>
    </div>
  );
}

export { ContactForm, StayCoordinated };
