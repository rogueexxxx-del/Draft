# Draft — A Focused Centered Creative Tool

Draft is a minimalist, premium PWA creative workspace built on Next.js 16 (App Router) and Tailwind CSS v4, featuring WebGL-generative art backdrops, high-contrast typography hierarchy, interactive bento note grids, and a distraction-free Tiptap canvas.

---

## 🎨 Visual Identity & Design System

- **Typography**: Strictly maps Google Font imports for **Redaction** and **Redaction 35** weights/grades. The layout employs asymmetric text arrangements and inline italics (`italic` spans within `regular` words) for custom menu settings and page headers.
- **Colors**:
  - `Rust`: `#DD400A` (primary accents and signup layout fill)
  - `Ink`: `#141414` (primary text and buttons)
  - `Surface`: `#FFFFFF` (clean white screens)
  - `Input BG`: `#D9D9D9` (clean muted grey fields)
- **Zero Border-Radius**: In accordance with the design specs, all cards, dropdowns, inputs, buttons, and popups have a strict border-radius of `0px` enforced globally.
- **Tactile Grain Overlay**: A global SVG fractal noise layer floats across the entire interface at the top layer (`z-index: 9999`), adding a subtle analog print noise feel.

---

## 💎 Features & Interactive Layouts

### 1. Welcome Screen (`/`)
- Displaying a large centered logo (`draft.svg`) and a split tagline: *"a focused centered"* on the left, and *"creative tool"* on the right.
- Backed by an animated, WebGL-powered **Liquid Simulation Waves shader** (`panel={4}`).
- Flat black and rust decorative squares rotated and placed asymmetrically.

### 2. Login Screen (`/login`) & Signup Screen (`/signup`)
- Stacked inputs with gray placeholder prompts and center alignments.
- **Login screen**: Backed by a WebGL **Fractal Terrain grid shader** (`panel={2}`). Includes a fallback local/anonymous guest mode bypass.
- **Signup screen**: Fully inverted color scheme using solid brand `Rust` (`#DD400A`), backed by a custom-themed WebGL **Crystal Growth shader** (`panel={6}`) displaying white facet drawings on the rust background.

### 3. Generative Dashboard picker (`/dashboard`)
- Full-screen picker layout mapping `Notes` and `You` (with scrapbook, shot list, and script options muted/inert for future updates).
- Backed by the **WebGL 3x2 Generative Grid study** displaying all six math-simulated drawings simultaneously.

### 4. Notes Bento Grid (`/notes`)
- Full-screen bento grid where notes cards are color-filled using their respective parent bundle colors.
- Stylized, icon-free dropdown overlays for filtering bundles and adjusting notes settings (all options displayed in all-caps with random italic characters).
- Centered floating bottom "+ ADD NOTE" action button with smooth fade/scale transition routes.

### 5. Note Editor Canvas (`/notes/editor/[id]`)
- Full-screen text canvas integrating the native Tiptap editor with slash commands (`/` triggers list).
- Supported slash options: *Paragraph, Heading 1, Heading 2, Bold, Italic, Bullet List, Highlight, and Insert Image*.
- Supports client-side **Base64 local image uploads** to keep document caches fully self-contained.
- **Settings Panel:** Enables modifying background colors and uploading custom background images directly inside the browser.
- **Blending Overlays:** Supports `multiply`, `overlay`, and `normal` blend mode filters.
- **Saturation controls:** Allows toggle options for `COLOR`, `MUTED` (slightly desaturated), and `B&W`.
- **Exporting options:**
  - **Export .MD**: Downloads raw Markdown files.
  - **Export .PDF**: Dynamic printing layout overrides that remove default browser header/footer margins, set output filenames matching the note title, and preserve custom background graphic styles.
  - **Export .JPG**: Client-side canvas capture rendering exact screenshot copies of custom note backgrounds and layouts without stylesheet cross-origin fetch failures.

### 6. Profile Settings (`/you`)
- Centered rust-red `you` wordmark (`y` italic, `ou` regular).
- Displays logged-in email and stacked actions: **`SYNC`**, **`DELETE ACCOUNT`**, and **`LOG OUT`**.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Rich Editor**: Tiptap (`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-highlight`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`)
- **Graphics**: WebGL 2 (Shader canvases)
- **Exports**: `html-to-image` (JPG render engine)
- **Icons**: `lucide-react`

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run local development server**:
   ```bash
   pnpm dev
   ```

3. **Deploy to production**:
   ```bash
   pnpm build
   pnpm start
   ```
