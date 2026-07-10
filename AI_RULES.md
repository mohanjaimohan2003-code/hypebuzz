# 1. Project Philosophy

HypeBuzz must always be built as a scalable, production-ready, modern web application. Every implementation decision must support long-term maintainability, security, performance, accessibility, and a trustworthy user experience. Short-term convenience must not create avoidable technical debt or weaken the product principles defined in `HYPEBUZZ_MASTER_PLAN.md`.

# 2. Before Starting Any Task

Always:

- Read `HYPEBUZZ_MASTER_PLAN.md` before beginning work.
- Inspect the current project structure.
- Understand the existing code and established patterns before changing them.
- Explain the implementation plan before making large changes.
- Confirm that the requested work aligns with the master plan and does not introduce unrelated scope.

# 3. Coding Standards

- Use Next.js 16 with the App Router.
- Use TypeScript.
- Use Tailwind CSS for styling.
- Prefer Server Components by default.
- Use Client Components only when interactivity, client state, lifecycle behavior, or browser APIs require them.
- Create reusable components when a pattern is genuinely shared.
- Avoid duplicate code and duplicated business rules.
- Keep files organized, focused, and located near the feature that owns them.
- Write clean, readable, maintainable code with clear names and straightforward control flow.
- Keep server-only logic, credentials, and data access out of client bundles.
- Follow the documentation bundled with the installed Next.js version before using or changing framework APIs.

# 4. UI Standards

- Design mobile-first.
- Build responsive layouts that work across mobile, tablet, and desktop viewports.
- Maintain a modern, clean, recognizable HypeBuzz appearance.
- Use consistent spacing, typography, sizing, and visual hierarchy.
- Use accessible color combinations with sufficient contrast.
- Ensure interactive elements are fully keyboard accessible and have visible focus states.
- Provide proper loading, empty, success, and error states wherever applicable.
- Use semantic HTML and accessible labels.
- Avoid excessive animation, visual clutter, and distracting effects.
- Respect reduced-motion preferences.

# 5. Security Rules

- Never expose secrets, private credentials, service-role keys, or API keys in source code or client bundles.
- Never commit `.env` files or secret values.
- Never weaken authentication or authorization controls.
- Never expose admin pages or admin operations to public users.
- Never rely only on hidden UI for access control; enforce authorization on the server.
- Never remove security checks to make an implementation easier.
- Never make destructive changes without explicit approval.
- Validate untrusted input at the server boundary.
- Apply least-privilege access to users, services, and administrative operations.

# 6. Database Rules

- Supabase will be connected later; do not assume it is available until it has been deliberately configured.
- Use reviewed SQL or version-controlled migrations for every schema change.
- Enable and correctly configure Row Level Security for exposed tables.
- Protect all admin-only reads and writes with server-side authorization and appropriate database policies.
- Validate all form and mutation input before database access.
- Use consistent table and column naming conventions.
- Keep schema changes reversible where practical and document any data migration risk.
- Never make destructive schema or data changes without explicit approval and a recovery plan.

# 7. Git Rules

- Keep one clear feature or concern per commit.
- Use meaningful commit messages that explain the intent of the change.
- Never commit broken code.
- Explain which files changed and why before committing.
- Do not change, stage, or commit unrelated files.
- Preserve existing user work and review the working tree before committing.

# 8. Testing Rules

After each completed feature:

- Run `npm run lint`.
- Run `npm run build` after major features.
- Test the desktop layout.
- Test the mobile layout.
- Test loading, empty, success, and error states where applicable.
- Test keyboard behavior for interactive UI.
- Clearly report all warnings, errors, skipped checks, and known limitations.
- Do not claim a check passed unless it was actually run successfully.

# 9. AI Working Rules

Always:

- Build one feature at a time.
- Never build unrelated features.
- Never delete working code without explicit approval.
- Make only the changes required for the requested task.
- Stop after completing the requested task.
- Explain what changed.
- Explain how the feature can be tested.
- State any assumptions that materially affect the implementation.
- Preserve unrelated work already present in the project.

When finished:

1. Save all requested changes.
2. Summarize what was added or changed.
3. Explain how to verify the result when applicable.
4. Report any warnings, errors, or checks that were not run.
5. Stop.
