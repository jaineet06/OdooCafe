# Odoo Cafe — Design System v2

All UI must be built from these tokens and `components/common/` primitives. No ad-hoc colors, spacing, or one-off component styles.

---

## Color System

### Semantic tokens (Admin + POS)

| Token | CSS variable | Value | Use |
|-------|--------------|-------|-----|
| bg-base | `--bg-base` | `#f5f0e8` | Page background |
| bg-elevated | `--bg-elevated` | `#faf8f4` | Cards, sidebar, modals |
| bg-sunken | `--bg-sunken` | `#ebe4d8` | Hover fills, inputs, chips |
| text-primary | `--text-primary` | `#2c2c2c` | Body, headings |
| text-secondary | `--text-secondary` | `#4a4a4a` | Labels, descriptions |
| text-muted | `--text-muted` | `#7a7268` | Hints, placeholders |
| border-subtle | `--border-subtle` | `#d9d0c4` | Dividers, card borders |
| accent-primary | `--accent-primary` | `#c25b3a` | Primary buttons, active nav |
| accent-primary-hover | `--accent-primary-hover` | `#a34a2f` | Primary hover |
| accent-success | `--accent-success` | `#6b7f6b` | Paid, available, success |
| accent-warning | `--accent-warning` | `#d4a853` | Draft, preparing |
| accent-danger | `--accent-danger` | `#b54040` | Cancel, delete, errors |
| brand-espresso | `--brand-espresso` | `#3b2314` | Display headings, dark accents |

### KDS high-contrast variant

| Token | Value | Use |
|-------|-------|-----|
| kds-bg | `#1a1410` | KDS page background |
| kds-surface | `#2c241c` | Ticket cards |
| kds-text | `#f5f0e8` | Primary text |
| kds-text-muted | `#a89e92` | Secondary text |
| kds-border | `#4a4038` | Card borders |

### Category colors

Dynamic per `category.color` from API. Use only as:
- 4px left border on list rows
- Small pill/tag on product cards
- Category filter pill when active

Never as full card backgrounds.

### Interactive color rule

Only **accent-primary** (terracotta) and **brand-espresso** for interactive elements. Success/warning/danger reserved for status semantics.

---

## Typography Scale

Fonts: **DM Serif Display** (display), **Work Sans** (body).

| Token | Size | Line-height | Weight | Use |
|-------|------|-------------|--------|-----|
| text-xs | 12px | 1.4 | 500 | Captions, badges |
| text-sm | 14px | 1.5 | 400–500 | Secondary body, labels |
| text-base | 16px | 1.5 | 400 | Default body |
| text-lg | 20px | 1.4 | 600 | Card titles |
| text-xl | 24px | 1.3 | 400 | Section headings (display) |
| text-2xl | 32px | 1.2 | 400 | Page titles (display) |
| text-3xl | 40px | 1.15 | 400 | Hero metrics |

### Hierarchy rules

- **H1 (page)**: `font-display text-2xl text-brand-espresso` — one per screen, in layout header
- **H2 (section)**: `font-display text-xl text-brand-espresso`
- **Section label**: `text-xs font-semibold uppercase tracking-wider text-text-muted`
- **Body**: `text-sm` or `text-base text-text-primary`

---

## Spacing Scale

Use only: **4, 8, 12, 16, 24, 32, 48, 64** (Tailwind: 1, 2, 3, 4, 6, 8, 12, 16).

| Context | Value |
|---------|-------|
| Page padding | `px-4 py-6 md:px-6` |
| Card padding | `p-4` (compact) or `p-6` (default) |
| Section gap | `gap-6` or `space-y-6` |
| Inline control gap | `gap-2` or `gap-3` |
| Sidebar expanded | `w-56` (224px) |
| Sidebar collapsed | `w-[4.25rem]` (68px) |
| Content max-width (admin) | `max-w-5xl` |
| Content max-width (POS detail) | `max-w-lg` |
| Content max-width (POS payment) | `max-w-2xl` |

---

## Elevation

**Flat + border** approach (no mixed shadows):

- Cards: `rounded-xl border border-border-subtle bg-bg-elevated`
- Modals: `rounded-2xl border border-border-subtle bg-bg-elevated` + backdrop `bg-text-primary/40`
- Hover lift: `transition-transform hover:-translate-y-0.5` only on interactive cards
- No arbitrary `shadow-lg` except modal backdrop context

---

## Component Primitives

All live in `client/src/components/common/`:

| Component | File | Notes |
|-----------|------|-------|
| Button | `Button.jsx` | primary/secondary/ghost/danger, sm/md/lg, loading, icon |
| Card | `Card.jsx` | padding variants, interactive |
| Input | `Input.jsx` | label, error, consistent h-11 |
| Select | `Select.jsx` | matches Input height |
| Toggle | `Toggle.jsx` | payment method enable |
| ColorInput | `ColorInput.jsx` | category color |
| Modal | `Modal.jsx` | GSAP enter/exit |
| Badge | `Badge.jsx` | neutral labels |
| StatusPill | `StatusPill.jsx` | order/table/payment status |
| Tabs | `Tabs.jsx` | category/method filters |
| SearchInput | `SearchInput.jsx` | icon + consistent styling |
| EmptyState | `EmptyState.jsx` | icon + title + description |
| Skeletons | `Skeletons.jsx` | page/card/table/row variants |
| AnimatedNumber | `AnimatedNumber.jsx` | dashboard count-up |
| PageToolbar | `PageToolbar.jsx` | search + filter row for CRUD |

POS-specific composites in `components/pos/`: `ProductCard`, `CartPanel`.

---

## Iconography

- **Library**: lucide-react only
- **Stroke**: 1.75 default; 2 for emphasis
- **Sizes**: 16 (inline), 18 (nav), 20 (buttons), 24 (empty states)
- No emoji in UI — use lucide icons

---

## Motion Catalog

Hooks in `client/src/hooks/useGsapAnimation.js`. Config in `client/src/motion/gsapConfig.js`.

| Pattern | Hook | Duration | Use |
|---------|------|----------|-----|
| Page enter | `usePageEnter` | 0.4s | Route content |
| Stagger list | `useStagger` | 0.35s, 0.05 stagger | Grids, lists |
| Modal | built into `Modal` | 0.3s | All dialogs |
| Sidebar | `useSidebarWidth` | 0.25s | Collapse |
| Count-up | `AnimatedNumber` | 0.8s | Dashboard metrics |
| Cart pulse | `usePulse` | 0.25s | Qty/total changes |

All animations respect `prefers-reduced-motion`.

---

## CRUD Page Template

Admin config screens follow:

```
AdminLayout (title + actions in header)
  └─ PageToolbar (search, filters) — optional
  └─ Card grid or ListRow list
  └─ EmptyState when no data
  └─ Modal for create/edit forms
```

---

## Before → After inconsistencies (baseline)

| Issue | Fix |
|-------|-----|
| Mixed `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-3xl` | Standardize: controls `rounded-lg`, cards `rounded-xl`, modals `rounded-2xl` |
| Ad-hoc reds (`red-700`, `red-50`) | Use `accent-danger` tokens |
| Emoji in cart empty state | `ShoppingCart` icon |
| Default browser `<select>` | `Select` component |
| Custom toggle in PaymentMethods | `Toggle` component |
| Per-page search inputs | `SearchInput` |
| Inconsistent status badges | `StatusPill` |
| `useGsapEntrance` copy-paste | Unified `useGsapAnimation` |
| Default toast styling | Themed in `App.jsx` |
