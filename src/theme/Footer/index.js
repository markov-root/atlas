// src/theme/Footer/index.js
import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useThemeConfig} from '@docusaurus/theme-common';
import styles from './styles.module.css';
import SocialBar from './SocialBar';
import {ContactForm} from './ContactForm';

function FooterLogo({src, srcDark, alt, width, height}) {
  const logoSrc = useBaseUrl(src);
  const logoSrcDark = srcDark ? useBaseUrl(srcDark) : null;
  
  return (
    <img 
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={styles.footerLogo}
      style={{
        // Ensure logo is visible in dark footer
        filter: 'brightness(0) invert(1)', // Make logo white on dark background
      }}
    />
  );
}

function Footer() {
  const {footer} = useThemeConfig();
  
  if (!footer) {
    return null;
  }

  const {copyright, links = [], logo = {}} = footer || {};

  return (
    <footer className={styles.footer}>
      {/* Social Bar */}
      <SocialBar />
      
      <div className={styles.footerContent}>
        <div className={styles.footerRow}>
          {/* Logo and Description */}
          <div className={styles.footerLogoCol}>
            {logo && logo.src && (
              <div className={styles.footerLogoWrapper}>
                {logo.href ? (
                  <Link
                    to={logo.href}
                    className={styles.footerLogoLink}
                  >
                    <FooterLogo
                      src={logo.src}
                      srcDark={logo.srcDark}
                      alt={logo.alt}
                      width={logo.width}
                      height={logo.height}
                    />
                  </Link>
                ) : (
                  <FooterLogo
                    src={logo.src}
                    srcDark={logo.srcDark}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                  />
                )}
              </div>
            )}
            <p className={styles.footerDescription}>
              A comprehensive guide to AI safety and alignment research,
              providing resources and knowledge for researchers and practitioners.
            </p>
          </div>
          
          {/* Links Columns */}
          {links && links.length > 0 && (
            <div className={styles.footerLinksWrapper}>
              {links.map((linkItem, i) => (
                <div key={i} className={styles.footerLinksCol}>
                  {linkItem.title != null ? (
                    <h3 className={styles.footerLinkHeading}>{linkItem.title}</h3>
                  ) : null}
                  {linkItem.items != null && Array.isArray(linkItem.items) && linkItem.items.length > 0 ? (
                    <ul className={styles.footerLinksList}>
                      {linkItem.items.map((item, key) => (
                        <li key={key} className={styles.footerLinksItem}>
                          <Link
                            className={styles.footerLink}
                            to={item.to}
                            href={item.href}
                            target={item.target}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          
          {/* Contact Form */}
          <div className={styles.footerContactCol}>
            <ContactForm />
          </div>
        </div>
        
        {/* Divider */}
        <div className={styles.footerDivider}>
          <div className={styles.footerDividerLine} />
        </div>
        
        {/* Copyright */}
        {copyright ? (
          <div className={styles.footerCopyright}>
            <div
              className={styles.footerCopyrightText}
              dangerouslySetInnerHTML={{
                __html: copyright,
              }}
            />
          </div>
        ) : null}
      </div>
    </footer>
  );
}

export default Footer;
