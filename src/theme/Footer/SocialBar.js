// src/theme/Footer/SocialBar.js
import React from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import styles from './SocialBar.module.css';

export default function SocialBar() {
  const { footer } = useThemeConfig();
  
  // Find social links from footer.links - specifically search for the "Social" group
  const socialLinkGroup = footer?.links?.find(group => group.title === 'Social');
  
  // Use the items from the Social group only
  const socialLinks = socialLinkGroup?.items || [];

  // Skip rendering if no social links are found
  if (socialLinks.length === 0) {
    return null;
  }

  // Social icon components - using your actual SVG files
  const getIconByName = (name) => {
    // Extract name from label for icon matching
    const normalizedName = name.toLowerCase();
    
    if (normalizedName.includes('github')) {
      return <img src="/img/icons/github.svg" alt="GitHub" className={styles.icon} />;
    } else if (normalizedName.includes('twitter') || normalizedName.includes('x.com')) {
      return <img src="/img/icons/twitter.svg" alt="Twitter" className={styles.icon} />;
    } else if (normalizedName.includes('linkedin')) {
      return <img src="/img/icons/linkedin.svg" alt="LinkedIn" className={styles.icon} />;
    } else if (normalizedName.includes('youtube')) {
      return <img src="/img/icons/youtube.svg" alt="YouTube" className={styles.icon} />;
    } else {
      // Fallback to globe icon
      return <img src="/img/icons/globe.svg" alt={name} className={styles.icon} />;
    }
  };

  // Only render the social bar if we have social links
  return (
    <div className={styles.socialBar}>
      <div className={styles.socialContent}>
        <div className={styles.socialIcons}>
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
            >
              {getIconByName(link.label)}
              <span className={styles.srOnly}>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
