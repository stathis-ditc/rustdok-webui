import React from 'react';
import Link from 'next/link';
import styles from '../styles/Logo.module.css';

const Logo = ({ size = 'medium', linkEnabled = true }) => {
  // Size classes for different logo sizes
  const sizeClass = {
    small: styles.logoSmall,
    medium: styles.logoMedium,
    large: styles.logoLarge,
    xlarge: styles.logoXLarge
  }[size] || styles.logoMedium;

  const logoContent = (
    <div className={styles.logoWrapper}>
      {/* SVG Logo of a rusted crate in a dock */}
      <svg 
        viewBox="0 0 120 120" 
        xmlns="http://www.w3.org/2000/svg"
        className={styles.logoSvg}
      >
        {/* Dock/Water Background */}
        <rect x="0" y="80" width="120" height="40" fill="#2C3E50" />
        <path d="M0,80 C20,75 40,85 60,80 C80,75 100,85 120,80 L120,120 L0,120 Z" fill="#3498DB" opacity="0.6" />
        
        {/* Wooden Dock Planks */}
        <rect x="10" y="70" width="100" height="10" fill="#8B4513" />
        <rect x="10" y="70" width="100" height="2" fill="#A0522D" />
        <rect x="20" y="70" width="2" height="10" fill="#6B3E26" />
        <rect x="40" y="70" width="2" height="10" fill="#6B3E26" />
        <rect x="60" y="70" width="2" height="10" fill="#6B3E26" />
        <rect x="80" y="70" width="2" height="10" fill="#6B3E26" />
        <rect x="100" y="70" width="2" height="10" fill="#6B3E26" />
        
        {/* Rusted Crate - Main Box */}
        <g className={styles.rustCrate}>
          <rect x="30" y="25" width="60" height="45" fill="#B7410E" />
          
          {/* Rust Texture and Details */}
          <rect x="30" y="25" width="60" height="45" fill="url(#rustPattern)" />
          
          {/* Crate Edges */}
          <rect x="30" y="25" width="60" height="3" fill="#8B4513" />
          <rect x="30" y="67" width="60" height="3" fill="#8B4513" />
          <rect x="30" y="25" width="3" height="45" fill="#8B4513" />
          <rect x="87" y="25" width="3" height="45" fill="#8B4513" />
          
          {/* Rust Spots */}
          <circle cx="40" cy="35" r="4" fill="#8B4513" opacity="0.7" />
          <circle cx="80" cy="40" r="5" fill="#8B4513" opacity="0.6" />
          <circle cx="50" cy="60" r="6" fill="#8B4513" opacity="0.5" />
          <circle cx="70" cy="30" r="3" fill="#8B4513" opacity="0.8" />
          
          {/* Crate Slats */}
          <rect x="30" y="45" width="60" height="2" fill="#8B4513" />
          <rect x="50" y="25" width="2" height="45" fill="#8B4513" />
          <rect x="70" y="25" width="2" height="45" fill="#8B4513" />
          
          {/* Gear Icon (representing Rust programming language) */}
          <circle cx="60" cy="47" r="12" fill="#D35400" />
          <circle cx="60" cy="47" r="8" fill="#E67E22" />
          <circle cx="60" cy="47" r="4" fill="#F39C12" />
          
          {/* Gear Teeth */}
          <rect x="58" y="30" width="4" height="6" fill="#D35400" />
          <rect x="58" y="58" width="4" height="6" fill="#D35400" />
          <rect x="43" y="45" width="6" height="4" fill="#D35400" />
          <rect x="71" y="45" width="6" height="4" fill="#D35400" />
          
          {/* Diagonal Gear Teeth */}
          <rect x="47" y="35" width="5" height="4" transform="rotate(45, 49, 37)" fill="#D35400" />
          <rect x="68" y="56" width="5" height="4" transform="rotate(45, 70, 58)" fill="#D35400" />
          <rect x="47" y="56" width="5" height="4" transform="rotate(-45, 49, 58)" fill="#D35400" />
          <rect x="68" y="35" width="5" height="4" transform="rotate(-45, 70, 37)" fill="#D35400" />
        </g>
        
        {/* Reflection in water */}
        <g opacity="0.3">
          <rect x="30" y="80" width="60" height="20" fill="#B7410E" />
          <rect x="50" y="80" width="2" height="20" fill="#8B4513" />
          <rect x="70" y="80" width="2" height="20" fill="#8B4513" />
        </g>
        
        {/* Rope */}
        <path d="M90,50 Q95,45 90,40 Q85,35 90,30" stroke="#A0522D" strokeWidth="2" fill="none" />
        
        {/* Definitions for patterns */}
        <defs>
          <pattern id="rustPattern" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#B7410E" />
            <circle cx="5" cy="5" r="3" fill="#D35400" opacity="0.5" />
            <circle cx="2" cy="8" r="1" fill="#8B4513" opacity="0.7" />
            <circle cx="8" cy="2" r="1" fill="#8B4513" opacity="0.7" />
          </pattern>
        </defs>
      </svg>
      
      {/* Logo Text */}
      <div className={styles.logoText}>
        <span className={styles.rustText}>Rust</span>
        <span className={styles.dokText}>Dok</span>
      </div>
    </div>
  );

  // If linkEnabled is false, just return the logo content without the Link wrapper
  if (!linkEnabled) {
    return (
      <div className={`${styles.logoContainer} ${sizeClass}`}>
        {logoContent}
      </div>
    );
  }

  // Otherwise, wrap in a Link component
  return (
    <Link href="/" className={`${styles.logoContainer} ${sizeClass}`}>
      {logoContent}
    </Link>
  );
};

export default Logo; 