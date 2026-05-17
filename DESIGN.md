---
name: "박민재 포트폴리오"
description: "AI, NLP, RAG, LLM Agent 연구 준비도를 보여주는 대학원 연구실 지원용 포트폴리오."
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

# 디자인 시스템: 박민재 포트폴리오

## 1. Overview

**Creative North Star: "제품처럼 읽히는 연구 포트폴리오"**

이 시스템은 잘 정리된 연구 지원 dossier에 제품 인터페이스의 스캔 가능성을 결합한 형태여야 한다. 핵심 독자는 교수 및 PI이므로, 화면의 첫 질서는 개성보다 증거를 먼저 보여준다. 논문, 역할, 지표, 프로젝트, 연구 방향, 다음 질문이 빠르게 읽혀야 한다.

표면은 조용하지만 약하지 않아야 한다. 압축된 대형 디스플레이 타이포그래피, 정밀한 mono 라벨, 엄격한 증거 블록, 절제된 테마 전환이 "꾸민 페이지"가 아니라 "준비된 연구자"라는 인상을 만든다. 프로젝트 섹션은 실제로 만든 시스템을 보여주는 영역이므로 더 선명한 색과 움직임을 가질 수 있지만, 연구 서사는 항상 읽기 쉬운 구조를 유지해야 한다.

이 시스템은 PRODUCT.md의 안티 레퍼런스를 그대로 거부한다: 과하게 스타트업 랜딩처럼 보이는 것, 너무 학생 포트폴리오 같은 느낌, AI Slop 처럼 보이는 것, 너무 난잡한 구성 및 장황한 내용.

**Key Characteristics:**

- 증거 우선 위계: 긴 설명보다 지표, 역할, 게재지, 산출물이 먼저 보인다.
- 제품형 스캔 구조: 섹션, 배지, 카드, 캐러셀은 빠른 비교를 위해 조정된다.
- 연구 중심 절제: 기본 표면은 중립적이고 타이포그래피 중심이며, 색은 의미 있는 태그나 프로젝트 세계에만 붙는다.
- 세심함을 보여주는 모션: reveal, 캐러셀, 프리뷰 움직임은 방향 감각을 돕고, 과시가 되면 안 된다.

## 2. Colors

팔레트는 절제된 연구 문서형 neutral과 프로젝트별 full accent set의 조합이다. neutral은 신뢰감을 만들고, 색은 연구 도메인과 프로젝트 정체성을 구분한다.

### Primary

- **Research Blue**: 주요 액션, 링크, AI/NLP 정체성을 담당한다. Contact, 활성 강조, 논문 링크, brand badge에 사용한다.
- **Deep Research Blue**: 더 강한 프로젝트 카드 블루와 hover 색이다. ARIS처럼 권위 있고 선명한 project world가 필요할 때 사용한다.
- **Soft Research Blue**: 부담이 낮은 badge fill이다. 태그와 작은 강조에만 사용한다.

### Secondary

- **Evidence Green**: 검증된 상태, biomedical 태그, "In Dev" 상태, 진행 신호에 사용한다.
- **Signal Red**: RAG나 긴급성이 있는 태그에 사용한다. 단, error 상태처럼 읽히지 않게 제한한다.
- **Agent Purple**: LLM Agent와 research idea를 표시한다. 본문 섹션에서는 적게, project world 안에서는 더 자유롭게 사용할 수 있다.

### Tertiary

- **Study Yellow**: 하이라이트 텍스트, reading/study 신호, 따뜻한 강조에 사용한다.
- **Prism Pink, Retrieval Teal, System Orange**: 프로젝트 세계 전용 accent다. 프로젝트 카드 안에서는 몰입감 있게 쓸 수 있지만, 핵심 연구 표면에는 장식으로 흘러들어오면 안 된다.

### Neutral

- **Surface Base**: 기본 light page surface.
- **Surface Muted**: hero facts, empty state 같은 낮은 대비 컨테이너.
- **Surface Raised**: divider, soft panel, neutral chip fill.
- **Ink**: 기본 텍스트와 inverse panel 배경.
- **Ink Soft / Ink Muted**: 본문 보조 정보, 메타데이터, 스캔 라벨.
- **Border Subtle / Border Strong**: divider, card frame, top navigation, focus contrast.

### Named Rules

