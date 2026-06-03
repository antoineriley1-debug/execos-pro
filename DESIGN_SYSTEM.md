# EXECOS Pro — Design System Documentation

## Overview

EXECOS Pro is an enterprise-grade design system built for MedStar facilities management. Every component, color, and interaction is crafted with executive-level polish, accessibility, and responsiveness in mind.

---

## 🎨 Color Palette

### Primary Colors (Dark Theme)

| Name | Hex | Usage |
|------|-----|-------|
| Ultra Dark | `#0f1219` | Page background |
| Deep Navy | `#1a2f4d` | Primary containers |
| Card BG | `#1f2937` | Card backgrounds |
| Hover State | `#2a3545` | Hover overlays |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Gold** | `#d4a574` | Primary CTA, highlights, emphasis |
| **Professional Blue** | `#4a90e2` | Secondary actions, links |
| **Success Green** | `#27ae60` | Positive status, success messages |
| **Warning Orange** | `#f39c12` | Warnings, pending states |
| **Danger Red** | `#e74c3c` | Errors, critical alerts |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#e8e8e8` | Headlines, body text |
| Secondary | `#9ca3af` | Descriptions, metadata |
| Muted | `#6b7280` | Disabled, helper text |

---

## 📝 Typography

### Font Stack
- **Headings**: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
- **Body**: Same as headings
- **Monospace**: Fira Code, Monaco, Courier New

### Font Sizes & Weights

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 48px | 700 Bold | 1.2 |
| H2 | 36px | 600 Semibold | 1.2 |
| H3 | 28px | 600 Semibold | 1.3 |
| H4 | 20px | 600 Semibold | 1.4 |
| H5 | 18px | 600 Semibold | 1.4 |
| Body | 16px | 400 Regular | 1.5 |
| Small | 14px | 400 Regular | 1.5 |
| Tiny | 12px | 400 Regular | 1.4 |
| Code | 14px | 400 Regular (Monospace) | 1.5 |

### Letter Spacing
- **Headlines**: +0.025em to +0.05em
- **Body**: 0em (normal)
- **Uppercase labels**: +0.05em

---

## 🎯 Component Library

### Buttons

**States**: Normal, Hover, Active, Disabled, Loading

**Variants**:
- `.btn-primary` — Gold background, primary CTA
- `.btn-secondary` — Navy background with gold border
- `.btn-tertiary` — Transparent with gold border
- `.btn-danger` — Red background for destructive actions
- `.btn-success` — Green background for confirmation
- `.btn-ghost` — Text-only, minimal styling

**Sizes**:
- `.btn-sm` — Small (32px height)
- `.btn` — Regular (40px height)
- `.btn-lg` — Large (48px height)

**Usage**:
```html
<button class="btn btn-primary">Save</button>
<button class="btn btn-secondary btn-lg">Cancel</button>
```

### Cards

**Variants**:
- `.card-base` — Standard padding, no special styling
- `.card-hover` — Lift effect on hover with elevated shadow
- `.card-bordered` — Gold accent border
- `.card-elevated` — Enhanced shadow

**Structure**:
```html
<div class="card card-base">
  <div class="card-header">
    <h3>Title</h3>
  </div>
  <div class="card-body">
    Content here
  </div>
  <div class="card-footer">
    Footer actions
  </div>
</div>
```

### Input Elements

**Types**: text, email, password, textarea, select, checkbox, radio

**Focus State**: Gold border with subtle glow ring

**Disabled State**: 50% opacity, cursor not-allowed

**Usage**:
```html
<div class="form-group">
  <label class="form-label">Email Address</label>
  <input type="email" class="input-base" placeholder="...">
  <p class="form-hint">Required field</p>
</div>
```

### Badges

**Variants**:
- `.badge-primary` — Gold background
- `.badge-success` — Green with transparency
- `.badge-warning` — Orange with transparency
- `.badge-danger` — Red with transparency

**Usage**:
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
```

### Status Indicators

**States**:
- `.status-active` — Green with glow
- `.status-pending` — Orange
- `.status-inactive` — Gray
- `.status-error` — Red with glow

**Size**: 12px diameter circle

**Usage**:
```html
<span class="status-indicator status-active"></span> Active
```

### Alerts

**Variants**:
- `.alert-success` — Green border-left
- `.alert-warning` — Orange border-left
- `.alert-danger` — Red border-left
- `.alert-info` — Blue border-left

**Structure**:
```html
<div class="alert alert-success">
  <div class="alert-icon">✓</div>
  <div class="alert-content">
    <div class="alert-title">Success!</div>
    <div class="alert-message">Your changes were saved.</div>
  </div>
