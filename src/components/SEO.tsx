import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

const APP_NAME = "DentaCare";
const DEFAULT_DESCRIPTION = "Professional dental clinic management system for appointments, patient records, prescriptions, and payments.";
const DEFAULT_KEYWORDS = "dental clinic, dentist, appointments, patient management, healthcare, medical records";
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogImage = "/og-image.png",
  ogType = "website",
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const canonical = canonicalUrl || (typeof window !== "undefined" ? window.location.href : "");

  // Default structured data for organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: APP_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    medicalSpecialty: "Dentistry",
    priceRange: "$$",
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={APP_NAME} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
};

// Pre-configured SEO components for common pages
export const DashboardSEO = () => (
  <SEO
    title="Dashboard"
    description="View your dental clinic dashboard with appointment statistics, patient overview, and revenue tracking."
    noIndex
  />
);

export const AppointmentsSEO = () => (
  <SEO
    title="Appointments"
    description="Manage dental appointments, schedule patient visits, and track appointment status."
    noIndex
  />
);

export const PatientsSEO = () => (
  <SEO
    title="Patients"
    description="Manage patient records, medical history, and contact information."
    noIndex
  />
);

export const PaymentsSEO = () => (
  <SEO
    title="Payments"
    description="Track payments, generate invoices, and manage billing for dental services."
    noIndex
  />
);

export const InventorySEO = () => (
  <SEO
    title="Inventory"
    description="Manage dental clinic inventory, supplies, and equipment."
    noIndex
  />
);

export const ProfileSEO = () => (
  <SEO
    title="My Profile"
    description="View and manage your patient profile, appointments, and medical records."
    noIndex
  />
);

export const BookAppointmentSEO = () => (
  <SEO
    title="Book Appointment"
    description="Schedule a dental appointment with our experienced dental professionals."
    keywords="book dental appointment, dentist appointment, dental checkup"
  />
);

export const AuthSEO = () => (
  <SEO
    title="Sign In"
    description="Sign in to your DentaCare account to manage appointments and access your dental records."
  />
);
