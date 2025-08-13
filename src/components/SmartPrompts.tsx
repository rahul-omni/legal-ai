import { useState } from 'react';
import { Copy } from 'lucide-react';

interface SmartPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'Agreements' | 'Legal Notices' | 'Court Documents' | 'Other' | 'Corporate';
}

const SMART_PROMPTS: SmartPrompt[] = [
  // Agreements Category
  {
    id: 'rent-agreement',
    title: 'Rental Agreement',
    description: 'Comprehensive residential rental agreement with standard clauses',
    category: 'Agreements',
    prompt: `Create a detailed residential rental agreement in 1500 words with the following sections. Return the response in HTML markup with appropriate heading tags (h1, h2, h3), paragraphs (p), and lists (ul, ol) where needed:

1. Parties and Property Details
2. Term of Tenancy
3. Rent and Security Deposit
4. Utilities and Maintenance
5. Use of Property and Restrictions
6. Rights and Obligations of Both Parties
7. Insurance and Liability
8. Termination and Notice Period
9. Return of Security Deposit
10. Governing Law and Dispute Resolution

Make it legally binding and include all standard protective clauses for both landlord and tenant.

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },
  {
    id: 'share-purchase',
    title: 'Share Purchase Agreement',
    description: 'Detailed agreement for purchase of company shares',
    category: 'Agreements',
    prompt: `Draft a comprehensive share purchase agreement with the following sections. Return the response in proper HTML markup:

1. Parties and Recitals
2. Definitions and Interpretation
3. Sale and Purchase of Shares
4. Purchase Price and Payment Terms
5. Conditions Precedent
6. Representations and Warranties
7. Covenants and Undertakings
8. Indemnification
9. Confidentiality
10. Governing Law and Jurisdiction
11. Dispute Resolution
12. Notices and Communications
13. Assignment and Succession
14. Force Majeure
15. Entire Agreement and Amendments

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling

Include all necessary protective clauses and ensure comprehensive coverage of share transfer terms.`
  },
  {
    id: 'employment',
    title: 'Employment Agreement',
    description: 'Standard employment contract with key terms',
    category: 'Agreements',
    prompt: `Create an employment agreement with the following sections. Return the response in proper HTML markup:

1. Job Description and Duties
2. Compensation and Benefits
3. Work Hours and Location
4. Probation Period
5. Leave Policy
6. Intellectual Property Rights
7. Non-Compete and Non-Solicitation
8. Confidentiality
9. Termination Clauses
10. Dispute Resolution

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },

  // Court Documents Category
  {
    id: 'writ-petition',
    title: 'Writ Petition',
    description: 'Constitutional writ petition under Article 226/32',
    category: 'Court Documents',
    prompt: `Draft a writ petition with the following sections. Return the response in proper HTML markup:

1. Jurisdiction and Maintainability
2. Facts of the Case
3. Grounds for Filing
4. Constitutional Rights Violated
5. Previous Representations
6. Urgency and Interim Relief
7. Prayers and Relief Sought
8. List of Dates/Synopsis
9. Supporting Precedents
10. Grounds for Constitutional Remedy

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },
  {
    id: 'slp',
    title: 'Special Leave Petition',
    description: 'SLP for Supreme Court appeal',
    category: 'Court Documents',
    prompt: `Draft a Special Leave Petition with the following sections. Return the response in proper HTML markup:

1. Jurisdiction and Limitation
2. Facts of the Case
3. Questions of Law
4. Grounds for Special Leave
5. Order/Judgment Challenged
6. Previous Litigation History
7. Delay Condonation (if applicable)
8. Interim Relief Sought
9. Main Prayers
10. List of Dates/Events

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },
  {
    id: 'criminal-petition',
    title: 'Criminal Petition',
    description: 'Petition for criminal proceedings',
    category: 'Court Documents',
    prompt: `Draft a criminal petition with the following sections. Return the response in proper HTML markup:

1. Jurisdiction Details
2. Accused/Petitioner Details
3. Nature of Offense
4. Facts and Circumstances
5. Investigation Details
6. Legal Grounds
7. Previous Proceedings
8. Relief Sought
9. Supporting Evidence
10. Prayer Clause

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },

  // Legal Notices Category
  {
    id: 'payment-default',
    title: 'Payment Default Notice',
    description: 'Notice for recovery of pending payments',
    category: 'Legal Notices',
    prompt: `Draft a payment default notice with the following sections. Return the response in proper HTML markup:

1. Sender and Recipient Details
2. Subject Matter
3. Outstanding Amount Details
4. Payment History
5. Legal Obligations
6. Demand for Payment
7. Timeline for Compliance
8. Consequences of Non-payment
9. Mode of Payment
10. Jurisdiction

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },
  {
    id: 'cease-desist',
    title: 'Cease and Desist Notice',
    description: 'Notice to stop infringing activities',
    category: 'Legal Notices',
    prompt: `Create a cease and desist notice with the following sections. Return the response in proper HTML markup:

1. Sender's Rights/Ownership
2. Infringement Details
3. Demand to Cease Activity
4. Timeline for Compliance
5. Legal Consequences
6. Compensation Demanded
7. Undertaking Required
8. Jurisdiction Details

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },

  // Corporate Documents
  {
    id: 'shareholders-agreement',
    title: 'Shareholders Agreement',
    description: 'Agreement between company shareholders',
    category: 'Corporate',
    prompt: `Draft a shareholders agreement with the following sections. Return the response in proper HTML markup:

1. Parties and Definitions
2. Share Ownership Structure
3. Management and Control
4. Transfer Restrictions
5. Tag-Along and Drag-Along Rights
6. Pre-emptive Rights
7. Board Composition
8. Reserved Matters
9. Exit Provisions
10. Dispute Resolution

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },
  {
    id: 'term-sheet',
    title: 'Investment Term Sheet',
    description: 'Term sheet for investment transaction',
    category: 'Corporate',
    prompt: `Create an investment term sheet with the following sections. Return the response in proper HTML markup:

1. Investment Amount and Valuation
2. Investment Structure
3. Board Composition
4. Voting Rights
5. Anti-dilution Protection
6. Liquidation Preference
7. Information Rights
8. Exit Rights
9. Conditions Precedent
10. Binding Terms

Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling`
  },

  // Add more categories and prompts...
  {
    id: 'line-spacing',
    title: 'Add Line Breaks',
    description: 'Add proper line spacing between paragraphs and sections',
    category: 'Other',
    prompt: `Please format the text by:

1. Adding a blank line between paragraphs
2. Adding two blank lines before each major section heading
3. Adding one blank line after each heading
4. Adding appropriate line breaks after each list item
5. Ensuring consistent spacing throughout the document

Format the response with proper HTML markup:
- Use <br /> for single line breaks
- Use multiple <br /> tags or paragraph tags <p> for larger spacing
- Maintain all existing formatting and content
- Only modify the spacing between elements

Example:
First paragraph text here.
<br /><br />
Second paragraph text here.
<br /><br />
<h2>Major Section</h2>
<br />
Section content here.`
  },
];

// Update the category list in the component
const CATEGORIES = [
  'Agreements',
  'Court Documents',
  'Legal Notices',
  'Corporate',
  'Other'
] as const;

type Category = typeof CATEGORIES[number];

export function SmartPrompts() {
  const [selectedCategory, setSelectedCategory] = useState<SmartPrompt['category']>('Agreements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<SmartPrompt | null>(null);

  const filteredPrompts = SMART_PROMPTS.filter(prompt => 
    (prompt.category === selectedCategory) &&
    (searchQuery === '' || 
     prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     prompt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search prompts..."
          className="w-full px-3 py-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 p-4 border-b overflow-x-auto">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap
              ${selectedCategory === category 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedPrompt ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">{selectedPrompt.title}</h3>
              <button 
                onClick={() => setSelectedPrompt(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
            </div>
            <div className="relative">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                {selectedPrompt.prompt}
              </pre>
              <button
                onClick={() => handleCopyPrompt(selectedPrompt.prompt)}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700
                         bg-white rounded-md shadow-sm border"
                title="Copy prompt"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div
              key={prompt.id}
              className="p-4 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedPrompt(prompt)}
            >
              <h3 className="font-medium text-gray-900">{prompt.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{prompt.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}