</div>
```

### Tabs

**Structure**:
```html
<div class="tabs-container">
  <div class="tab-nav">
    <div class="tab-nav-item active">Tab 1</div>
    <div class="tab-nav-item">Tab 2</div>
  </div>
</div>

<div class="tab-content active">Content 1</div>
<div class="tab-content">Content 2</div>
```

### Tables

**Features**:
- Sticky header
- Hover row highlight
- Zebra striping (nth-child alternation)
- Responsive scroll wrapper

**Usage**:
```html
<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Modals

**Usage**:
```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Confirm Action</h2>
      <span class="modal-close">×</span>
    </div>
    <div class="modal-body">
      Are you sure?
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-danger">Delete</button>
    </div>
  </div>
</div>
```

### Loading States

**Spinner**:
```html
<div class="spinner"></div>
<div class="spinner spinner-lg"></div>
```

**Skeleton Screens**:
```html
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-avatar"></div>
```

### Avatars

**Sizes**:
- `.avatar-sm` — 32px (8px text)
- `.avatar-md` — 48px (12px text)
- `.avatar-lg` — 64px (16px text)
- `.avatar-xl` — 80px (18px text)

**Usage**:
```html
<div class="avatar avatar-md">JD</div>
<div class="avatar avatar-md"><img src="..."></div>
```

### Dropdowns

**Usage**:
```html
<div class="dropdown">
  <button class="dropdown-trigger">Menu</button>
  <div class="dropdown-menu">
    <div class="dropdown-item">Option 1</div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item">Option 2</div>
  </div>
</div>
```

---

## ✨ Animations & Transitions

### Duration Standards
- **Fast**: 100-150ms (micro-interactions)
- **Base**: 200ms (standard transitions)
- **Slow**: 300-500ms (page transitions)

### Easing Functions
- **ease-in**: `cubic-bezier(0.4, 0, 1, 1)` — Acceleration
- **ease-out**: `cubic-bezier(0, 0, 0.2, 1)` — Deceleration
- **ease-in-out**: `cubic-bezier(0.4, 0, 0.2, 1)` — Smooth
- **ease-smooth**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — Professional

### Pre-built Animations
- `.fade-in` — Opacity 0 → 1
- `.slide-in-top` — translateY -20px → 0
- `.scale-in` — scale 0.95 → 1
- `.bounce-in` — Eased scale bounce
- `.pulse` — Opacity pulsing
- `.glow` — Box-shadow glow effect

### Hover Effects
- `.hover-lift` — Subtle Y-axis translation + shadow
- `.hover-glow` — Gold glow on hover
- `.hover-underline` — Animated underline

---

## 📐 Spacing & Layout

### Grid System
- **Base unit**: 8px
- **Multiples**: 8, 12, 16, 20, 24, 32, 40, 48, etc.

### Component Padding
- **Cards**: 24px (standard), 16px (compact), 32px (large)
- **Buttons**: 12px vertical, 24px horizontal
- **Form inputs**: 12px vertical, 16px horizontal
- **Container**: 16px (mobile), 24px (tablet), 32px (desktop)

### Margins
- **Section spacing**: 48px
- **Card spacing**: 24px
- **Item spacing**: 16px
- **Inline spacing**: 8px

### Responsive Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1399px
- **Large Desktop**: 1400px+

---

## 🎭 Shadow System

| Level | Box-Shadow | Usage |
|-------|-----------|-------|
| **xs** | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle emphasis |
| **sm** | `0 1px 3px 0 rgba(0,0,0,0.1)` | Light depth |
| **base** | `0 4px 6px -1px rgba(0,0,0,0.1)` | Standard card |
| **md** | `0 10px 15px -3px rgba(0,0,0,0.1)` | Medium elevation |
| **lg** | `0 20px 25px -5px rgba(0,0,0,0.1)` | Large elevation |
| **card** | Custom | Card default |
| **card-hover** | Custom | Card hover state |
| **gold-glow** | `0 0 20px rgba(212,165,116,0.3)` | Accent glow |

---

## ♿ Accessibility

### Contrast Ratios
- **AAA Compliant**: All text on background meets 7:1 contrast minimum
- **High contrast**: Text/icons always legible against backgrounds
- **Focus indicators**: 2px gold outline with offset

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus states clearly visible (gold ring)

