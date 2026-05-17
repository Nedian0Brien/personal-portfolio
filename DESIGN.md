---
name: "Minjae Park Portfolio"
description: "A research-ready graduate school portfolio for AI, NLP, RAG, and LLM Agent work."
colors:
  surface-base: "#FFFFFF"
  surface-muted: "#F5F5F5"
  surface-raised: "#EDEDED"
  ink: "#141414"
  ink-soft: "#707070"
  ink-muted: "#878787"
  border-subtle: "#EDEDED"
  border-strong: "#DBDBDB"
  research-blue: "#0A6CFF"
  research-blue-strong: "#005AE0"
  research-blue-soft: "#D6E7FF"
  signal-red: "#E04300"
  evidence-green: "#188B52"
  study-yellow: "#D69600"
  agent-purple: "#6826D9"
  prism-pink: "#F04C9E"
  retrieval-teal: "#20B6B6"
  system-orange: "#FF8214"
typography:
  display:
    fontFamily: "Inter Tight, Inter, Pretendard Variable, Pretendard, sans-serif"
    fontSize: "clamp(48px, 8vw, 112px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter Tight, Inter, Pretendard Variable, Pretendard, sans-serif"
    fontSize: "clamp(28px, 4vw, 48px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Tight, Inter, Pretendard Variable, Pretendard, sans-serif"
    fontSize: "clamp(24px, 2.6vw, 32px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, Pretendard Variable, Pretendard, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.003em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "22px"
  xl: "40px"
  gutter: "clamp(24px, 5vw, 72px)"
  section: "clamp(72px, 8vw, 112px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface-base}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.surface-base}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  badge-brand:
    backgroundColor: "{colors.research-blue-soft}"
    textColor: "{colors.research-blue-strong}"
    rounded: "{rounded.xs}"
    padding: "0 8px"
    height: "20px"
    typography: "{typography.label}"
  evidence-card:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "22px"
  project-scene-card:
    backgroundColor: "{colors.research-blue-strong}"
    textColor: "{colors.surface-base}"
    rounded: "{rounded.xl}"
    padding: "52px 52px 38px"
---

# Design System: Minjae Park Portfolio

## 1. Overview

**Creative North Star: "A Research Dossier With Product Clarity"**

This system should feel like a carefully prepared research dossier that has learned the scanning discipline of a product interface. The primary reader is a professor or PI, so the visual order must make evidence visible before personality: publication, role, metric, project, research direction, next question.

The surface is quiet, but it is not timid. Large compressed display type, precise mono labels, strict evidence blocks, and restrained theme switching create a portfolio that looks prepared rather than decorated. The project section is allowed to become more vivid because it is showing built systems, but the research narrative must remain legible and controlled.

It rejects the exact anti-references in PRODUCT.md: 과하게 스타트업 랜딩처럼 보이는 것, 너무 학생 포트폴리오 같은 느낌, AI Slop 처럼 보이는 것, 너무 난잡한 구성 및 장황한 내용.

**Key Characteristics:**

- Evidence-first hierarchy: metrics, roles, venues, and outputs appear before long explanation.
- Product-like scanning: sections, badges, cards, and carousels are tuned for fast comparison.
- Research restraint: the default field is neutral and typographic; color appears as a semantic tag or project world.
- Motion as proof of care: reveal and carousel motion supports orientation, never spectacle.

## 2. Colors

The palette is restrained neutral research paper plus a full project accent set. Neutrals carry credibility; color names research domains and project identities.

### Primary

- **Research Blue**: Primary action, link, and AI/NLP identity color. Use for Contact, active emphasis, paper links, and brand badges.
- **Deep Research Blue**: Stronger project card blue and hover color. Use when a surface needs saturated authority, especially ARIS and brand-forward project cards.
- **Soft Research Blue**: Low-pressure badge fill. Use for tags and small emphasis only.

### Secondary

