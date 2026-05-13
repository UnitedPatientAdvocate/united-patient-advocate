import { useState } from "react";
import { billingGlossary, glossaryTerms } from "./billingGlossary.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termPattern = new RegExp(`\\b(${glossaryTerms.map(escapeRegExp).join("|")})\\b`, "gi");

export function TermTooltip({ term }) {
  const [open, setOpen] = useState(false);
  const key = term.toLowerCase();
  const definition = billingGlossary[key];

  if (!definition) return term;

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        title={definition}
        aria-expanded={open}
        aria-label={`${term}: ${definition}`}
        onClick={(event) => {
          event.preventDefault();
          setOpen(value => !value);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 160)}
        style={{
          background: "rgba(47,122,79,0.1)",
          border: "1px solid rgba(47,122,79,0.22)",
          borderRadius: 6,
          color: "inherit",
          cursor: "help",
          font: "inherit",
          fontWeight: 800,
          lineHeight: 1.35,
          padding: "0 4px",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textUnderlineOffset: 3
        }}
      >
        {term}
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 40,
            left: 0,
            top: "calc(100% + 6px)",
            width: "min(260px, 78vw)",
            background: "#fff",
            border: "1px solid rgba(15,23,42,0.14)",
            borderRadius: 12,
            boxShadow: "0 12px 28px rgba(15,23,42,0.18)",
            color: "#334155",
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.55,
            padding: "10px 12px",
            textAlign: "left"
          }}
        >
          {definition}
        </span>
      )}
    </span>
  );
}

export function AnnotatedParagraph({ text, color = "inherit", style = {} }) {
  const content = String(text || "");
  if (!content.trim()) return null;

  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const pieces = paragraph.split(termPattern);
        return (
          <p key={`${paragraphIndex}-${paragraph.slice(0, 18)}`} style={{ margin: paragraphIndex ? "12px 0 0" : 0, color, lineHeight: 1.8, overflowWrap: "anywhere", ...style }}>
            {pieces.map((piece, index) => {
              const definition = billingGlossary[piece.toLowerCase?.()];
              return definition ? <TermTooltip key={`${piece}-${index}`} term={piece} /> : piece;
            })}
          </p>
        );
      })}
    </>
  );
}