### ARIA Labels
- All buttons have descriptive labels
- Form inputs have associated labels
- Icons include title attributes

### Color Usage
- Status never conveyed by color alone
- Icons always paired with text
- Patterns used in addition to color

---

## 🎯 Best Practices

### Do's ✓
- Use gold accent for CTAs and primary actions
- Maintain consistent spacing with 8px grid
- Provide clear loading/empty states
- Test at mobile, tablet, and desktop sizes
- Use semantic HTML (h1-h6, button, form, etc.)
- Ensure sufficient color contrast
- Provide visual feedback on interactions

### Don'ts ✗
- Don't use pure black (#000000) — use dark navy (#0f1219)
- Don't make rounded corners "cute" — use 6-12px radius
- Don't animate transitions under 150ms or over 500ms
- Don't nest shadows excessively
- Don't use color alone for status indication
- Don't disable hover/focus states
- Don't ignore mobile responsiveness

---

## 📱 Responsive Design

### Mobile (320px - 767px)
- Single column layouts
- Full-width cards and buttons
- Hamburger navigation
- Touch-friendly (44px+ tap targets)
- Generous vertical spacing

### Tablet (768px - 1023px)
- 2-column layouts where appropriate
- Sidebar collapsible
- Grid auto-fit for cards
- Balanced spacing

### Desktop (1024px+)
- Full multi-column layouts
- Sidebar expanded
- Optimized line lengths (45-75 characters)
- Generous whitespace

---

## 🔧 Implementation Guide

### Installation

1. Import CSS files in order:
```html
<link rel="stylesheet" href="css/tailwind.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/animations.css">
```

2. Import Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet">
```

### Using Tailwind Classes

The system includes a comprehensive Tailwind configuration. Use utility classes directly:

```html
<!-- Colors -->
<div class="bg-primary-900 text-accent">Gold on navy</div>

<!-- Spacing -->
<div class="p-8 mb-12 gap-6">Padded with margin-bottom and gap</div>

<!-- Text -->
<h2 class="text-2xl font-semibold text-text-primary">Heading</h2>

<!-- Responsive -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Grid auto-responsive
</div>
```

### Custom Components

Extend with custom component classes in `components.css`:

```css
.my-custom-component {
  @apply bg-primary-900 border border-border-DEFAULT rounded-lg p-6;
}

.my-custom-component:hover {
  @apply shadow-lg border-accent;
}
```

---

## 📊 Page Templates

### Dashboard
- KPI cards in responsive grid
- Recent activity list
- Site status cards
- Quick actions section
- Timeline/deadlines

### Email Intelligence
- Paste/input area
- Email list (collapsible on mobile)
- Analysis results panel
- AI-powered insights

### Project View
- Project header with status
- Tabbed navigation
- Linked items and documents
- Contact cards
- Timeline view

### Contract Review
- Drag-and-drop upload
- AI risk assessment
- Key terms cards
- Vendor comparison table
- Version history

### Search Results
- Search bar with filters
- AI answer summary
- Results grid/list
- Pagination
- Search tips

---

## 🚀 Performance Considerations

### CSS
- Minify before production
- Use CSS grid/flexbox for layouts (not floats)
- Avoid excessive nesting in selectors
- Leverage CSS variables for dynamic theming

### Images
- Use SVG for icons where possible
- Optimize PNG/JPEG images
- Lazy load below-fold images
- Use responsive images (srcset)

### JavaScript
- Minimize DOM manipulation
- Debounce scroll/resize listeners
- Use CSS transitions over JS animations
- Lazy load components below fold

---

## 🎓 Design Philosophy

EXECOS Pro follows these principles:

1. **Executive Polish** — Every pixel is intentional
2. **Dark Elegance** — Navy and gold create premium feel
3. **Generous Whitespace** — Breathing room between elements
4. **Professional Typography** — Clear hierarchy and readability
5. **Smooth Interactions** — Purposeful, not overdone
6. **Accessibility First** — Inclusive by design
7. **Responsive Intent** — Mobile-first, intentional at all sizes
8. **Consistency** — Unified language across all pages

---

## 📞 Questions?

For questions about the design system, refer to:
- Component examples in `index.html`
- Page templates (dashboard.html, project-view.html, etc.)
- CSS source files (tailwind.css, components.css, animations.css)
- This documentation file

**Remember**: Consistency is key. Before deviating from the system, consider the impact on the overall user experience.
