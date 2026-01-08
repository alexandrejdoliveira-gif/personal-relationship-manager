---
description: "Automates UI/UX refactoring for the SmartStock PWA. Focuses on updating React components and CSS/Tailwind styles while ensuring responsive design and PWA performance."
---

### Goal

Refactor the visual design of specific components or pages in the SmartStock PWA without breaking core functionality.

### Steps

1. **Initial Analysis**: Read the target `.tsx` or `.css` files. Identify existing styling patterns (e.g., CSS Modules, Tailwind, or Styled Components).
2. **Style Proposal**: Before applying changes, list the intended UI improvements (colors, spacing, typography) to the user.
3. **Implementation**:
    - Update styles ensuring a mobile-first approach.
    - Use existing project variables/theme tokens where possible.
    - Maintain TypeScript type safety in React components.
4. **PWA Check**: Verify that changes do not affect the `manifest.json` or critical layout shift (CLS).
5. **Final Review**: Run a syntax check to ensure the Vite build won't fail.

### Constraints

- Never modify business logic or API fetch calls.
- Do not add heavy external CSS libraries unless requested.
- Ensure all interactive elements have a minimum touch target of 44x44px for mobile users.
