# Draft — a focus-centered creative OS

a focus-centered creative OS — notes, scrapbook, shot lists, and screenwriting in one distraction-free canvas.

---

## 🎨 The Story: Figma to Code with AI

### The Goal
The objective was to build a highly tactical, distraction-free environment for writers and creators. The visual direction blends digital brutalism with analog warmth—combining a global analog grain overlay, custom serif typography, and ultra-subtle glass panels to create a tactile paper-like feel inside the browser.

### The Design (Figma)
The application's interface was designed from the ground up in Figma. It prioritizes layout asymmetry, haptic active feedback, and custom type design (pairing regular and italic letter forms within headers, settings, and buttons to establish a premium editorial aesthetic).

### The Build (AI Pairing)
To translate the design system into a production-ready Web App, the Figma design was built in partnership with an agentic AI coding assistant. The AI implemented the core UI primitives, optimized layout responsiveness for mobile devices (ensuring 44px minimum touch targets and 100dvh viewport support), resolved cross-origin font rendering bugs during image exports, and integrated custom WebGL shader backdrops that adapt dynamically to note themes.

---

## 💎 Key Features

*   **Distraction-Free Canvas**: Tiptap-powered rich text editor featuring inline slash commands (`/` triggers list) for headings, lists, highlights, and local base64 image uploads.
*   **Bento Grid Organization**: An interactive, responsive dashboard bento grid mapping notes and bundles.
*   **Adaptive Theme Overlays**: Customize note backgrounds with uploaded images, solid colors, and generative WebGL backdrops. Set blend modes (`multiply`, `overlay`, `normal`) and saturation filters (`color`, `muted`, `B&W`) directly inside the canvas.
*   **High-Fidelity Exports**: 
    *   **Export .JPG**: Custom canvas captures inlining stylesheets and embedding local font faces.
    *   **Export .PDF**: Print-optimized stylesheets removing default browser headers/footers and forcing background graphic rules.
    *   **Export .MD**: Clean raw Markdown downloads.
*   **Secure Authentication**: Fully integrated Supabase client auth supporting secure Email accounts, anonymous guest trials, and Google OAuth logins.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 16 (React 19, App Router)
*   **Styling**: Tailwind CSS, CSS Custom Properties
*   **Editor**: Tiptap Rich Text Engine
*   **Animation**: GSAP (Flowing marquee menus)
*   **Database & Auth**: Supabase (PostgreSQL, OAuth)

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local development server**:
   ```bash
   npm run dev
   ```

3. **Build production bundle**:
   ```bash
   npm run build
   ```