- **Evidence Green**: Verified state, biomedical tags, "In Dev" status, and progress signals.
- **Signal Red**: RAG or alert-like tags where the information needs urgency without becoming an error state.
- **Agent Purple**: LLM Agent and research-idea tagging. Use sparingly in content sections and more freely inside project worlds.

### Tertiary

- **Study Yellow**: Highlighted text, reading/study signals, and warm emphasis.
- **Prism Pink, Retrieval Teal, System Orange**: Project-world accents. They are allowed to be immersive inside project cards, but should not leak into the core research-reading surface as decoration.

### Neutral

- **Surface Base**: Main light page surface.
- **Surface Muted**: Low-contrast containers such as hero facts and empty states.
- **Surface Raised**: Divider, soft panel, and neutral chip fill.
- **Ink**: Primary text and inverse panel background.
- **Ink Soft / Ink Muted**: Secondary body, metadata, and scanning labels.
- **Border Subtle / Border Strong**: Dividers, card frames, top navigation, and focus contrast.

### Named Rules

**The Evidence Color Rule.** Color must identify a research domain, project family, or state. If the color does not answer "what kind of evidence is this?", remove it.

**The Neutral First Rule.** Research and experience sections start from neutral surfaces. Saturated color belongs to tags, links, covers, and project cards, not to generic section backgrounds.

**The No AI Slop Rule.** Do not add neon-blue, purple-gradient, or decorative AI glow treatments. The existing gradients are tied to project preview worlds and must stay there.

## 3. Typography

**Display Font:** Inter Tight, with Inter and Pretendard fallback

**Body Font:** Inter and Pretendard Variable, with system sans fallback

**Label/Mono Font:** JetBrains Mono

**Character:** The pairing is compressed, academic, and interface-native. Inter Tight carries headline confidence; Pretendard keeps Korean body copy readable; JetBrains Mono is reserved for labels, numbers, metadata, and evidence stamps.

### Hierarchy

- **Display** (800, `clamp(48px, 8vw, 112px)`, 0.98): Hero headline only. Use it when the page needs one dominant claim.
- **Headline** (700, `clamp(28px, 4vw, 48px)`, 1.05): Contact headline, large section claims, and paper-detail titles.
- **Title** (700, `clamp(24px, 2.6vw, 32px)`, 1.2): Section titles and feature card titles.
- **Body** (400 to 600, 15px to 20px, 1.55): Explanatory copy. Keep body line length near 56 to 72ch, and make the first sentence do real work.
- **Label** (JetBrains Mono, 10px to 11.5px, 0.08em to 0.18em, uppercase): Section eyebrows, badges, counters, status chips, and project metadata.

### Named Rules

**The One Claim Per Fold Rule.** Display type is for one claim, not for every section. If every heading shouts, the professor cannot find the evidence.

**The Mono Is Evidence Rule.** Mono labels must mark metadata, counts, dates, roles, or navigation. Do not use mono as a generic "technical" costume.

## 4. Elevation

The system is flat by default and layered by structure. Most depth comes from tonal contrast, borders, sticky positioning, and grid rhythm. Shadows appear only when an item is interactive or when a project scene becomes active.

### Shadow Vocabulary

- **Soft Surface Shadow** (`0 1px 2px rgba(0,0,0,0.04), 0 4px 14px -6px rgba(0,0,0,0.08)`): Low ambient separation for light-theme surfaces.
- **Feature Lift** (`0 12px 40px -12px rgba(0,0,0,0.18)`): Hover lift for media cards and elevated content blocks.
- **Project Active Lift** (`0 36px 90px rgba(0,0,0,.18), 0 8px 16px rgba(0,0,0,.08)`): Active project scene card only.
- **Device Mockup Shadow** (`0 30px 50px -10px rgba(0,0,0,.45), inset 0 0 0 1.5px rgba(255,255,255,.08)`): Phone and preview mockups.

### Named Rules

**The Flat Until Proven Rule.** A surface earns shadow only through interaction, active scene state, or device realism. Default content cards should rely on border, rhythm, and type.

## 5. Components

