// src/theme/Footer/index.js
import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useThemeConfig} from '@docusaurus/theme-common';
import styles from './styles.module.css';
import SocialBar from './SocialBar';
import {ContactForm} from './ContactForm';

function FooterLogo({src, alt, href}) {
  const logoSrc = useBaseUrl(src);
  
  const logoElement = (
    <img 
      src={logoSrc}
      alt={alt}
      className={styles.footerLogo}
    />
  );

  if (href) {
    return (
      <Link to={href} className={styles.footerLogoLink}>
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}

function CitationBox() {
  const [copied, setCopied] = useState(false);
  const citationText = "Markov Grey and Charbel-Raphael Segerie et al. 2024. AI Safety Atlas. French Center for AI Safety (CeSIA). ai-safety-atlas.com";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={styles.citationContainer}>
      <div className={styles.citationText}>
        {citationText}
      </div>
      <button onClick={handleCopy} className={styles.copyButton} title="Copy citation">
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    </div>
  );
}

function Footer() {
  const {footer} = useThemeConfig();
  
  if (!footer) {
    return null;
  }

  const {logo = {}} = footer || {};

  return (
    <footer className={styles.footer}>
      {/* Social Bar */}
      <SocialBar />
      
      <div className={styles.footerContent}>
        <div className={styles.footerRow}>
          {/* Logo and Description */}
          <div className={styles.footerLogoCol}>
            <div className={styles.footerLogoWrapper}>
              <div className={styles.footerLogoContainer}>
                <FooterLogo
                  src={logo.src}
                  alt={logo.alt}
                  href={logo.href}
                />
                <div className={styles.footerLogoText}>
                  AI SAFETY ATLAS
                </div>
              </div>
            </div>
            <p className={styles.footerDescription}>
              A comprehensive guide to AI safety and alignment research,
              providing resources and knowledge for researchers and practitioners.
            </p>
          </div>
          
          {/* Sponsors and Citation */}
          <div className={styles.footerLinksWrapper}>
            <div className={styles.footerLinksCol}>
              <h3 className={styles.footerLinkHeading}>Our Sponsors</h3>
              <div className={styles.sponsorsList}>
                <a href="https://www.securite-ia.fr/en" target="_blank" rel="noopener noreferrer" className={styles.sponsorItem}>
                  <img src="/img/supporters/cesia.svg" alt="CeSIA" className={styles.sponsorLogo} />
                  <span className={styles.sponsorName}>CeSIA</span>
                </a>
                <a href="https://manifund.org/" target="_blank" rel="noopener noreferrer" className={styles.sponsorItem}>
                  <img src="/img/supporters/manifund.svg" alt="Manifund" className={styles.sponsorLogo} />
                  <span className={styles.sponsorName}>Manifund</span>
                </a>
                <a href="https://www.openphilanthropy.org/" target="_blank" rel="noopener noreferrer" className={styles.sponsorItem}>
                  <img src="/img/supporters/open-philanthropy.svg" alt="Open Philanthropy" className={styles.sponsorLogo} />
                  <span className={styles.sponsorName}>Open Philanthropy</span>
                </a>
              </div>
            </div>

            <div className={styles.footerLinksCol}>
              <h3 className={styles.footerLinkHeading}>Cite this work as</h3>
              <CitationBox />
            </div>
          </div>
          
          {/* Contact Form */}
          <div className={styles.footerContactCol}>
            <ContactForm />
          </div>
        </div>
        
        {/* Divider */}
        <div className={styles.footerDivider}>
          <div className={styles.footerDividerLine} />
        </div>
        
        {/* Copyright and Analytics - Below the line */}
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomItem}>
            <strong>Copyright:</strong> © 2025 • Text Content: <Link href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" className={styles.licenseLink}>CC BY-SA 4.0</Link> • Code: <Link href="https://opensource.org/licenses/MIT" target="_blank" className={styles.licenseLink}>MIT</Link>
          </div>
          <div className={styles.footerBottomItem}>
            <strong>Analytics:</strong> We use privacy-focused <Link href="https://plausible.io/" target="_blank" className={styles.licenseLink}>Plausible</Link> instead of Google Analytics. No cookies, fully GDPR/CCPA compliant. :)
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
