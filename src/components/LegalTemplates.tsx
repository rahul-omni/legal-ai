'use client'

type Template = {
  id: string;
  name: string;
  category: string;
  content: string;
};

const LEGAL_TEMPLATES: Template[] = [
  // Agreements
  {
    id: '1',
    name: 'Share Purchase Agreement',
    category: 'Agreements',
    content: `SHARE PURCHASE AGREEMENT

This Share Purchase Agreement (the "Agreement") is made on [Date] between:

[Seller Name] ("Seller") and [Buyer Name] ("Buyer")

WHEREAS:
1. The Seller is the legal and beneficial owner of [Number] shares in [Company Name]
2. The Seller has agreed to sell and the Buyer has agreed to purchase the said shares

NOW THEREFORE IT IS AGREED as follows:`
  },
  {
    id: '2',
    name: 'Non-Disclosure Agreement',
    category: 'Agreements',
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into on [Date] by and between:

[Party A Name] ("Disclosing Party") and [Party B Name] ("Receiving Party")

1. Purpose: [Specify the purpose of disclosure]
2. Confidential Information: [Define what constitutes confidential information]`
  },
  {
    id: '3',
    name: 'Employment Agreement',
    category: 'Agreements',
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement is made on [Date] between:

[Employer Name] ("Employer") and [Employee Name] ("Employee")

1. Position and Duties
2. Compensation and Benefits
3. Term and Termination`
  },
  // Legal Opinions
  {
    id: '4',
    name: 'Legal Opinion - Corporate',
    category: 'Opinions',
    content: `LEGAL OPINION

RE: [Corporate Matter]
Date: [Current Date]

Dear [Client Name],

We have been requested to provide our legal opinion regarding [Subject Matter].

Based on our review of the relevant documents and applicable laws, we opine as follows:`
  },
  {
    id: '5',
    name: 'Due Diligence Report',
    category: 'Reports',
    content: `DUE DILIGENCE REPORT

Date: [Current Date]
Subject: [Target Company/Asset]

EXECUTIVE SUMMARY
[Brief overview of findings]

KEY FINDINGS
1. Corporate Structure
2. Financial Review
3. Legal Compliance
4. Risk Assessment`
  },
  {
    id: '6',
    name: 'Board Resolution',
    category: 'Corporate',
    content: `BOARD RESOLUTION

[Company Name]
Date: [Meeting Date]

RESOLVED THAT:
1. [First Resolution]
2. [Second Resolution]

By Order of the Board
[Secretary Name]
Company Secretary`
  }
];

interface LegalTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

export function LegalTemplates({ onSelectTemplate }: LegalTemplatesProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="space-y-4">
        {/* Agreements Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500/60 uppercase tracking-wider mb-3">
            AGREEMENTS
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onSelectTemplate("Share Purchase Agreement template...")}
              className="w-full text-left p-3 rounded-lg bg-white hover:bg-gray-200/70
                       transition-colors duration-150 ease-in-out"
            >
              <span className="text-sm text-gray-600/70">Share Purchase Agreement</span>
            </button>
            <button
              onClick={() => onSelectTemplate("Non-Disclosure Agreement template...")}
              className="w-full text-left p-3 rounded-lg bg-white hover:bg-gray-200/70
                       transition-colors duration-150 ease-in-out"
            >
              <span className="text-sm text-gray-600/70">Non-Disclosure Agreement</span>
            </button>
            <button
              onClick={() => onSelectTemplate("Employment Agreement template...")}
              className="w-full text-left p-3 rounded-lg bg-white hover:bg-gray-200/70
                       transition-colors duration-150 ease-in-out"
            >
              <span className="text-sm text-gray-600/70">Employment Agreement</span>
            </button>
          </div>
        </div>

        {/* Opinions Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500/60 uppercase tracking-wider mb-3">
            OPINIONS
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onSelectTemplate("Legal Opinion template...")}
              className="w-full text-left p-3 rounded-lg bg-white hover:bg-gray-200/70
                       transition-colors duration-150 ease-in-out"
            >
              <span className="text-sm text-gray-600/70">Legal Opinion - Corporate</span>
            </button>
          </div>
        </div>

        {/* Reports Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500/60 uppercase tracking-wider mb-3">
            REPORTS
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onSelectTemplate("Due Diligence Report template...")}
              className="w-full text-left p-3 rounded-lg bg-white hover:bg-gray-200/70
                       transition-colors duration-150 ease-in-out"
            >
              <span className="text-sm text-gray-600/70">Due Diligence Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 