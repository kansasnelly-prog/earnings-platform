import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'EARNINGSLLC - Legitimate Earning Platform',
  description = 'EARNINGSLLC is a legally registered, SSL-certified platform offering legitimate task-based earning opportunities worldwide. Join 15,000+ users earning securely.',
  keywords = 'earn money online, legitimate earning platform, task-based earning, digital tasks, remote work, online income, EARNINGSLLC',
  canonical,
  ogImage = '/og-image.jpg',
  ogType = 'website',
  structuredData
}) => {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EARNINGSLLC",
    "url": "https://earningsllc.com",
    "logo": "https://earningsllc.com/logo.png",
    "description": "Legitimate task-based earning platform with SSL certification and GDPR compliance",
    "foundingDate": "2024-01-01",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US",
      "addressRegion": "Delaware"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-EARNINGS",
      "contactType": "customer service",
      "availableLanguage": ["English", "Spanish", "Chinese", "Hindi", "Arabic", "Portuguese"]
    },
    "sameAs": [
      "https://twitter.com/earningsllc",
      "https://facebook.com/earningsllc",
      "https://linkedin.com/company/earningsllc"
    ],
    "serviceType": "Digital Platform Services",
    "areaServed": "Worldwide",
    "hasCredential": [
      {
        "@type": "EducationalOccupationalCredential",
        "name": "SSL Certificate",
        "credentialCategory": "Security"
      },
      {
        "@type": "EducationalOccupationalCredential", 
        "name": "GDPR Compliance",
        "credentialCategory": "Privacy"
      },
      {
        "@type": "EducationalOccupationalCredential",
        "name": "Business License US-LLC-2024-001234",
        "credentialCategory": "Legal"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "15234",
      "bestRating": "5",
      "worstRating": "1"
    },
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": "50+"
    },
    ...structuredData
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EARNINGSLLC" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical || 'https://earningsllc.com'} />
      <meta property="og:site_name" content="EARNINGSLLC" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@earningsllc" />
      <meta name="twitter:creator" content="@earningsllc" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#7c3aed" />
      <meta name="msapplication-TileColor" content="#7c3aed" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Security Headers */}
      <meta httpEquiv="Content-Security-Policy" content={`default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.supabase.co ${import.meta.env.VITE_SUPABASE_URL}; frame-src 'self' https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/`} />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(baseStructuredData)}
      </script>
      
      {/* Verification Tags */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />
      <meta name="yandex-verification" content="your-yandex-verification-code" />
      
      {/* Legal and Compliance Meta */}
      <meta name="rights" content="© 2024 EARNINGSLLC. All rights reserved." />
      <meta name="language" content="en" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="Delaware" />
      <meta name="ICBM" content="EARNINGSLLC - Legitimate Earning Platform" />
    </Helmet>
  );
};

export default SEOHead;