**증거 색상 규칙.** 색은 연구 도메인, 프로젝트 계열, 상태 중 하나를 식별해야 한다. "이 색이 어떤 증거를 분류하는가"에 답하지 못하면 제거한다.

**Neutral First 규칙.** Research와 Experience 섹션은 neutral surface에서 시작한다. 포화된 색은 tag, link, cover, project card에 둔다. 일반 섹션 배경을 색으로 채우지 않는다.

**No AI Slop 규칙.** neon blue, purple gradient, 장식적 AI glow를 추가하지 않는다. 기존 gradient는 project preview world에 연결되어 있을 때만 허용된다.

## 3. Typography

**Display Font:** Inter Tight, Inter 및 Pretendard fallback

**Body Font:** Inter, Pretendard Variable 및 system sans fallback

**Label/Mono Font:** JetBrains Mono

**Character:** 이 조합은 압축적이고 학술적이며 interface-native한 인상을 만든다. Inter Tight는 headline의 자신감을 담당하고, Pretendard는 한국어 본문 가독성을 지킨다. JetBrains Mono는 label, number, metadata, evidence stamp에만 사용한다.

### Hierarchy

- **Display** (800, `clamp(48px, 8vw, 112px)`, 0.98): hero headline 전용이다. 페이지가 하나의 지배적 주장만 가져야 할 때 사용한다.
- **Headline** (700, `clamp(28px, 4vw, 48px)`, 1.05): contact headline, 큰 section claim, paper-detail title에 사용한다.
- **Title** (700, `clamp(24px, 2.6vw, 32px)`, 1.2): section title과 feature card title에 사용한다.
- **Body** (400 to 600, 15px to 20px, 1.55): 설명 본문이다. line length는 56 to 72ch 근처로 유지하고, 첫 문장이 실제 정보를 담아야 한다.
- **Label** (JetBrains Mono, 10px to 11.5px, 0.08em to 0.18em, uppercase): section eyebrow, badge, counter, status chip, project metadata에 사용한다.

### Named Rules

**One Claim Per Fold 규칙.** Display type은 한 fold의 단 하나의 주장에만 사용한다. 모든 heading이 소리치면 교수/PI는 증거를 찾을 수 없다.

**Mono Is Evidence 규칙.** Mono label은 metadata, count, date, role, navigation을 표시해야 한다. "기술적으로 보이기 위해" mono를 쓰지 않는다.

## 4. Elevation

이 시스템은 기본적으로 flat하고, 구조로 layer를 만든다. 대부분의 깊이는 tonal contrast, border, sticky positioning, grid rhythm에서 나온다. shadow는 item이 interactive하거나 project scene이 active일 때만 나타난다.

### Shadow Vocabulary

- **Soft Surface Shadow** (`0 1px 2px rgba(0,0,0,0.04), 0 4px 14px -6px rgba(0,0,0,0.08)`): light theme surface의 낮은 ambient separation.
- **Feature Lift** (`0 12px 40px -12px rgba(0,0,0,0.18)`): media card와 elevated content block의 hover lift.
- **Project Active Lift** (`0 36px 90px rgba(0,0,0,.18), 0 8px 16px rgba(0,0,0,.08)`): active project scene card 전용.
- **Device Mockup Shadow** (`0 30px 50px -10px rgba(0,0,0,.45), inset 0 0 0 1.5px rgba(255,255,255,.08)`): phone 및 product preview mockup의 물리감.

### Named Rules

**Flat Until Proven 규칙.** surface는 interaction, active scene state, device realism 중 하나를 증명할 때만 shadow를 얻는다. 기본 content card는 border, rhythm, type으로 버틴다.

## 5. Components

### Buttons

- **Shape:** compact rounded rectangle (8px radius).
- **Primary:** inverse ink fill과 surface text를 사용한다. 36px height, 14px horizontal padding. sales CTA가 아니라 명확한 command처럼 읽혀야 한다.
- **Hover / Focus:** primary는 brightness lift, secondary는 muted background를 사용한다. focus는 border contrast를 유지한다.
- **Secondary:** transparent background와 strong border를 유지한다. "Read paper" 옆의 "Research detail"처럼 peer action에 사용한다.

### Chips

