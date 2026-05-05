export type DraftFieldType = "text" | "textarea" | "date" | "select";

export type DraftFieldDefinition = {
  key: string;
  label: string;
  type?: DraftFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
};

export type DraftTemplateDefinition = {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  fields: DraftFieldDefinition[];
  templateText: string;
};

const today = new Date().toISOString().slice(0, 10);

export const DRAFT_TEMPLATES: DraftTemplateDefinition[] = [
  {
    id: "criminal-complaint-fir-application",
    title: "Criminal Complaint / FIR Application",
    emoji: "⚖️",
    summary: "Complaint under Section 200 CrPC / BNSS provision",
    fields: [
      { key: "courtName", label: "Court name", required: true, placeholder: "Judicial Magistrate First Class / Metropolitan Magistrate" },
      { key: "cityDistrict", label: "City / District", required: true },
      { key: "complainantName", label: "Complainant name", required: true },
      { key: "complainantParentName", label: "Complainant parent/spouse name", required: true },
      { key: "complainantAge", label: "Complainant age", required: true },
      { key: "complainantAddress", label: "Complainant address", required: true, type: "textarea" },
      { key: "accusedDetails", label: "Accused details", required: true, type: "textarea", placeholder: "Name, parent/spouse name, address; add more accused if needed" },
      { key: "jurisdictionPlace", label: "Jurisdiction place", required: true },
      { key: "incidentDate", label: "Incident date", type: "date", required: true, defaultValue: today },
      { key: "factsSummary", label: "Facts of the case", required: true, type: "textarea" },
      { key: "offences", label: "Offences/sections", required: true, type: "textarea" },
      { key: "delayExplanation", label: "Delay (if any)", type: "textarea", defaultValue: "There is no delay in filing the present complaint." },
      { key: "oralEvidence", label: "Oral evidence/witnesses", type: "textarea", placeholder: "Witness 1, Witness 2..." },
      { key: "documentaryEvidence", label: "Documentary evidence", type: "textarea", placeholder: "Document 1, Document 2..." },
      { key: "causeOfActionDate", label: "Cause of action date", type: "date", defaultValue: today },
      { key: "prayer", label: "Prayer", type: "textarea", required: true },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "verificationParaTo", label: "Verification paragraph upper limit", defaultValue: "7" },
      { key: "annexures", label: "Annexures", type: "textarea", placeholder: "1. Document name\n2. Document name" },
    ],
    templateText: `IN THE COURT OF THE LEARNED {{courtName}}
AT {{cityDistrict}}

COMPLAINT UNDER SECTION 200 CrPC / RELEVANT PROVISION OF BNSS

IN THE MATTER OF:

Mr./Ms. {{complainantName}}
S/o / D/o / W/o {{complainantParentName}}
Aged about {{complainantAge}} years
Resident of {{complainantAddress}}
                                               ...Complainant

VERSUS

{{accusedDetails}}
                                               ...Accused

MOST RESPECTFULLY SHOWETH:

1. JURISDICTION
That this Hon'ble Court has jurisdiction to entertain and try the present complaint as the cause of action arose within its territorial jurisdiction at {{jurisdictionPlace}}.

2. FACTS OF THE CASE
That the facts leading to the filing of the present complaint are as under:
{{factsSummary}}

3. OFFENCES COMMITTED
That the acts of the accused constitute offences punishable under:
{{offences}}

4. DELAY, IF ANY
{{delayExplanation}}

5. EVIDENCE
a) Oral Evidence:
{{oralEvidence}}

b) Documentary Evidence:
{{documentaryEvidence}}

6. CAUSE OF ACTION
That the cause of action arose on {{causeOfActionDate}} and continues to subsist.

7. PRAYER
{{prayer}}

AND FOR THIS ACT OF KINDNESS, THE COMPLAINANT AS IN DUTY BOUND SHALL EVER PRAY.

Place: {{cityDistrict}}
Date: {{incidentDate}}

                                              [Signature]
                                              Complainant

THROUGH COUNSEL
{{advocateName}}

----------------------------------------

VERIFICATION

I, {{complainantName}}, the complainant above named, do hereby verify that the contents of paragraphs 1 to {{verificationParaTo}} are true and correct to my knowledge and belief.

Verified at {{cityDistrict}} on this {{incidentDate}}.

                                              [Signature]
                                              Complainant

----------------------------------------

LIST OF DOCUMENTS / ANNEXURES

{{annexures}}`,
  },
  {
    id: "bail-application",
    title: "Bail Application",
    emoji: "🔓",
    summary: "Bail application under Section 437/439 CrPC or BNSS equivalent",
    fields: [
      { key: "courtName", label: "Court name", required: true, placeholder: "Sessions Judge / CJM / Metropolitan Magistrate" },
      { key: "cityDistrict", label: "City / District", required: true },
      { key: "sectionReference", label: "Section reference", required: true, defaultValue: "437/439 CrPC / relevant section BNSS" },
      { key: "firNumber", label: "FIR number", required: true },
      { key: "policeStation", label: "Police station", required: true },
      { key: "underSections", label: "Under sections", required: true },
      { key: "accusedName", label: "Applicant/Accused name", required: true },
      { key: "accusedParentName", label: "Parent/spouse name", required: true },
      { key: "age", label: "Age", required: true },
      { key: "address", label: "Address", required: true, type: "textarea" },
      { key: "state", label: "State", required: true },
      { key: "arrestDate", label: "Arrest date", type: "date", required: true, defaultValue: today },
      { key: "briefFacts", label: "Brief facts", required: true, type: "textarea" },
      { key: "grounds", label: "Grounds for bail", required: true, type: "textarea" },
      { key: "undertaking", label: "Undertaking", type: "textarea", defaultValue: "i) To appear before the Court as and when required\nii) Not to leave India without prior permission\niii) Not to tamper with prosecution evidence\niv) Not to influence witnesses" },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "date", label: "Date", type: "date", defaultValue: today },
    ],
    templateText: `IN THE COURT OF THE {{courtName}}
AT {{cityDistrict}}

BAIL APPLICATION UNDER SECTION {{sectionReference}}

IN THE MATTER OF:

FIR No.: {{firNumber}}
Police Station: {{policeStation}}
Under Sections: {{underSections}}

IN THE MATTER OF:

{{accusedName}}
S/o / D/o / W/o {{accusedParentName}}
Age: {{age}} Years
R/o: {{address}}
                                             ...Applicant/Accused

VERSUS

STATE OF {{state}}
                                             ...Respondent

MOST RESPECTFULLY SHOWETH:

1. That the present application is being filed under Section {{sectionReference}} seeking grant of bail to the applicant in FIR No. {{firNumber}} registered at Police Station {{policeStation}} under Sections {{underSections}}.

2. That the applicant was arrested on {{arrestDate}} and is in judicial custody since then.

3. BRIEF FACTS OF THE CASE:
{{briefFacts}}

4. GROUNDS FOR GRANT OF BAIL:
{{grounds}}

5. That the applicant is ready and willing to abide by any condition imposed by this Hon'ble Court.

6. UNDERTAKING:
{{undertaking}}

PRAYER

In view of the facts and circumstances stated above, it is most respectfully prayed that this Hon'ble Court may be pleased to:
a) Grant bail to the applicant in FIR No. {{firNumber}};
b) Pass any other order(s) as this Hon'ble Court may deem fit and proper.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL EVER PRAY.

Place: {{cityDistrict}}
Date: {{date}}

                                                   {{accusedName}}
                                                   Through Counsel

                                                   {{advocateName}}
                                                   Counsel for Applicant

VERIFICATION

I, {{accusedName}}, the applicant above named, do hereby verify that the contents of the present application are true and correct to my knowledge and belief.

Place: {{cityDistrict}}
Date: {{date}}

                                                   {{accusedName}}`,
  },
  {
    id: "affidavit-general",
    title: "Affidavit",
    emoji: "📄",
    summary: "General affidavit format",
    fields: [
      { key: "courtName", label: "Court name", required: true },
      { key: "place", label: "Place", required: true },
      { key: "caseTitle", label: "Case title", required: true },
      { key: "caseNumber", label: "Case number (optional)" },
      { key: "deponentName", label: "Deponent full name", required: true },
      { key: "parentName", label: "Parent/spouse name", required: true },
      { key: "age", label: "Age", required: true },
      { key: "address", label: "Address", required: true, type: "textarea" },
      { key: "partyRole", label: "Role in matter", required: true, placeholder: "Petitioner/Respondent/Complainant" },
      { key: "accompanyingDocument", label: "Accompanying document", required: true, placeholder: "Petition/Application/Written Statement" },
      { key: "knowledgeParas", label: "Paras true to personal knowledge", required: true },
      { key: "beliefParas", label: "Paras based on legal advice", required: true },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "date", label: "Date", type: "date", defaultValue: today },
    ],
    templateText: `AFFIDAVIT

IN THE COURT OF {{courtName}}
AT {{place}}

IN THE MATTER OF:
{{caseTitle}}
{{caseNumber}}

AFFIDAVIT OF {{deponentName}}

I, {{deponentName}}, S/o / D/o / W/o {{parentName}},
aged about {{age}} years, residing at {{address}},
do hereby solemnly affirm and state as under:

1. That I am the {{partyRole}} in the present matter and am well acquainted with the facts and circumstances of the case. I am competent and authorized to swear this affidavit.

2. That the contents of the accompanying {{accompanyingDocument}} have been drafted under my instructions and the same may be read as part and parcel of this affidavit.

3. That the facts stated in paragraphs {{knowledgeParas}} are true and correct to my personal knowledge.

4. That the facts stated in paragraphs {{beliefParas}} are based on legal advice and believed to be true.

5. That the annexures annexed to the accompanying {{accompanyingDocument}} are true copies of their respective originals.

DEPONENT

VERIFICATION

Verified at {{place}} on this {{date}} that the contents of the above affidavit are true and correct to my knowledge and belief, nothing material has been concealed therefrom.

DEPONENT

Identified by me:

{{advocateName}}
Advocate

BEFORE ME
(OATH COMMISSIONER / NOTARY PUBLIC)`,
  },
  {
    id: "vakalatnama",
    title: "Vakalatnama",
    emoji: "🧾",
    summary: "Power of Attorney to Advocate",
    fields: [
      { key: "courtName", label: "Court name", required: true },
      { key: "caseTitle", label: "Case title", required: true },
      { key: "caseNumber", label: "Case number", required: true },
      { key: "year", label: "Year", required: true },
      { key: "clientNames", label: "Client name(s)", required: true, type: "textarea" },
      { key: "partyRole", label: "Party role", required: true, placeholder: "Plaintiff/Defendant/Complainant/Accused" },
      { key: "oppositePartyNames", label: "Opposite party name(s)", required: true, type: "textarea" },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "enrollmentNo", label: "Enrollment no.", required: true },
      { key: "executionDate", label: "Execution date", type: "date", defaultValue: today },
      { key: "executionPlace", label: "Execution place", required: true },
      { key: "clientAddress", label: "Client address", required: true, type: "textarea" },
    ],
    templateText: `VAKALATNAMA

IN THE COURT OF {{courtName}}

Case Title: {{caseTitle}}
Case No.: {{caseNumber}}  Year: {{year}}

I/We, {{clientNames}}
[Name of Client(s)]

{{partyRole}}

Versus

{{oppositePartyNames}}
[Opposite Party Name(s)]

Do hereby appoint and retain:

Shri/Smt. {{advocateName}}
Advocate, Enrollment No. {{enrollmentNo}}

To act, appear, and plead on my/our behalf in the above-mentioned case and all proceedings arising therefrom.

The said Advocate is authorized to:
- Appear and plead in the Court
- File and receive documents
- Engage other advocates
- Act in all matters connected with the case

I/We agree to ratify all acts done by the said Advocate in pursuance of this authority.

Executed on this {{executionDate}} at {{executionPlace}}

_____________________________
(Signature of Client)

Name: {{clientNames}}
Address: {{clientAddress}}

ACCEPTED

_____________________________
(Signature of Advocate)

Name: {{advocateName}}
Enrollment No.: {{enrollmentNo}}

-------------------------------
(To be affixed as per court rules)
[Advocate Welfare Stamp]
[Court Fee Stamp, if applicable]
-------------------------------`,
  },
  {
    id: "legal-notice-money-recovery",
    title: "Legal Notice - Money Recovery",
    emoji: "💰",
    summary: "Legal notice for recovery of outstanding dues",
    fields: [
      { key: "date", label: "Notice date", type: "date", defaultValue: today, required: true },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "barEnrollmentNo", label: "Bar Council enrollment no.", required: true },
      { key: "advocateAddress", label: "Advocate address", required: true, type: "textarea" },
      { key: "advocateContact", label: "Advocate contact details", required: true },
      { key: "debtorName", label: "Debtor name", required: true },
      { key: "debtorParentName", label: "Debtor parent/spouse name", required: true },
      { key: "debtorAddress", label: "Debtor address", required: true, type: "textarea" },
      { key: "creditorName", label: "Creditor/client name", required: true },
      { key: "creditorAddress", label: "Creditor address", required: true, type: "textarea" },
      { key: "agreementDate", label: "Agreement/transaction date", type: "date", required: true },
      { key: "obligation", label: "Obligation summary", required: true, type: "textarea" },
      { key: "dateOfDefault", label: "Date of default", type: "date", required: true },
      { key: "principalAmount", label: "Principal amount", required: true },
      { key: "interestAmount", label: "Interest amount" },
      { key: "otherCharges", label: "Other charges" },
      { key: "totalDue", label: "Total due", required: true },
      { key: "totalDueWords", label: "Total due in words", required: true },
      { key: "lastPaymentDate", label: "Last payment date", type: "date" },
      { key: "interestRate", label: "Interest rate (%)" },
      { key: "paymentDeadlineDays", label: "Payment deadline (days)", defaultValue: "15", required: true },
      { key: "bankDetails", label: "Bank transfer details", type: "textarea", placeholder: "Account Name, Bank, Account No., IFSC" },
      { key: "jurisdictionCity", label: "Jurisdiction city", required: true },
    ],
    templateText: `LEGAL NOTICE FOR RECOVERY OF MONEY
[TO BE SENT VIA REGISTERED POST A.D. (RPAD) AND EMAIL]

Date: {{date}}

From:
{{advocateName}}
{{barEnrollmentNo}}
{{advocateAddress}}
{{advocateContact}}

TO
Mr./Ms. {{debtorName}}
S/o / D/o / W/o {{debtorParentName}}
{{debtorAddress}}

SUBJECT: LEGAL NOTICE FOR RECOVERY OF OUTSTANDING DUES AMOUNTING TO Rs. {{totalDue}}

Sir/Madam,

Under instructions from and on behalf of my client {{creditorName}}, having office at {{creditorAddress}}, I hereby serve upon you the present legal notice as follows:

1. FACTS OF THE CASE
a) That on {{agreementDate}}, my client and you entered into a transaction, whereby you were obligated to:
{{obligation}}
b) That my client duly performed all obligations as required under the said agreement/transaction.
c) That you failed and neglected to discharge your payment obligations despite repeated requests and reminders.

2. CAUSE OF ACTION
The cause of action arose on {{dateOfDefault}} when you failed to make payment of the due amount and continues to subsist till date.

3. OUTSTANDING LIABILITY
Principal Amount: Rs. {{principalAmount}}
Interest (if applicable): Rs. {{interestAmount}}
Other Charges: Rs. {{otherCharges}}

Total Due: Rs. {{totalDue}} (Rupees {{totalDueWords}} only)

Details:
Agreement/Invoice Date: {{agreementDate}}
Due Date: {{dateOfDefault}}
Last Payment: {{lastPaymentDate}}
Interest Rate: {{interestRate}}% per annum (if applicable)

4. BREACH OF OBLIGATION
Your failure to make payment constitutes a clear breach of the terms of the agreement and renders you liable for recovery proceedings under applicable laws.

5. DEMAND
You are hereby called upon to pay the total outstanding amount of Rs. {{totalDue}} within {{paymentDeadlineDays}} days from the receipt of this notice.

Payment may be made via:
{{bankDetails}}
OR
By Demand Draft/Cheque in favour of {{creditorName}}

6. FAILURE TO COMPLY
In the event of your failure to comply within the stipulated period, my client shall be constrained to initiate appropriate legal proceedings against you, including but not limited to:
- Civil suit for recovery of money along with interest and costs
- Any other proceedings as may be permissible under law

7. JURISDICTION
Any legal proceedings arising out of this matter shall be subject to the jurisdiction of courts at {{jurisdictionCity}}.

8. WITHOUT PREJUDICE
This notice is issued without prejudice to all other rights and remedies available to my client under law.

Yours faithfully,

[ADVOCATE SIGNATURE]
{{advocateName}}

Copy to:
{{creditorName}}`,
  },
  {
    id: "reply-to-legal-notice",
    title: "Reply to Legal Notice",
    emoji: "↩️",
    summary: "Formal reply notice on behalf of client",
    fields: [
      { key: "date", label: "Reply date", type: "date", defaultValue: today, required: true },
      { key: "noticeSender", label: "Notice sender details", required: true, type: "textarea" },
      { key: "noticeDate", label: "Notice date", type: "date", required: true },
      { key: "receivedDate", label: "Received date", type: "date", required: true },
      { key: "clientName", label: "Client name", required: true },
      { key: "preliminaryObjections", label: "Preliminary objections", required: true, type: "textarea" },
      { key: "paraWiseReply", label: "Para-wise reply", type: "textarea" },
      { key: "factualPosition", label: "Factual position", required: true, type: "textarea" },
      { key: "legalGrounds", label: "Legal grounds", required: true, type: "textarea" },
      { key: "documentsRelied", label: "Documents relied upon", type: "textarea" },
      { key: "settlementProposal", label: "Without prejudice settlement (optional)", type: "textarea" },
      { key: "callUpon", label: "Call upon notice sender", type: "textarea" },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "barEnrollmentNo", label: "Bar Council enrollment no.", required: true },
      { key: "address", label: "Advocate address", required: true, type: "textarea" },
      { key: "contactDetails", label: "Contact details", required: true },
      { key: "place", label: "Place", required: true },
      { key: "enclosures", label: "Enclosures", type: "textarea" },
    ],
    templateText: `REPLY TO LEGAL NOTICE
[TO BE SENT VIA REGISTERED A.D. POST / SPEED POST / EMAIL]

Date: {{date}}

TO,
{{noticeSender}}

SUBJECT: REPLY TO YOUR LEGAL NOTICE DATED {{noticeDate}}

UNDER INSTRUCTIONS FROM AND ON BEHALF OF MY CLIENT {{clientName}}, I hereby reply to your legal notice dated {{noticeDate}}, received on {{receivedDate}}, as under:

At the outset, it is submitted that the contents of your notice are denied in toto, save and except those which are specifically admitted herein. This reply is being issued without prejudice to the rights and contentions of my client.

1. PRELIMINARY OBJECTIONS
{{preliminaryObjections}}

2. PARA-WISE REPLY
{{paraWiseReply}}

3. FACTUAL POSITION
{{factualPosition}}

4. DENIAL OF LIABILITY
My client denies any liability, whether civil or criminal, towards you. The claims made in your notice are false, frivolous, and devoid of merit.

5. LEGAL POSITION
{{legalGrounds}}

6. DOCUMENTS RELIED UPON
{{documentsRelied}}

7. WITHOUT PREJUDICE SETTLEMENT (OPTIONAL)
{{settlementProposal}}

8. CALL UPON YOU
{{callUpon}}

9. CONSEQUENCES
Failing compliance, my client shall be constrained to initiate appropriate legal proceedings against you, both civil and criminal, at your sole risk as to costs and consequences.

10. RESERVATION OF RIGHTS
All rights and remedies available to my client under applicable law are expressly reserved.

Yours faithfully,

{{advocateName}}
{{barEnrollmentNo}}
{{address}}
{{contactDetails}}

Counsel for {{clientName}}

Place: {{place}}
Date: {{date}}

ENCLOSURES:
{{enclosures}}`,
  },
  {
    id: "written-statement-civil-suit",
    title: "Written Statement / Reply in Civil Suit",
    emoji: "📘",
    summary: "Written statement under Order VIII CPC",
    fields: [
      { key: "courtName", label: "Court name", required: true },
      { key: "place", label: "Place", required: true },
      { key: "suitNo", label: "Civil suit number", required: true },
      { key: "suitYear", label: "Suit year", required: true },
      { key: "plaintiffName", label: "Plaintiff name", required: true },
      { key: "defendantName", label: "Defendant name", required: true },
      { key: "preliminaryObjections", label: "Preliminary objections", required: true, type: "textarea" },
      { key: "paraWiseReply", label: "Para-wise reply", required: true, type: "textarea" },
      { key: "additionalPleas", label: "Additional pleas", type: "textarea" },
      { key: "defendantFacts", label: "Defendant version of facts", required: true, type: "textarea" },
      { key: "counterclaim", label: "Counterclaim (if any)", type: "textarea" },
      { key: "documents", label: "List of documents", type: "textarea" },
      { key: "prayer", label: "Prayer", required: true, type: "textarea" },
      { key: "verificationParas", label: "Verification paragraph range", required: true, defaultValue: "1 to 8" },
      { key: "date", label: "Date", type: "date", defaultValue: today },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "enrollmentNo", label: "Enrollment no.", required: true },
      { key: "advocateAddress", label: "Advocate address", type: "textarea", required: true },
    ],
    templateText: `IN THE COURT OF {{courtName}}
AT {{place}}

CIVIL SUIT NO. {{suitNo}} OF {{suitYear}}

IN THE MATTER OF:
{{plaintiffName}}
...PLAINTIFF

VERSUS
{{defendantName}}
...DEFENDANT

WRITTEN STATEMENT ON BEHALF OF THE DEFENDANT

MOST RESPECTFULLY SHOWETH:

1. PRELIMINARY OBJECTIONS
{{preliminaryObjections}}

2. PARA-WISE REPLY ON MERITS
{{paraWiseReply}}

3. ADDITIONAL PLEAS
{{additionalPleas}}

4. DEFENDANT'S VERSION OF FACTS
{{defendantFacts}}

5. COUNTERCLAIM (IF ANY)
{{counterclaim}}

6. LIST OF DOCUMENTS
{{documents}}

7. PRAYER
{{prayer}}

8. VERIFICATION
I, {{defendantName}}, the Defendant above named, do hereby verify that the contents of paragraphs {{verificationParas}} are true and correct to my knowledge and belief.

Verified at {{place}} on this {{date}}.

DEFENDANT

9. STATEMENT OF TRUTH (if applicable)
I, {{defendantName}}, do hereby declare that the contents of this Written Statement are true to my knowledge and belief and no material facts have been concealed.

Verified at {{place}} on this {{date}}.

DEFENDANT

THROUGH COUNSEL:
{{advocateName}}
{{enrollmentNo}}
{{advocateAddress}}`,
  },
  {
    id: "anticipatory-bail-petition",
    title: "Petition for Anticipatory Bail",
    emoji: "🛡️",
    summary: "Application under Section 438 BNSS/CrPC",
    fields: [
      { key: "forumName", label: "Forum name", required: true, placeholder: "High Court of [State] at [City] OR Sessions Judge at [District]" },
      { key: "applicantName", label: "Applicant name", required: true },
      { key: "applicantParentName", label: "Parent/spouse name", required: true },
      { key: "applicantAddress", label: "Applicant address", required: true, type: "textarea" },
      { key: "state", label: "State", required: true },
      { key: "firNo", label: "FIR number (if registered)" },
      { key: "firDate", label: "FIR date", type: "date" },
      { key: "policeStation", label: "Police station", required: true },
      { key: "offenceSections", label: "Offence sections", required: true },
      { key: "apprehensionFacts", label: "Apprehension/facts", required: true, type: "textarea" },
      { key: "falseImplicationReason", label: "False implication reason", type: "textarea" },
      { key: "custodialGrounds", label: "No custodial interrogation grounds", type: "textarea" },
      { key: "undertakings", label: "Undertakings", type: "textarea", defaultValue: "a) To join investigation as and when required\nb) Not to tamper with evidence\nc) Not to influence any witness\nd) Not to leave India without prior permission of the Court" },
      { key: "date", label: "Date", type: "date", defaultValue: today },
      { key: "place", label: "Place", required: true },
      { key: "advocateName", label: "Advocate name", required: true },
    ],
    templateText: `IN THE {{forumName}}

CRIMINAL MISC. ANTICIPATORY BAIL APPLICATION

IN THE MATTER OF:

{{applicantName}}
S/o / D/o / W/o {{applicantParentName}}
R/o {{applicantAddress}}
                                              ...APPLICANT

VERSUS

STATE OF {{state}}
                                              ...RESPONDENT

APPLICATION UNDER SECTION 438 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023
(OR SECTION 438 OF THE CODE OF CRIMINAL PROCEDURE, 1973)

MOST RESPECTFULLY SHOWETH:

1. That the present application is being filed seeking grant of anticipatory bail as the Applicant apprehends arrest in connection with FIR No. {{firNo}} dated {{firDate}} registered at Police Station {{policeStation}} for offences under Sections {{offenceSections}}.

2. BRIEF FACTS
{{apprehensionFacts}}

3. FALSE IMPLICATION
{{falseImplicationReason}}

4. NO CUSTODIAL INTERROGATION REQUIRED
{{custodialGrounds}}

5. That the Applicant is a law-abiding citizen having no criminal antecedents.

6. That the Applicant undertakes:
{{undertakings}}

PRAYER

a) Grant anticipatory bail to the Applicant in the event of arrest in connection with FIR No. {{firNo}} dated {{firDate}} registered at Police Station {{policeStation}};
b) Pass such other order(s) as this Hon'ble Court may deem fit and proper in the interest of justice.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT AS IN DUTY BOUND SHALL EVER PRAY.

Place: {{place}}
Date: {{date}}

                                               {{applicantName}}
                                               THROUGH COUNSEL

COUNSEL FOR THE APPLICANT
{{advocateName}}

VERIFICATION

I, {{applicantName}}, do hereby verify that the contents of the above application are true and correct to my knowledge and belief.

Place: {{place}}
Date: {{date}}

                                               {{applicantName}}`,
  },
  {
    id: "revision-appeal-petition",
    title: "Petition for Revision / Appeal",
    emoji: "🏛️",
    summary: "Criminal revision petition format",
    fields: [
      { key: "stateName", label: "State name", required: true },
      { key: "place", label: "Place", required: true },
      { key: "petitionNo", label: "Revision petition number", required: true },
      { key: "petitionYear", label: "Year", required: true },
      { key: "petitionerName", label: "Petitioner name", required: true },
      { key: "petitionerParentName", label: "Parent/spouse name", required: true },
      { key: "petitionerAge", label: "Age", required: true },
      { key: "petitionerAddress", label: "Petitioner address", required: true, type: "textarea" },
      { key: "respondentName", label: "Respondent name", required: true },
      { key: "respondentParentName", label: "Respondent parent/spouse name", required: true },
      { key: "respondentAddress", label: "Respondent address", required: true, type: "textarea" },
      { key: "synopsis", label: "Synopsis and list of dates", required: true, type: "textarea" },
      { key: "impugnedOrderDate", label: "Impugned order date", type: "date", required: true },
      { key: "impugnedCourtName", label: "Impugned court name", required: true },
      { key: "caseNo", label: "Impugned case number", required: true },
      { key: "facts", label: "Facts", required: true, type: "textarea" },
      { key: "grounds", label: "Grounds", required: true, type: "textarea" },
      { key: "prayer", label: "Prayer", required: true, type: "textarea" },
      { key: "interimPrayer", label: "Interim prayer", type: "textarea" },
      { key: "limitation", label: "Limitation statement", required: true, defaultValue: "The present petition is within limitation." },
      { key: "date", label: "Date", type: "date", defaultValue: today },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "enrollmentNo", label: "Enrollment no.", required: true },
    ],
    templateText: `IN THE HIGH COURT OF {{stateName}} AT {{place}}

CRIMINAL REVISION PETITION NO. {{petitionNo}} OF {{petitionYear}}

IN THE MATTER OF:

{{petitionerName}}
S/o / D/o / W/o {{petitionerParentName}}
Aged about {{petitionerAge}} years
Resident of {{petitionerAddress}}
                                              ...PETITIONER

VERSUS

1. State of {{stateName}}
   Through Public Prosecutor

2. {{respondentName}}
   S/o / D/o / W/o {{respondentParentName}}
   Resident of {{respondentAddress}}
                                              ...RESPONDENTS

CRIMINAL REVISION PETITION UNDER SECTION 397 READ WITH SECTION 401 OF CrPC
[OR RELEVANT PROVISIONS OF BNSS]

MOST RESPECTFULLY SHOWETH:

1. SYNOPSIS AND LIST OF DATES
{{synopsis}}

2. FACTS OF THE CASE
2.1 That the present petition is being filed against the order dated {{impugnedOrderDate}} passed by {{impugnedCourtName}} in Case No. {{caseNo}}.
2.2 {{facts}}

3. GROUNDS
{{grounds}}

4. PRAYER
{{prayer}}

5. INTERIM PRAYER
{{interimPrayer}}

6. DECLARATION
That no other petition seeking similar relief has been filed before this Hon'ble Court.

7. LIMITATION
{{limitation}}

PLACE: {{place}}
DATE: {{date}}

                                              PETITIONER
                                              THROUGH COUNSEL

{{advocateName}}
Advocate for the Petitioner
Enrollment No: {{enrollmentNo}}

-----------------------------------
AFFIDAVIT

I, {{petitionerName}}, the Petitioner above named, do hereby solemnly affirm and state:
1. That I am the Petitioner in the present case and am well acquainted with the facts.
2. That the contents of the accompanying petition are true and correct to my knowledge and belief.

DEPONENT

VERIFICATION:
Verified at {{place}} on this {{date}} that the contents are true and correct.

DEPONENT`,
  },
  {
    id: "sale-agreement-deed-of-sale",
    title: "Sale Agreement / Deed of Sale",
    emoji: "🏠",
    summary: "Deed of absolute sale",
    fields: [
      { key: "executionDate", label: "Execution date", type: "date", defaultValue: today, required: true },
      { key: "executionPlace", label: "Execution place", required: true },
      { key: "sellerName", label: "Seller name", required: true },
      { key: "sellerParentName", label: "Seller parent/spouse name", required: true },
      { key: "sellerAge", label: "Seller age", required: true },
      { key: "sellerAddress", label: "Seller address", required: true, type: "textarea" },
      { key: "sellerPan", label: "Seller PAN", required: true },
      { key: "buyerName", label: "Buyer name", required: true },
      { key: "buyerParentName", label: "Buyer parent/spouse name", required: true },
      { key: "buyerAge", label: "Buyer age", required: true },
      { key: "buyerAddress", label: "Buyer address", required: true, type: "textarea" },
      { key: "buyerPan", label: "Buyer PAN", required: true },
      { key: "propertyDetails", label: "Property details", required: true, type: "textarea" },
      { key: "priorSaleDeedDate", label: "Prior sale deed date", type: "date" },
      { key: "priorDocumentNo", label: "Prior document no." },
      { key: "subRegistrar", label: "Sub-Registrar office" },
      { key: "saleConsideration", label: "Sale consideration", required: true },
      { key: "saleConsiderationWords", label: "Sale consideration in words", required: true },
      { key: "paymentDetails", label: "Payment details", required: true, type: "textarea" },
      { key: "propertySchedule", label: "Schedule of property", required: true, type: "textarea" },
      { key: "jurisdiction", label: "Jurisdiction", required: true },
    ],
    templateText: `DEED OF ABSOLUTE SALE

This Deed of Sale is made and executed on this {{executionDate}} at {{executionPlace}}.

BETWEEN

Mr./Ms. {{sellerName}}, S/o / D/o / W/o {{sellerParentName}}, aged about {{sellerAge}} years, residing at {{sellerAddress}}, PAN No. {{sellerPan}} (hereinafter referred to as the “Vendor/Seller”)

AND

Mr./Ms. {{buyerName}}, S/o / D/o / W/o {{buyerParentName}}, aged about {{buyerAge}} years, residing at {{buyerAddress}}, PAN No. {{buyerPan}} (hereinafter referred to as the “Vendee/Buyer”)

WHEREAS:

1. The Vendor is the absolute owner in possession of the property bearing {{propertyDetails}}, having acquired the same vide Registered Sale Deed dated {{priorSaleDeedDate}}, registered as Document No. {{priorDocumentNo}} in the office of Sub-Registrar {{subRegistrar}}.

2. The said property is free from all encumbrances, charges, liens, claims, acquisitions, and litigation, except as stated herein.

3. The Vendee has agreed to purchase the said property after verifying title documents and encumbrance certificate.

NOW THIS DEED WITNESSETH AS FOLLOWS:

1. SALE CONSIDERATION
That in consideration of a total sum of Rs. {{saleConsideration}} (Rupees {{saleConsiderationWords}} only), paid by the Vendee to the Vendor as under:
{{paymentDetails}}
The Vendor hereby acknowledges receipt of the full sale consideration.

2. TRANSFER OF PROPERTY
The Vendor hereby conveys, transfers and assigns unto the Vendee ALL THAT piece and parcel of property described in the Schedule hereunder, together with all rights, easements and appurtenances thereto.

3. DELIVERY OF POSSESSION
The Vendor has this day delivered vacant and peaceful possession of the said property to the Vendee.

4. TITLE AND INDEMNITY
The Vendor hereby covenants clear and marketable title and indemnifies the Vendee against any loss arising due to defective title or third-party claims.

5. TAXES AND LIABILITIES
All dues up to execution shall be borne by the Vendor; thereafter by the Vendee.

6. TIME IS THE ESSENCE
Time has been agreed to be the essence of this contract.

7. REGISTRATION
This Deed shall be presented for registration before the Sub-Registrar having jurisdiction.

8. JURISDICTION
All disputes arising out of this Deed shall be subject to the jurisdiction of competent civil courts at {{jurisdiction}}.

SCHEDULE OF PROPERTY
{{propertySchedule}}

IN WITNESS WHEREOF, the parties have signed this Deed on the day, month and year first above written.

SELLER (Signature)
BUYER (Signature)

WITNESSES:
1. Name / Address / Signature
2. Name / Address / Signature`,
  },
  {
    id: "leave-and-license-rental-agreement",
    title: "Leave and License / Rental Agreement",
    emoji: "🏡",
    summary: "Residential leave and license agreement",
    fields: [
      { key: "executionDate", label: "Execution date", type: "date", defaultValue: today, required: true },
      { key: "executionPlace", label: "Execution place", required: true },
      { key: "licensorName", label: "Licensor name", required: true },
      { key: "licensorParentName", label: "Licensor parent/spouse name", required: true },
      { key: "licensorAge", label: "Licensor age", required: true },
      { key: "licensorOccupation", label: "Licensor occupation", required: true },
      { key: "licensorAddress", label: "Licensor address", required: true, type: "textarea" },
      { key: "licensorPan", label: "Licensor PAN", required: true },
      { key: "licenseeName", label: "Licensee name", required: true },
      { key: "licenseeParentName", label: "Licensee parent/spouse name", required: true },
      { key: "licenseeAge", label: "Licensee age", required: true },
      { key: "licenseeOccupation", label: "Licensee occupation", required: true },
      { key: "licenseeAddress", label: "Licensee address", required: true, type: "textarea" },
      { key: "licenseePan", label: "Licensee PAN", required: true },
      { key: "premisesAddress", label: "Licensed premises address", required: true, type: "textarea" },
      { key: "startDate", label: "Start date", type: "date", required: true, defaultValue: today },
      { key: "termMonths", label: "Term (months)", required: true },
      { key: "licenseFee", label: "Monthly license fee", required: true },
      { key: "feeDueDay", label: "Due day of month", required: true, defaultValue: "5" },
      { key: "paymentMode", label: "Payment mode", required: true, defaultValue: "Bank Transfer" },
      { key: "securityDeposit", label: "Security deposit", required: true },
      { key: "depositRefundDays", label: "Deposit refund days", required: true, defaultValue: "30" },
      { key: "noticeDays", label: "Termination notice days", required: true, defaultValue: "30" },
      { key: "lockInMonths", label: "Lock-in period months (if any)" },
      { key: "jurisdiction", label: "Jurisdiction city", required: true },
      { key: "stampDutySharing", label: "Stamp duty sharing", defaultValue: "As mutually agreed by the Parties" },
    ],
    templateText: `LEAVE AND LICENSE AGREEMENT (RESIDENTIAL)

This Leave and License Agreement is executed on {{executionDate}} at {{executionPlace}}.

BETWEEN
Mr./Ms. {{licensorName}},
S/o / D/o / W/o {{licensorParentName}},
Aged about {{licensorAge}} years, Occupation {{licensorOccupation}},
Residing at {{licensorAddress}},
PAN: {{licensorPan}},
(hereinafter referred to as the “LICENSOR”)

AND
Mr./Ms. {{licenseeName}},
S/o / D/o / W/o {{licenseeParentName}},
Aged about {{licenseeAge}} years, Occupation {{licenseeOccupation}},
Residing at {{licenseeAddress}},
PAN: {{licenseePan}},
(hereinafter referred to as the “LICENSEE”)

WHEREAS:
A. The Licensor has rights over the property situated at {{premisesAddress}} (“Licensed Premises”).
B. The Licensor agrees to grant leave and license for residential use only.
C. This Agreement does not create tenancy rights.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:
1. LICENSE: Temporary, non-exclusive, revocable license for residential use.
2. TERM: Commences from {{startDate}} and remains valid for {{termMonths}} months.
3. LICENSE FEE: Rs. {{licenseFee}} per month, payable on or before day {{feeDueDay}} via {{paymentMode}}.
4. SECURITY DEPOSIT: Rs. {{securityDeposit}}, refundable within {{depositRefundDays}} days after deductions.
5. USE OF PREMISES: Residential use only; no sub-license; no structural alterations.
6. MAINTENANCE AND UTILITIES: Consumption charges borne by Licensee unless otherwise agreed.
7. ENTRY AND INSPECTION: Permitted upon reasonable notice.
8. TERMINATION: Either party may terminate with {{noticeDays}} days' written notice.
9. LOCK-IN PERIOD (IF APPLICABLE): {{lockInMonths}} months.
10. INDEMNITY: Licensee indemnifies Licensor against misuse/negligence.
11. FORCE MAJEURE: Standard force majeure protections apply.
12. POLICE VERIFICATION: Licensee shall complete formalities as required.
13. STAMP DUTY AND REGISTRATION: {{stampDutySharing}}.
14. GOVERNING LAW AND JURISDICTION: Courts at {{jurisdiction}}.

IN WITNESS WHEREOF, parties execute this Agreement.

LICENSOR (Signature)
LICENSEE (Signature)
WITNESSES: 1) ______ 2) ______`,
  },
  {
    id: "general-power-of-attorney",
    title: "Power of Attorney (General)",
    emoji: "🔑",
    summary: "General power of attorney deed",
    fields: [
      { key: "executionDate", label: "Execution date", type: "date", defaultValue: today, required: true },
      { key: "executionPlace", label: "Execution place", required: true },
      { key: "principalName", label: "Principal name", required: true },
      { key: "principalParentName", label: "Principal parent/spouse name", required: true },
      { key: "principalAge", label: "Principal age", required: true },
      { key: "principalOccupation", label: "Principal occupation", required: true },
      { key: "principalAddress", label: "Principal address", required: true, type: "textarea" },
      { key: "principalPan", label: "Principal PAN", required: true },
      { key: "principalAadhaar", label: "Principal Aadhaar", required: true },
      { key: "attorneyName", label: "Attorney name", required: true },
      { key: "attorneyParentName", label: "Attorney parent/spouse name", required: true },
      { key: "attorneyAge", label: "Attorney age", required: true },
      { key: "attorneyOccupation", label: "Attorney occupation", required: true },
      { key: "attorneyAddress", label: "Attorney address", required: true, type: "textarea" },
      { key: "propertyDetails", label: "Property details (if any)", type: "textarea" },
      { key: "financialPowers", label: "Financial powers details", type: "textarea" },
      { key: "excludedPowers", label: "Powers excluded", type: "textarea" },
      { key: "stateStampLaw", label: "Applicable state stamp law note", defaultValue: "As per applicable State Stamp Laws" },
    ],
    templateText: `GENERAL POWER OF ATTORNEY

THIS GENERAL POWER OF ATTORNEY is executed on {{executionDate}} at {{executionPlace}}.

BY:
I, {{principalName}},
S/o / D/o / W/o {{principalParentName}},
Aged about {{principalAge}} years, Occupation: {{principalOccupation}},
Residing at: {{principalAddress}},
PAN: {{principalPan}},
Aadhaar No.: {{principalAadhaar}},
(hereinafter referred to as the “Principal”)

IN FAVOUR OF:
Mr./Ms. {{attorneyName}},
S/o / D/o / W/o {{attorneyParentName}},
Aged about {{attorneyAge}} years, Occupation: {{attorneyOccupation}},
Residing at: {{attorneyAddress}},
(hereinafter referred to as the “Attorney”)

NOW THIS DEED WITNESSETH AS FOLLOWS:
1. APPOINTMENT: Principal appoints Attorney to act lawfully on Principal's behalf.
2. POWERS GRANTED:
A. FINANCIAL POWERS: {{financialPowers}}
B. PROPERTY POWERS: {{propertyDetails}}
C. LEGAL POWERS: Appearance, pleadings, affidavits, appointment of advocates, Vakalatnama.
D. BUSINESS & CONTRACTUAL POWERS: To enter contracts and execute documents.
E. GENERAL POWERS: All necessary acts for effective exercise of powers.

3. POWERS EXCLUDED:
{{excludedPowers}}

4. RATIFICATION: Principal ratifies lawful acts of Attorney.
5. INDEMNITY: Principal indemnifies Attorney/third parties acting in good faith.
6. DURATION AND REVOCATION: Effective until revoked in writing.
7. GOVERNING LAW: Laws of India.
8. STAMP DUTY AND REGISTRATION:
- {{stateStampLaw}}
- If relating to immovable property, registration under Registration Act, 1908.

IN WITNESS WHEREOF, executed on the date above.

(Signature of Principal)
Name: {{principalName}}

WITNESSES:
1. Name / Address / Signature
2. Name / Address / Signature

ATTORNEY ACCEPTANCE:
I, {{attorneyName}}, accept the appointment.

(Signature of Attorney)

NOTARIZATION:
Signed and sworn before me on {{executionDate}}.

(Notary Public Signature & Seal)`,
  },
  {
    id: "affidavit-in-evidence",
    title: "Affidavit in Evidence / Witness Statement",
    emoji: "🗣️",
    summary: "Evidence affidavit/witness statement format",
    fields: [
      { key: "courtName", label: "Court name", required: true },
      { key: "place", label: "Place", required: true },
      { key: "caseNo", label: "Case number", required: true },
      { key: "caseTitle", label: "Case title", required: true },
      { key: "witnessName", label: "Witness name", required: true },
      { key: "parentName", label: "Parent/spouse name", required: true },
      { key: "age", label: "Age", required: true },
      { key: "occupation", label: "Occupation", required: true },
      { key: "address", label: "Address", required: true, type: "textarea" },
      { key: "eventDate", label: "Event date", type: "date", required: true },
      { key: "location", label: "Event location", required: true },
      { key: "witnessFacts", label: "Witness facts (chronological paragraphs)", required: true, type: "textarea" },
      { key: "partyName", label: "Party supported", required: true },
      { key: "verificationParaTo", label: "Verification paragraph upper limit", required: true, defaultValue: "7" },
      { key: "verificationDate", label: "Verification date", type: "date", defaultValue: today, required: true },
    ],
    templateText: `AFFIDAVIT IN EVIDENCE / WITNESS STATEMENT
IN THE COURT OF {{courtName}}
AT {{place}}
Case No.: {{caseNo}}
{{caseTitle}}

I, {{witnessName}}, S/o / D/o / W/o {{parentName}},
aged about {{age}} years, Occupation: {{occupation}},
resident of {{address}}, do hereby solemnly affirm and state as under:

1. That I am the deponent herein and I am well acquainted with the facts of the present case and competent to swear this affidavit.
2. That I have personal knowledge of the facts stated herein, except where stated otherwise.
3. That on {{eventDate}}, I was present at {{location}} and witnessed the following:
{{witnessFacts}}
4. That I say that the statements made herein are true and correct to my knowledge and belief.
5. That I am filing this affidavit in support of the case of {{partyName}}.

VERIFICATION
I, the above-named deponent, do hereby verify that the contents of paragraphs 1 to {{verificationParaTo}} are true and correct to my knowledge and belief, and nothing material has been concealed therefrom.

Verified at {{place}} on {{verificationDate}}.

DEPONENT
Identified by:
Before Me:
(Oath Commissioner / Notary Public)`,
  },
  {
    id: "demand-notice-goods-services",
    title: "Demand Notice - Goods/Service",
    emoji: "📨",
    summary: "Demand notice memo style format",
    fields: [
      { key: "courtName", label: "Court/Forum name", required: true },
      { key: "caseType", label: "Case type/petition name", required: true },
      { key: "petitionerName", label: "Petitioner/Complainant name", required: true },
      { key: "petitionerParentName", label: "Petitioner parent/spouse name", required: true },
      { key: "petitionerAddress", label: "Petitioner address", required: true, type: "textarea" },
      { key: "respondentName", label: "Respondent/Accused name", required: true },
      { key: "respondentParentName", label: "Respondent parent/spouse name", required: true },
      { key: "respondentAddress", label: "Respondent address", required: true, type: "textarea" },
      { key: "respondent2", label: "Respondent no.2 details (optional)", type: "textarea" },
      { key: "respondent3", label: "Respondent no.3 details (optional)", type: "textarea" },
      { key: "place", label: "Place", required: true },
      { key: "date", label: "Date", type: "date", defaultValue: today, required: true },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "chamberAddress", label: "Chamber address", required: true, type: "textarea" },
      { key: "contactNo", label: "Contact number", required: true },
      { key: "enrollmentNo", label: "Enrollment number", required: true },
    ],
    templateText: `IN THE COURT OF {{courtName}}

{{caseType}}

IN THE MATTER OF:

{{petitionerName}}
S/o / D/o / W/o {{petitionerParentName}}
R/o {{petitionerAddress}}
                                          ...Petitioner/Complainant

VERSUS

{{respondentName}}
S/o / D/o / W/o {{respondentParentName}}
R/o {{respondentAddress}}
                                          ...Respondent/Accused

MEMO OF PARTIES

1. {{petitionerName}}
   S/o / D/o / W/o {{petitionerParentName}}
   R/o {{petitionerAddress}}
   ...Petitioner/Complainant

VERSUS

1. {{respondentName}}
   S/o / D/o / W/o {{respondentParentName}}
   R/o {{respondentAddress}}

2. {{respondent2}}
3. {{respondent3}}

...Respondents/Accused

Place: {{place}}
Date: {{date}}

{{advocateName}}
Counsel for the Petitioner/Complainant

Chamber Address: {{chamberAddress}}
Contact No.: {{contactNo}}
Enrollment No.: {{enrollmentNo}}`,
  },
  {
    id: "memo-of-parties",
    title: "Memo of Parties (Case Summary)",
    emoji: "👥",
    summary: "Memo of parties format",
    fields: [
      { key: "courtName", label: "Court name", required: true },
      { key: "location", label: "Location", required: true },
      { key: "caseNo", label: "Case number", required: true },
      { key: "petitionerName", label: "Petitioner name", required: true },
      { key: "petitionerParentName", label: "Petitioner parent name", required: true },
      { key: "petitionerAddress", label: "Petitioner address", required: true, type: "textarea" },
      { key: "respondentName", label: "Respondent name", required: true },
      { key: "respondentParentName", label: "Respondent parent name", required: true },
      { key: "respondentAddress", label: "Respondent address", required: true, type: "textarea" },
      { key: "additionalParties", label: "Additional parties (if any)", type: "textarea" },
      { key: "advocateName", label: "Advocate name", required: true },
      { key: "forParty", label: "Counsel for (Petitioner/Respondent)", required: true, defaultValue: "Petitioner" },
      { key: "place", label: "Place", required: true },
      { key: "date", label: "Date", type: "date", defaultValue: today },
    ],
    templateText: `IN THE COURT OF {{courtName}}
{{location}}

Case No.: {{caseNo}}

IN THE MATTER OF:

{{petitionerName}}
S/o/D/o/W/o {{petitionerParentName}}
R/o {{petitionerAddress}}
                                    ...Petitioner

VERSUS

{{respondentName}}
S/o/D/o/W/o {{respondentParentName}}
R/o {{respondentAddress}}
                                    ...Respondent

MEMO OF PARTIES

1. {{petitionerName}} (Petitioner)
2. {{respondentName}} (Respondent)
{{additionalParties}}

Filed by:
{{advocateName}}
Counsel for the {{forParty}}

Place: {{place}}
Date: {{date}}`,
  },
];

export function getDraftTemplateById(id: string): DraftTemplateDefinition | undefined {
  return DRAFT_TEMPLATES.find((t) => t.id === id);
}

export function getInitialFieldValues(template: DraftTemplateDefinition): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of template.fields) {
    out[field.key] = field.defaultValue ?? "";
  }
  return out;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fallbackForField(fieldKey: string, template: DraftTemplateDefinition): string {
  const field = template.fields.find((f) => f.key === fieldKey);
  if (!field) return `[${fieldKey}]`;
  return `[${field.label.toUpperCase()}]`;
}

export function renderDraftFromTemplate(
  template: DraftTemplateDefinition,
  values: Record<string, string>
): { plainText: string; html: string } {
  const plainText = template.templateText.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => {
    const value = (values[key] ?? "").trim();
    return value || fallbackForField(key, template);
  });

  // Preserve legal formatting exactly for copy-paste use.
  const html = `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.55;">${escapeHtml(
    plainText
  )}</pre>`;

  return { plainText, html };
}
