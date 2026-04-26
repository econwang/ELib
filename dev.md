# Instructions for Developing a Cross-Platform E-Book Management Software with Tauri and Vue 3

## Role

You are an expert desktop application developer specializing in Tauri (Rust backend) and modern web frontend (Vue 3 + TypeScript).

## Task

Develop a cross-platform e-book and literature management software using Tauri and SQLite. The UI and layout must strictly follow the provided reference image (`img/screenshot.png`), resembling a professional academic library manager (like eLibPro).

## Architecture & Logic Refinements

### 1. Multi-Database Management (File Menu)

- The software must support multiple SQLite databases.
- The "File" menu is responsible for database-level operations: "Create New Database", "Open Existing Database", and "Export/Import Entire Database".
- **Dynamic Hierarchy:** In the Left Sidebar, each Tier 1 (root) category represents a separate open Database. Sub-categories under these roots are the internal folders of that specific database (up to 5 levels).

### 2. CRUD & Interaction (Edit Menu)

- The "Edit" menu handles book-level operations: "Add New Book", "Edit Book Info", and "Delete Book".
- **Context Menus:** Right-clicking on any category in the tree view or any entry in the book table must provide quick access to "Add Book" or "Edit" functions.
- **Add Book Workflow:** Supports both BibTeX import and manual entry via a modal dialog. Manual entry must include fields for Title, Author, Publisher, ISBN, Edition, Local Path, and an image uploader for the cover (stored as BLOB).

### 3. Configuration & GUI (View Menu)

- The "View" menu controls the display and theme settings.
- **GUI Config Editor:** Users should be able to modify the core configuration (stored in `config.json`) directly through a GUI interface in the View menu (e.g., changing theme colors, font sizes, or toggling pane visibility).
- Support Dark/Light themes with user-defined color overrides in the config.

## Strict Technical Stack & Implementation Constraints

- **Backend:** Tauri (Rust), `rusqlite` for database operations.
- **Frontend:** Vue 3 (Composition API), Pinia, Tailwind CSS.
- **UI Components:** `@tanstack/vue-table` for the resizable book list, a custom recursive TreeView for the sidebar.
- **Image Processing (Rust):** Use the `image` crate. Before saving a cover image as a SQLite BLOB, the Rust backend MUST resize it (e.g., `resize_to_fit` max 800x800) and encode it as a highly compressed format (JPEG or WebP) to prevent database bloat. When sending to the frontend, send as base64 string or via custom Tauri protocol.
- **BibTeX Parsing (Rust):** Use the `biblatex` (or `nom-bibtex`) crate in Rust to parse `.bib` files into Rust structs before batch-inserting into SQLite. Exporting should generate `.bib` format from the database records.

## UI Requirements (Refer to screenshot.png)

- **Pane 1 (Left):** Full-height TreeView. Root nodes = Databases.
- **Pane 2 (Top Right):** Resizable table with columns: Title, Author, Publisher, ISBN, Edition.
- **Pane 3 (Bottom Right):** Book Detail view. Left side shows the Cover image; Right side shows metadata fields, clickable local file paths, and personal notes.

## Step-by-Step Implementation Guide

Please provide the implementation in the following sequential steps.

**Step 1: Rust Backend Foundation**
Provide `Cargo.toml`. Write the Rust code for managing a Multi-Database Connection Pool (e.g., `HashMap<String, Connection>`). Define the `rusqlite` schemas for Categories and Books (with BLOB).

**Step 2: Rust Core Logic**
Provide the Tauri commands for:

1. Processing and saving images (using `image` crate).
2. Parsing BibTeX (using `biblatex` crate).
3. Handling the `config.json` read/write for theming.

**Step 3: Frontend Layout & Theming**
Provide `package.json`. Create the Vue 3 App layout (3-panes using CSS Grid/Flexbox) and the dynamic theme provider utilizing the loaded config file.

**Step 4: Complex UI Components**
Provide the code for:

1. The Recursive TreeView (Left Pane) handling Database-as-Root.
2. The Resizable Table (Top Right Pane) using `@tanstack/vue-table`.
3. The Book Detail View and the "Add Book" modal.

**Step 5: Windows Build & Deployment Strategy**
Provide a clear explanation of the required Windows toolchain (e.g., Node.js, Rust MSVC, C++ Build Tools, Windows SDK). Then, write a comprehensive PowerShell script (`build.ps1`) that automates the entire process: cleaning previous builds, installing npm dependencies, and executing the Tauri release build pipeline.
