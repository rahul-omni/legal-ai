// LegalEditor/components/lexical/initialConfig.ts
import type { InitialConfigType } from "@lexical/react/LexicalComposer";

// ➜ Core nodes (bundled with "lexical")
import { ParagraphNode, TextNode } from "lexical";

// ➜ Rich-text nodes for headings, lists, quotes, code blocks
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";

/* ───────────────────────────────────── theme (unchanged) ───────────────────────────────────── */
const theme = {
  code: "editor-code",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5",
  },
  image: "editor-image",
  link: "editor-link",
  list: {
    listitem: "editor-listitem",
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
  },
  ltr: "ltr",
  paragraph: "editor-paragraph",
  placeholder: "editor-placeholder",
  quote: "editor-quote",
  rtl: "rtl",
  text: {
    bold: "editor-text-bold",
    code: "editor-text-code",
    hashtag: "editor-text-hashtag",
    italic: "editor-text-italic",
    overflowed: "editor-text-overflowed",
    strikethrough: "editor-text-strikethrough",
    underline: "editor-text-underline",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
  },
};

/* ───────────────────────────────────── initialConfig ───────────────────────────────────── */
function onError(error: Error) {
  console.error("Lexical editor error:", error);
}

export const initialConfig: InitialConfigType = {
  namespace: "MyEditor",
  theme,
  onError,

  // 🔑 Register every Node class you want Lexical to recognise.
  nodes: [
    ParagraphNode,
    TextNode,      // required for any text
    HeadingNode,   // enables <h1-h6>
    ListNode,      // <ul>, <ol>
    ListItemNode,  // <li>
    QuoteNode,     // <blockquote>
    CodeNode,      // <pre><code>
  ],
};
