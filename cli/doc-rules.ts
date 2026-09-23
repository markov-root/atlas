/**
 * What each governed living document must actually contain.
 *
 * This table is the machine-checkable half of `docs/standards/documentation.md`.
 * The prose there says why each requirement exists and states the discriminating
 * test a human reviewer applies; this file encodes only what a script can decide.
 *
 * Deliberately limited: `engineering document validate` (from the
 * software-engineering skill) already covers the numbered record series under
 * docs/tasks, docs/adr, docs/audits, docs/handoffs and docs/lessons. It does NOT
 * cover the living documents, because declaring a living role in
 * `engineering.yaml` would force a 4-digit filename prefix on ARCHITECTURE.md
 * and friends - see docs/adr/0002. This checker closes exactly that gap, and
 * runs with no skill installed, so a fresh clone can verify conformance.
 *
 * Word floors are a blunt instrument on purpose. They do not measure quality;
 * they catch the specific failure this repo already made once - adding the
 * headings a standard names and filling them with something thin, then reporting
 * the standard adopted because a validator went green.
 */

export type SectionRule = {
  /**
   * Case-insensitive substring matched against `## ` / `### ` heading text.
   * An array accepts alternatives - the role fixes the requirement, not the
   * wording. The first entry is used as the display label.
   */
  heading: string | string[];
  /** Minimum words in the section body. Omitted means "must merely exist". */
  minWords?: number;
  /** One line on what this section has to actually establish. Shown on failure. */
  must: string;
};

export type PatternRule = {
  label: string;
  pattern: RegExp;
  minCount: number;
  must: string;
};

export type DocRule = {
  /** Repo-relative path, or a `*` glob over one directory. */
  path: string;
  role: string;
  /** The question a human reviewer answers that this script cannot. */
  discriminatingTest: string;
  sections: SectionRule[];
  patterns?: PatternRule[];
};

export const DOC_RULES: DocRule[] = [
  {
    path: 'docs/ARCHITECTURE.md',
    role: 'specification',
    discriminatingTest:
      'Can two reviewers classify the same boundary case alike, tracing each rule to an authorized need?',
    sections: [
      {
        heading: 'Failure semantics',
        minWords: 150,
        must: 'state, per pipeline stage, what happens on failure and what ships as a result',
      },
      {
        heading: 'Configuration precedence',
        minWords: 60,
        must: 'state which configuration source wins when BuildMode, process.env and the astro env schema disagree',
      },
      {
        heading: 'Mode boundaries',
        minWords: 60,
        must: 'specify the boundary cases between contributor and maintainer builds, not just describe the two modes',
      },
      {
        heading: 'Edition and language scope',
        minWords: 60,
        must: 'name what is edition-scoped, what is language-scoped, and who owns a divergence',
      },
    ],
  },
  {
    path: 'docs/PRINCIPLES.md',
    role: 'standard',
    discriminatingTest:
      'In a contested case, can a reviewer decide conformance and whether an exception is authorized, without hidden intent?',
    sections: [
      {
        heading: 'How this standard works',
        minWords: 150,
        must: 'name the issuer and adoption basis, the population bound, how a new exception is authorized and recorded, and how the standard itself changes',
      },
    ],
    patterns: [
      {
        label: 'binding/advisory tags on principles',
        pattern: /^##\s+\d+\..*\((binding|advisory)[^)]*\)/gim,
        minCount: 10,
        must: 'tag each numbered principle as binding or advisory, so a reviewer knows which can settle a dispute',
      },
    ],
  },
  {
    path: 'docs/DESIGN.md',
    role: 'standard',
    discriminatingTest:
      'In a contested case, can a reviewer decide conformance and whether an exception is authorized, without hidden intent?',
    sections: [
      {
        heading: ['Scope', 'who this binds', 'How this standard works'],
        minWords: 40,
        must: 'state which files and which people this standard binds',
      },
      {
        heading: ['Conformance and exceptions', 'Conformance', 'Exceptions'],
        minWords: 40,
        must: 'state how conformance is decided and how an exception gets authorized and recorded',
      },
    ],
  },
  {
    path: 'docs/ROADMAP.md',
    role: 'roadmap',
    discriminatingTest:
      'When reality diverges, can a reader tell which commitment changes and which evidence triggered it?',
    sections: [
      {
        heading: 'Not planned',
        minWords: 100,
        must: 'record explicitly rejected directions with reasons, so later work does not re-propose them',
      },
      {
        heading: 'Reconciliation with task',
        minWords: 40,
        must: 'reconcile roadmap items against the current state of task, ADR and audit records',
      },
    ],
    patterns: [
      {
        label: 'break triggers',
        pattern: /break trigger/gi,
        minCount: 3,
        must: 'state, per significant commitment, the observation that would change the plan',
      },
      {
        label: 'links to owning records',
        pattern: /\b(task|adr|audit):\d{4}\b/gi,
        minCount: 10,
        must: 'link committed items to the task or ADR record that owns them',
      },
    ],
  },
  {
    path: 'docs/runbooks/*.md',
    role: 'runbook',
    discriminatingTest:
      'When the riskiest step surprises the operator, can they reach a safe disposition and preserve evidence of what happened?',
    sections: [
      {
        heading: 'When to use',
        minWords: 40,
        must: 'state the entry conditions that identify this situation',
      },
      {
        heading: 'Mutations and reversibility',
        minWords: 60,
        must: 'state what each step changes and whether it can be undone',
      },
      {
        heading: 'Procedure',
        minWords: 100,
        must: 'give the steps, with a branch at the risky ones',
      },
      {
        heading: 'Outcome evidence',
        minWords: 40,
        must: 'state what proves the operation succeeded or did not',
      },
      {
        heading: 'Not known',
        minWords: 40,
        must: 'be honest about what is unestablished, so an operator does not improvise on a false premise',
      },
    ],
  },
  {
    path: 'docs/standards/documentation.md',
    role: 'standard',
    discriminatingTest:
      'In a contested case, can a reviewer decide conformance and whether an exception is authorized, without hidden intent?',
    sections: [
      {
        heading: ['Scope', 'who this binds', 'Issuer'],
        minWords: 40,
        must: 'state which documents and which people this standard binds',
      },
      {
        heading: ['Conformance and exceptions', 'automation can and cannot', 'Conformance'],
        minWords: 40,
        must: 'state how conformance is decided and how an exception gets authorized',
      },
    ],
  },
];
