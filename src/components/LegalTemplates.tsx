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
  // Group templates by category
  const groupedTemplates = LEGAL_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Legal Templates</h3>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 mb-2 px-2">{category}</h4>
            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template.content)}
                  className="w-full text-left p-2.5 text-sm rounded border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 