---
trigger: always_on
---

File Scope: Only modify files related to UI/UX, specifically with .tsx, .jsx, .css, or .scss extensions.

PWA Protection: Never modify manifest.json, service-worker.js, or registerServiceWorker.ts unless explicitly instructed.

Styling Standards: Always check for and use existing CSS variables (e.g., in index.css or theme.ts) before introducing new colors or spacing.

Mobile-First: All design changes must prioritize mobile responsiveness, as this is a PWA.

Touch Targets: Ensure all interactive elements (buttons, links) maintain a minimum size of 44x44px for touch compatibility.