- **Style:** 작은 mono uppercase badge (20px height, 6px radius, 0 8px padding).
- **State:** badge color는 topic 또는 status를 식별한다. pressable `.chip` filter는 full-pill radius를 쓰고 selected 상태에서 inverse 처리한다.
- **Rule:** chip은 metadata이지 장식이 아니다. PI가 증거를 분류하는 데 도움을 주지 않는 chip은 제거한다.

### Cards / Containers

- **Corner Style:** research evidence card는 16px to 24px radius를 사용한다. project scene card는 immersive gradient와 함께 24px를 사용한다.
- **Background:** research card는 muted neutral surface를 사용하고, project card는 프로젝트별 saturated world를 사용한다.
- **Shadow Strategy:** 기본은 flat이다. hover 또는 active-scene 상태에서만 lift를 줄 수 있다.
- **Border:** research와 contact row에는 얇은 neutral border를 사용한다. project card는 내부 translucent divider를 사용한다.
- **Internal Padding:** facts는 22px, 일반 card는 28px to 40px, desktop project scene은 52px를 기준으로 한다.

### Inputs / Fields

- **Style:** search-style field는 muted background, 12px radius, 36px height, thin border, inline mono keyboard hint를 사용한다.
- **Focus:** border는 `Ink`로 이동하고, background는 `Surface Base`가 된다.
- **Error / Disabled:** 아직 별도 error system은 없다. 실제 form flow가 생길 때만 추가한다.

### Navigation

- **Style:** 56px row height의 sticky translucent top navigation. blur overlay와 1px bottom border를 사용한다.
- **Typography:** logo는 display font 16px, 700 weight를 사용한다. nav link는 14px medium sans를 사용한다.
- **Default / Hover / Active:** link는 기본 상태에서 조용해야 한다. hover 또는 current 상태에서 muted background와 primary text로 전환한다.
- **Mobile Treatment:** 900px 아래에서는 nav link를 숨긴다. 560px 아래에서는 compact mark를 남기고 full logo text를 숨긴다.

### Signature Component: Project Scene Card

Project card는 full-screen evidence world다. saturated project-specific background, 큰 one-line project phrase, right-side carousel, bottom identity bar를 결합한다. 실제로 만든 시스템을 보여줄 때만 사용한다. generic research card나 study list에는 재사용하지 않는다.

### Signature Component: Paper Hero Cover

Paper detail page는 large dark cover, PDF preview, paper metadata, metric card를 사용한다. 사이트에서 가장 학술적인 컴포넌트이므로 preview spectacle보다 legibility를 우선한다. PDF preview가 title을 위협하면 title readability가 이긴다.

## 6. Do's and Don'ts

### Do:

- **Do** publication, role, metric, research direction을 긴 설명보다 먼저 보이게 한다.
- **Do** research section은 neutral-first로 유지하고, 색은 evidence classification에 사용한다.
- **Do** compact button, badge, fact-card dimension을 보존한다. 이 크기가 페이지를 scannable하게 만든다.
- **Do** project-world color는 built system 또는 visual artifact를 보여줄 때만 사용한다.
- **Do** reduced motion을 존중한다. reveal, parallax, carousel, PDF preview motion은 content를 숨기지 않고 degrade되어야 한다.
- **Do** 교수/PI의 scan context를 기준으로 각 섹션이 무엇을 했고, 왜 중요하며, 무엇을 증명하는지 답하게 한다.

### Don't:

- **Don't** 과하게 스타트업 랜딩처럼 보이게 만들지 않는다. salesy hero metric, generic CTA stack, investor-style product hype를 피한다.
- **Don't** 너무 학생 포트폴리오 같은 느낌으로 만들지 않는다. skill-list filler, assignment-card grid, 얕은 "about me" framing을 피한다.
- **Don't** AI Slop 처럼 보이게 만들지 않는다. decorative AI icon, neon gradient, 장식용 glass panel, generic blue-purple glow를 피한다.
- **Don't** 너무 난잡한 구성 및 장황한 내용으로 만들지 않는다. 방문자가 5초 안에 무엇을 했는지 알 수 없다면 copy를 줄이거나 evidence hierarchy를 강화한다.
- **Don't** colored side-stripe border, gradient text, decorative glassmorphism을 사용하지 않는다. 이 시스템에서는 금지된 패턴이다.
- **Don't** 동일한 icon-card grid를 반복하지 않는다. 이 포트폴리오의 rhythm은 evidence card, research detail, project scene에서 나온다.
