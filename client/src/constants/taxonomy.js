// Mirrors the SRS's Goal taxonomy (FR-GSM 1c) and subject classification list (FR-GSM 1d).

export const TAXONOMY_SUBTYPES = {
  protection: [
    'Notice/Awareness',
    'Choice/Consent',
    'Security/Integrity',
    'Access/Participation',
    'Enforcement/Redress',
  ],
  vulnerability: [
    'Information Monitoring',
    'Information Aggregation',
    'Information Storage',
    'Information Transfer',
    'Information Collection',
    'Information Personalization',
    'Contact',
  ],
};

export const SUBJECT_CLASSIFICATIONS = [
  'Business Aggregation',
  'Browsing Pattern/Site Usage',
  'CC Information',
  'Children',
  'Customer Information (CI)',
  'Contacting Customer',
  'Contact Institutions',
  'Cookies/Web bugs',
  'Customer System Information',
  'Customer Aggregation',
  'General Information',
  'General User Preference',
  'Identity Theft/Fraud',
  'Law (HIPAA, COPPA, GLBA)',
  'Liability/Responsibility',
  'OPT in/out preferences',
  'Personal Financial Information (PFI)',
  'Personal Health Information (PHI)',
  'Personally Identifiable Information (PII)',
  'PFI/PHI/PII Usage',
  'Policies/Procedures',
  'PP/ToU',
  'Security Access',
];

export const CLASSIFICATION_TYPE_LABELS = {
  policy_vs_scenario: 'Policy Goal vs. Scenario Goal',
  observable_vs_unobservable: 'Observable vs. Unobservable',
  protection_vs_vulnerability: 'Protection vs. Vulnerability',
};
