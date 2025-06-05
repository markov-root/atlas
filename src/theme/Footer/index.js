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
          <img src="/img/icons/copy.svg" alt="Copied" className={styles.copyIcon} />
        ) : (
          <img src="/img/icons/copy.svg" alt="Copy" className={styles.copyIcon} />
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
        {/* Line 1: Three columns - Atlas, CeSIA, Funders */}
        <div className={styles.footerTopRow}>
          {/* Atlas Column */}
          <div className={styles.atlasCol}>
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
              A comprehensive guide to AI safety and alignment research.
            </p>
          </div>

          {/* CeSIA Column */}
          <div className={styles.cesiaCol}>
            <div className={styles.cesiaContainer}>
              <a 
                href="https://www.securite-ia.fr/en" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.cesiaLink}
              >
                <img 
                  src="/img/supporters/cesia_text.svg" 
                  alt="French Center for AI Safety (CeSIA)" 
                  className={styles.cesiaLogo} 
                />
              </a>
              <p className={styles.cesiaDescription}>
                Leading research institute advancing AI safety and alignment in Europe.
              </p>
            </div>
          </div>

          {/* Funders Column */}
          <div className={styles.fundersCol}>
            <h3 className={styles.footerLinkHeading}>Funders</h3>
            <div className={styles.fundersList}>
              <a href="https://manifund.org/" target="_blank" rel="noopener noreferrer" className={styles.funderItem}>
                <img src="/img/supporters/manifund.svg" alt="Manifund" className={styles.funderLogo} />
                <span className={styles.funderName}>Manifund</span>
              </a>
              <a href="https://www.openphilanthropy.org/" target="_blank" rel="noopener noreferrer" className={styles.funderItem}>
                <img src="/img/supporters/open-philanthropy.svg" alt="Open Philanthropy" className={styles.funderLogo} />
                <span className={styles.funderName}>Open Philanthropy</span>
              </a>
            </div>
          </div>
        </div>

        {/* Line 2: Two columns - Citation, Contact */}
        <div className={styles.footerBottomRow}>
          {/* Citation Column */}
          <div className={styles.citationCol}>
            <h3 className={styles.footerLinkHeading}>Cite this work as</h3>
            <CitationBox />
          </div>
          
          {/* Contact Form Column */}
          <div className={styles.contactCol}>
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