### Buttons

- **Shape:** Compact rounded rectangle (8px radius).
- **Primary:** Inverse ink fill with surface text, 36px height, 14px horizontal padding. It reads as a clear command without becoming a sales CTA.
- **Hover / Focus:** Primary uses brightness lift; secondary uses muted background. Focus must retain border contrast.
- **Secondary:** Transparent background, strong border, same size. Use for peer actions such as "Research detail" beside "Read paper".

### Chips

- **Style:** Small mono uppercase badges (20px height, 6px radius, 0 8px padding).
- **State:** Badge color identifies topic or status. Pressable `.chip` filters use full-pill radius and invert when selected.
- **Rule:** Chips are metadata, not decoration. A chip that does not help a PI classify evidence should be removed.

### Cards / Containers

- **Corner Style:** Research evidence cards use 16px to 24px radii. Project scene cards use 24px with immersive gradients.
- **Background:** Research cards use muted neutral surfaces; project cards use saturated per-project worlds.
- **Shadow Strategy:** Flat at rest. Hover or active-scene states may lift.
- **Border:** Thin neutral borders for research and contact rows; project cards use internal translucent dividers.
- **Internal Padding:** 22px for facts, 28px to 40px for cards, 52px for desktop project scenes.

### Inputs / Fields

- **Style:** Search-style fields use muted background, 12px radius, 36px height, thin border, and inline mono keyboard hints.
- **Focus:** Border shifts to `Ink`; background becomes `Surface Base`.
- **Error / Disabled:** No distinct error system exists yet. Add one only when a real form flow appears.

### Navigation

- **Style:** Sticky translucent top navigation with 56px row height, blurred overlay, and a one-pixel bottom border.
- **Typography:** Logo uses display font at 16px and 700 weight; nav links use 14px medium sans.
- **Default / Hover / Active:** Links are quiet until hovered or current, then shift to muted background and primary text.
- **Mobile Treatment:** Hide nav links below 900px; hide full logo text below 560px while preserving the compact mark.

### Signature Component: Project Scene Card

Project cards are full-screen evidence worlds. They combine a saturated project-specific background, a large one-line project phrase, a right-side carousel, and a bottom identity bar. Use them for built systems only. Do not reuse this component for generic research cards or study lists.

### Signature Component: Paper Hero Cover

The paper detail page uses a large dark cover, PDF preview, paper metadata, and metric cards. It is the site's most academic component and should favor legibility over preview spectacle. If the PDF preview threatens the title, title readability wins.

## 6. Do's and Don'ts

### Do:

- **Do** make publication, role, metric, and research direction visible before long explanation.
- **Do** keep research sections neutral-first and use color to classify evidence.
- **Do** preserve the compact button, badge, and fact-card dimensions. They make the page feel scannable.
- **Do** use project-world color only when the section is showing a built system or visual artifact.
- **Do** honor reduced motion. Reveal, parallax, carousel, and PDF preview motion must degrade without hiding content.
- **Do** keep professor/PI scanning in mind: each section should answer what was done, why it matters, and what it proves.

### Don't:

- **Don't** make it feel 과하게 스타트업 랜딩처럼 보이는 것. Avoid salesy hero metrics, generic CTA stacks, and investor-style product hype.
- **Don't** make it feel 너무 학생 포트폴리오 같은 느낌. Avoid skill-list filler, assignment-card grids, and shallow "about me" framing.
- **Don't** make it feel AI Slop 처럼 보이는 것. Avoid decorative AI icons, neon gradients, glass panels as decoration, and generic blue-purple glow.
- **Don't** make it too 난잡한 구성 및 장황한 내용. If a visitor cannot tell what was done in five seconds, cut copy or strengthen the evidence hierarchy.
- **Don't** use colored side-stripe borders, gradient text, or decorative glassmorphism. These are banned patterns for this system.
- **Don't** repeat identical icon-card grids. This portfolio's rhythm comes from evidence cards, research details, and project scenes, not template feature cards.
