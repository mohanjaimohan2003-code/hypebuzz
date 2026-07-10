# 1. Brand Personality

HypeBuzz is a modern affiliate shopping and product-discovery platform for young online shoppers. It should feel energetic enough to make discovery enjoyable, premium enough to inspire confidence, and restrained enough to keep products, prices, and recommendations at the center of every screen.

The visual personality is:

- **Clear:** users can scan products, prices, savings, and calls to action quickly.
- **Trustworthy:** claims are specific, source context is visible, and interface patterns never feel deceptive.
- **Energetic:** blue leads the brand and orange highlights genuine deal actions without overwhelming the page.
- **Premium:** typography, spacing, imagery, and subtle depth feel intentional rather than flashy.
- **Helpful:** the interface guides decisions with useful hierarchy, states, and explanations.
- **Current:** layouts feel contemporary without depending on short-lived visual trends.

HypeBuzz must not look like a generic corporate dashboard, a noisy coupon site, or a luxury storefront that hides practical shopping information. Product imagery and decision-making content always receive more emphasis than decoration.

Brand voice in the interface should be concise, confident, and human. Avoid exaggerated urgency, unsupported superlatives, fake scarcity, or language that implies HypeBuzz is the merchant. Affiliate destinations and price-verification times must be clear.

# 2. Color Palette

Use the following palette as the permanent base color system. Semantic meaning must never rely on color alone; pair status colors with text, icons, or other visible cues.

| Color name | Hex code | Intended use | Accessibility notes |
|---|---:|---|---|
| Primary blue | `#2563EB` | Primary buttons, active links, selected controls, key brand accents, focus-supporting elements | White text passes WCAG AA for normal text. Do not use blue alone to indicate selection; add shape, label, border, or icon. |
| Dark blue | `#1D4ED8` | Primary-button hover/pressed state, strong links, emphasized brand details | White text has strong contrast. Use as the darker interaction state rather than changing only opacity. |
| Light blue background | `#EFF6FF` | Selected rows, informational callouts, subtle branded sections, active navigation backgrounds | Pair with main text or dark blue. Primary blue text is acceptable for meaningful links and controls. |
| Main text | `#111827` | Headings, body copy, prices, form values, high-priority labels | Provides excellent contrast on white and soft backgrounds. This is the default text color. |
| Secondary text | `#6B7280` | Supporting descriptions, metadata, timestamps, breadcrumbs, helper text | Passes AA on white for normal text, but avoid smaller than 14 px for important content. Do not lower its opacity. |
| Page background | `#FFFFFF` | Main page canvas, cards on tinted sections, input surfaces | Pair with main or secondary text. Do not use pure-white cards on white without a border, spacing, or subtle elevation cue. |
| Soft section background | `#F8FAFC` | Alternating page sections, neutral cards, filters, skeleton bases | Pair with main or secondary text. Preserve enough separation from white using spacing or borders. |
| Border color | `#E5E7EB` | Card outlines, dividers, input borders, table rules | This is not strong enough to communicate focus or errors alone. Add a clear focus ring, label, icon, or status color. |
| Success or savings | `#16A34A` | Savings labels, confirmed success icons, positive status accents | Do not use white normal-size text on this green. On white, use it mainly for bold/large labels or icons and pair it with explicit text. Use a darker accessible green variant if long-form green text is ever required. |
| Deal accent | `#F97316` | Affiliate “Buy now” actions, deal badges, limited promotional emphasis | White normal-size text does not have sufficient contrast. Use main text `#111827` on an orange button, or use orange as an icon/border/accent with dark text. |
| Error | `#DC2626` | Validation errors, destructive warnings, failed states | Supports white text and readable error text on white. Always pair with an error message or icon, not color alone. |

## Color usage rules

- Follow an approximate **70/20/10 balance**: neutral surfaces dominate, blue provides brand structure, and orange/green provide limited semantic emphasis.
- Use blue for primary navigation and product discovery actions. Reserve orange for genuine deal or merchant-outbound actions so it retains meaning.
- Use green only for verified savings or successful outcomes. Do not use it to make an unverified price appear favorable.
- Default to a light visual theme. A dark theme is not defined yet and must not be improvised by simply inverting colors.
- When a component combines text and background colors, verify the actual rendered contrast rather than assuming palette membership guarantees compliance.
- Never communicate rating, savings, stock, error, or selection state through color alone.

# 3. Typography

## Primary font family

Use **Geist Sans** as the primary interface font. It is free, modern, highly legible, suitable for Next.js font optimization, and already present in the project. Use the system fallback stack `Arial, Helvetica, sans-serif` only while Geist is unavailable. Use **Geist Mono** only for technical identifiers or administrative data that benefits from monospacing; never use it as the general brand font.

Apply responsive type deliberately. Mobile sizes are the default; larger sizes begin at the desktop layout where noted.

| Role | Mobile size / line height | Desktop size / line height | Weight | Typical use |
|---|---|---|---:|---|
| Display | 36 px / 44 px | 48 px / 56 px | 700 | Home hero only; one per page maximum |
| H1 | 32 px / 40 px | 40 px / 48 px | 700 | Page title or product name |
| H2 | 28 px / 36 px | 32 px / 40 px | 700 | Major section title |
| H3 | 22 px / 30 px | 24 px / 32 px | 600 | Card groups and subsections |
| H4 | 18 px / 26 px | 20 px / 28 px | 600 | Card or panel heading |
| Body large | 18 px / 28 px | 18 px / 28 px | 400 | Introductory copy and key descriptions |
| Body | 16 px / 24 px | 16 px / 24 px | 400 | Default interface and content text |
| Body small | 14 px / 20 px | 14 px / 20 px | 400 or 500 | Metadata, helper text, card details |
| Caption | 12 px / 16 px | 12 px / 16 px | 500 | Short badges and nonessential labels only |
| Button large | 16 px / 24 px | 16 px / 24 px | 600 | Primary and affiliate actions |
| Button standard | 14 px / 20 px | 14 px / 20 px | 600 | Secondary and compact actions |

Typography rules:

- Use weights 400, 500, 600, and 700 only. Avoid thin weights and 800–900 weights.
- Use sentence case for headings, navigation, buttons, fields, and badges. Do not use all caps for long labels.
- Keep body lines approximately 45–75 characters wide; use a narrower measure for editorial content.
- Use tabular numerals for aligned price tables when available, but retain normal proportional numerals in product cards.
- Prices must be visually prominent but not larger than the product name on detail pages.
- Never reduce important copy below 14 px. Twelve-pixel text is reserved for short, noncritical supporting labels.
- Use no more than three type sizes in a typical card and no more than four visible weights on a page.

# 4. Spacing System

Use a 4 px base unit. Components must use the shared scale instead of one-off values.

| Token | Value | Common use |
|---|---:|---|
| `space-0` | 0 px | Reset only |
| `space-1` | 4 px | Tight icon/label gap |
| `space-2` | 8 px | Related inline elements, compact controls |
| `space-3` | 12 px | Small field gaps, compact card content |
| `space-4` | 16 px | Default component gap and mobile page padding |
| `space-5` | 20 px | Standard card padding |
| `space-6` | 24 px | Form groups, tablet page padding, roomy cards |
| `space-8` | 32 px | Desktop page padding, related content groups |
| `space-10` | 40 px | Small section separation |
| `space-12` | 48 px | Mobile section spacing |
| `space-16` | 64 px | Tablet section spacing |
| `space-20` | 80 px | Desktop section spacing |
| `space-24` | 96 px | Exceptional hero separation only |

Application rules:

- **Page padding:** 16 px on mobile, 24 px on tablet, and 32 px on desktop.
- **Section spacing:** 48 px on mobile, 64 px on tablet, and 80 px on desktop. Use 96 px only for a spacious landing-page hero.
- **Cards:** use 16 px internal padding for compact mobile cards, 20 px by default, and 24 px for large feature cards.
- **Forms:** use 8 px between a label and control, 6–8 px between a control and helper/error text, 16 px between related fields, and 24 px between field groups.
- **Mobile layouts:** use 12–16 px gaps between product cards and never reduce the outer page gutter below 16 px.
- Do not stack multiple spacing values to accidentally create oversized gaps. Section owners define outer spacing; child components define internal spacing.

Use a restrained shape system alongside spacing:

- 6 px radius for small badges and compact controls.
- 10 px radius for inputs and standard buttons.
- 16 px radius for cards, panels, and large media frames.
- Full pill radius only for chips, filters, and compact status labels.
- Shadows must be subtle. Prefer borders and spacing; use a soft shadow only when elevation clarifies interaction or hierarchy.

# 5. Layout System

## Content container

- Maximum content width: **1280 px**.
- Center the container with automatic side margins.
- Apply the responsive page padding defined in the spacing system.
- Editorial prose should use a narrower maximum width of approximately **720 px** for readability.
- Product-detail content may use a two-column layout, but key purchase information must remain in the main reading order.

## Responsive grids

| Range | Grid | Gutter | Typical behavior |
|---|---:|---:|---|
| Mobile, below 768 px | 4 columns | 16 px | Stacked page regions; product grids use one or two cards based on available card width |
| Tablet, 768–1023 px | 8 columns | 20–24 px | Two-column content and two-to-three-column product grids |
| Desktop, 1024 px and above | 12 columns | 24–32 px | Multi-column discovery sections, filters/sidebar, and three-to-four-column product grids |

Product grids should use resilient minimum card widths rather than force unreadably narrow cards. As a guide: one column below roughly 360 px when a full-action card cannot fit, two columns on most phones, two or three on tablets, and three or four on desktops. Featured cards may span multiple columns but must not disrupt scan order.

## Breakpoints

Use the standard responsive thresholds consistently:

- Base: below 640 px
- `sm`: 640 px and above
- `md`: 768 px and above
- `lg`: 1024 px and above
- `xl`: 1280 px and above
- `2xl`: 1536 px and above, while content remains capped at 1280 px

Breakpoints respond to content needs, not specific device models. Avoid creating new breakpoints unless a reusable component demonstrably fails between the standard thresholds.

## Header and sidebars

- Public header height: **64 px on mobile** and **72 px on desktop**, excluding an optional second-row search or category bar.
- Keep the public header sticky only when it improves navigation and does not consume excessive mobile space. Apply a subtle bottom border when sticky.
- Desktop catalog filter sidebar: approximately **280 px**, aligned with the product grid and sticky below the header when content length warrants it.
- Admin sidebar: **256 px** at `lg` and above. Below `lg`, it becomes an accessible modal drawer and must not remain as a squeezed fixed column.
- Mobile catalog filters open in a bottom sheet or full-height dialog with clear Apply and Reset actions. Active filter count remains visible after closing.
- Sidebars must never be the only route to essential content or actions.

# 6. Buttons

All buttons must use clear verbs, maintain at least a 44 × 44 px touch target, preserve their label width while loading, and expose disabled/loading state programmatically. Default horizontal padding is 16–20 px; large/high-intent buttons use 20–24 px.

## Primary button

- Background: primary blue `#2563EB`.
- Text: white, 14–16 px, weight 600.
- Height: 44 px standard or 48 px for primary mobile actions.
- Hover: dark blue `#1D4ED8` on hover-capable devices.
- Pressed: dark blue with a subtle inset treatment; do not shrink the button.
- Use for one leading action per region, such as “Explore products” or “Apply filters.”

## Secondary button

- Background: white.
- Text: main text `#111827`.
- Border: 1 px border color `#E5E7EB`; strengthen the border on hover.
- Hover: light blue background `#EFF6FF` with dark blue text.
- Use for lower-priority actions, cancellation, or navigation beside a primary action.

## Affiliate Buy Now button

- Background: deal accent `#F97316`.
- Text: main text `#111827`, weight 700, to maintain accessible contrast.
- Preferred label: “Buy now at {Merchant}” or “View deal at {Merchant}” when space allows.
- Include an external-link icon after the label; do not use the icon instead of text.
- On product cards, use “Buy now” only when merchant context is visible nearby.
- Hover: use a visibly darker orange interaction shade after its contrast is verified; until a token is approved, combine a subtle dark overlay with a stronger border rather than inventing a permanent color.
- Affiliate disclosure must be visible near the purchase area. The button must not imply that HypeBuzz handles checkout.

## Wishlist button

- Default form: 44 × 44 px icon button with a white or soft neutral surface and visible border.
- Default icon: outline heart; saved state: filled heart plus an `aria-pressed="true"` state and accessible label change.
- Use primary blue for the selected state. Do not rely on fill color alone.
- Tooltip may supplement but never replace the accessible name.

## Compare button

- Use a secondary or compact outlined style with a comparison icon and visible label when space permits.
- Selected state uses light blue background, primary-blue border/text, a check indicator, and `aria-pressed="true"`.
- Product-card mobile layouts may use a labeled checkbox-style control rather than an icon-only button.

## Shared interaction states

- **Disabled:** use a muted neutral surface and text, retain readable contrast, remove hover changes, set the native disabled state, and never communicate disabled state with opacity alone.
- **Loading:** keep the original width, show a small spinner before the label, use status text such as “Opening deal…,” set `aria-busy="true"`, and prevent duplicate activation.
- **Hover:** transition background, border, color, and shadow over 150–200 ms. Hover must never reveal essential information unavailable to touch or keyboard users.
- **Focus:** use a highly visible 2–3 px primary/dark-blue focus ring with at least a 2 px offset. On blue surfaces, include a white separation ring so the focus indicator remains visible.
- **Pressed:** provide immediate visual feedback without large movement or layout shift.

# 7. Product Cards

Product cards are the core discovery unit. They must favor product recognition, price clarity, and trustworthy action over promotional decoration.

## Visual structure

1. **Image region:** a square 1:1 frame on a soft neutral surface, with the full product visible and layout space reserved before load.
2. **Badges:** at most two short badges in the image region, such as “Trending” and a verified discount. Never cover the product subject.
3. **Wishlist:** top-right overlay in a 44 px accessible control with sufficient contrast against any image.
4. **Brand:** 12–14 px secondary text above the product name.
5. **Product name:** 16 px, weight 600, main text; clamp to two lines in grids and expose the full name to assistive technology.
6. **Rating:** star icon plus numeric rating and review count, for example “4.6 (128).” Do not display a rating without a source or sufficient context.
7. **Price row:** current price in 18–20 px, weight 700. A verified reference price may be smaller and struck through. Savings use green text/badge plus explicit wording.
8. **Freshness/context:** merchant or “checked” timestamp when offer accuracy matters.
9. **Compare control:** visible near the action row or in a consistent card footer.
10. **Buy action:** full-width or clearly dominant affiliate button at the bottom when a verified offer exists.

## Card styling and behavior

- Background: white; radius: 16 px; border: 1 px border color.
- Default shadow: none or extremely subtle. Hover may add a soft shadow and move no more than 1–2 px.
- Keep content order consistent across every grid so users can compare quickly.
- Make the product name/image link to details. Do not turn the entire card into a link when it also contains buttons, because nested interactive behavior becomes ambiguous.
- Do not show a crossed-out reference price unless it is supported by current data.
- Use an unavailable state with explicit text and a disabled merchant action; never leave a dead button.

## Mobile behavior

- Most phones may use two compact columns when each card retains a usable minimum width; fall back to one column on very narrow screens or for information-dense cards.
- Use 12–16 px grid gaps and 12–16 px internal padding in compact cards.
- Keep the image square and product name to two lines.
- Preserve 44 px wishlist and compare touch targets even when visual icons are smaller.
- On narrow two-column cards, the affiliate action remains full width. Secondary metadata may be shortened, but price, product name, merchant context, and action must remain visible.
- Never create horizontal page scrolling to preserve a desktop card width.

# 8. Forms

All controls use main text, a white background, a 1 px border, 10 px radius, and a minimum 44 px height. Labels appear above controls and remain visible after entry; placeholders are examples or hints, not replacements for labels.

## Text input

- Default height: 44–48 px; horizontal padding: 12–16 px.
- Border: border color `#E5E7EB`; hover border becomes visibly stronger.
- Focus: primary-blue border plus the shared focus ring.
- Use main text for values and secondary text for placeholders.

## Search input

- Include a leading search icon and a clear accessible label.
- Provide a clear button when text is present; keep it at least 44 px as a touch target.
- Search suggestions must support arrow keys, Enter, Escape, and screen-reader announcements.
- On mobile, search may expand to its own row or full-screen mode rather than becoming too narrow.

## Select dropdown

- Prefer native select behavior for simple choices.
- Use a consistent trailing chevron with sufficient right padding.
- Custom listboxes require complete keyboard and screen-reader behavior and must not be built solely for appearance.

## Checkbox

- Visual box: 20–24 px; full label row touch target: at least 44 px.
- Checked state uses primary blue with a visible checkmark.
- Indeterminate state uses a horizontal mark and programmatic state.
- The label itself must toggle the checkbox.

## Radio

- Visual circle: 20–24 px; full label row touch target: at least 44 px.
- Selected state uses a primary-blue ring and central dot.
- Group related radios with a visible legend and allow arrow-key navigation through native behavior.

## File upload

- Use a bordered upload area with a visible “Choose file” button, accepted type/size guidance, and a standard input fallback.
- Drag-and-drop is an enhancement, never the only interaction.
- Show selected filename, upload progress, success, and a clear removable error state.
- Never communicate upload success through color alone.

## Validation and status

- **Error:** error border and icon using `#DC2626`, with specific text directly below the field. Connect the message programmatically and move focus to an error summary when submission fails across multiple fields.
- **Success:** use `#16A34A` as an icon/accent with explicit confirmation text. Announce asynchronous success appropriately without stealing focus.
- **Disabled fields:** use a neutral background and readable muted text, retain labels, expose the native disabled state, and explain why a field is unavailable when the reason is not obvious.
- Validate after a user finishes a field or submits; do not show errors before they have had a chance to interact.

# 9. Navigation

## Desktop navbar

- Use the 72 px public header with logo on the left, primary links near the center/left, a prominent search field, and wishlist/account actions on the right.
- Recommended primary links: Trending, Deals, Categories, and Collections. Keep the visible set short.
- Active navigation uses dark text or blue plus a visible underline/background indicator; color alone is not enough.
- Sticky behavior uses a white background, subtle border, and no heavy blur that harms performance or readability.

## Mobile navbar

- Use a 64 px top row with logo, wishlist, and menu controls.
- Put discovery search in a full-width second row on search-heavy pages or open a dedicated accessible search view.
- The menu opens as an accessible dialog/drawer, traps focus while open, closes with Escape, and restores focus to its trigger.
- A persistent bottom navigation is not part of the default system and requires founder approval based on final information architecture.

## Search bar

- Search is a primary discovery tool and should remain visually easy to find.
- Desktop target width is approximately 320–480 px when space permits.
- Use clear placeholder copy such as “Search products, brands, and categories.”
- Results distinguish products, brands, categories, and recent searches with headings, not color alone.

## Category menu

- Desktop may use a dropdown or mega menu only when the category set justifies it.
- Mobile uses a simple list in the navigation drawer or horizontally scrollable category chips on discovery pages.
- Menus must support keyboard navigation and close predictably.

## Wishlist icon

- Use a heart icon with an accessible label and optional count badge.
- Count badges must not overlap the icon or become the only indication of saved items.
- Use the same saved-state semantics as product-card wishlist controls.

## Admin navigation

- Visually distinguish the admin area from the public site with a clear “Admin” label and utilitarian hierarchy, while retaining core brand tokens.
- Desktop uses the 256 px sidebar; mobile/tablet uses an accessible drawer.
- Group links by workflow, show a clear active state, and keep destructive operations out of primary navigation.
- Public users must never see admin navigation; visual hiding is not a substitute for server authorization.

## Breadcrumbs

- Use breadcrumbs on product, collection, category, and admin detail pages where hierarchy aids orientation.
- Place them above the page title, use 14 px text, and mark the current page semantically.
- On small screens, retain Home plus the immediate parent/current context, truncate long labels safely, or allow controlled horizontal scrolling.
- Breadcrumbs supplement rather than replace primary navigation and page headings.

# 10. Icons

Use **Lucide** as the recommended free icon library when package installation is later approved. Do not install it as part of this design-system document.

Icon rules:

- Use one icon family throughout the public and admin interfaces.
- Default stroke width: approximately 1.75–2 px.
- Standard sizes: 16 px inline, 20 px in controls, 24 px for primary navigation, and 32 px only for empty states or feature callouts.
- Icons must align optically with nearby text and use `currentColor` so states remain consistent.
- Decorative icons are hidden from screen readers. Meaningful standalone icons require an accessible name.
- Icon-only controls require at least a 44 × 44 px target and usually a tooltip for sighted users.
- Do not mix filled, outlined, and multicolor icon styles without a defined semantic reason.
- Never use an icon where a clear text label is necessary for trust, especially merchant and destructive actions.

# 11. Images

## Product imagery

- Primary product image ratio: **1:1 square**.
- Use a neutral white or soft-section background with consistent internal breathing room.
- Show the complete product whenever possible; do not crop away meaningful features.
- Preferred source size: at least **1200 × 1200 px** for primary product images and at least **600 × 600 px** for card-only assets.

## Thumbnails

- Compact list thumbnail: 48 × 48 px.
- Standard gallery/admin thumbnail: 64 × 64 px.
- Large selectable product thumbnail: 80 × 80 px.
- Keep all thumbnails square with 8–10 px radius and a visible selected/focus state when interactive.

## Banners

- Desktop campaign/editorial banner: target ratio around **16:5**, with a source asset near 1600 × 500 px.
- Mobile banner: provide a dedicated **4:3 or 3:2** composition rather than shrinking desktop text into unreadability.
- Keep text as HTML when possible. Do not bake essential copy or CTAs into the image.
- Keep the focal subject inside a safe area that survives responsive cropping.

## Quality rules

- Serve correctly sized responsive assets and prefer AVIF or WebP where supported.
- Preserve aspect-ratio space before loading to prevent layout shift.
- Compress images without visible artifacts in product edges, labels, or texture.
- Do not upscale low-resolution merchant images, distort aspect ratios, use inconsistent watermarks, or apply decorative filters that misrepresent a product.
- Product imagery must have accurate, purpose-based alt text. Decorative backgrounds use empty alt text.
- Gallery images showing materially different views need distinct alt descriptions.

## Placeholders

- Loading placeholders preserve the final ratio and approximate layout.
- Missing images use a neutral branded placeholder with a product/image icon and brief accessible fallback text.
- Never show a broken-image browser icon.
- The placeholder must not look like a real product or imply details that are unavailable.

# 12. Motion and Animation

Motion supports orientation and feedback; it is never decoration for its own sake.

- **Hover transitions:** 150–200 ms using a smooth standard ease. Transition only color, border, shadow, and very small transforms.
- **Card hover:** optional 1–2 px lift plus subtle shadow on pointer-capable devices. No hover-only content.
- **Loading skeletons:** soft neutral pulse or shimmer lasting approximately 1.4–1.8 seconds. Keep contrast low, preserve the final layout, and stop when content arrives.
- **Page transitions:** no elaborate full-page transitions. If used, apply a subtle 120–180 ms content fade that never delays navigation or loading feedback.
- **Dropdowns and menus:** 120–160 ms fade with a 4 px vertical movement. Avoid bounce, large scale, or spring effects.
- **Feedback:** pressed and selected states respond immediately; success feedback may fade in without moving surrounding content.
- Never animate layout dimensions when a transform or opacity can communicate the same state.
- Respect `prefers-reduced-motion`: remove nonessential transforms and shimmer, and make state changes effectively immediate.
- Do not autoplay carousels, continuously pulse deal badges, use parallax, or animate prices/countdowns to create pressure.

# 13. Accessibility

HypeBuzz targets **WCAG 2.2 AA** across public and administrative experiences.

- **Color contrast:** normal text requires at least 4.5:1; large text requires at least 3:1; meaningful control boundaries and graphical states require at least 3:1 against adjacent colors. Verify combinations in their actual component states.
- **Keyboard navigation:** every interactive control works with a keyboard in a logical order. Menus, dialogs, search suggestions, filters, galleries, and drawers follow established keyboard patterns.
- **Focus indicators:** never remove browser focus without a stronger replacement. Use the shared visible focus ring and ensure sticky UI does not obscure the focused element.
- **Alt text:** describe the image purpose and useful product information, not every visual detail. Do not repeat nearby captions or begin with “Image of.” Decorative images receive empty alt text.
- **Touch targets:** use at least 44 × 44 px for buttons, icon controls, checkboxes/radio label rows, pagination, and other frequent actions. Maintain adequate separation between adjacent targets.
- **Screen-reader labels:** every input and icon-only action has an accessible name. Dynamic results, errors, loading, saved state, and success feedback are announced with appropriate live regions.
- Use semantic headings, landmarks, lists, tables, forms, buttons, and links. Do not recreate native semantics with generic containers unless a proven interaction requires it.
- Links navigate; buttons perform actions. Link text must make sense out of context.
- Form errors must identify the field, explain the problem, and provide correction guidance.
- Price, discount, rating, stock, and trend status need readable text equivalents.
- Modals and drawers trap focus, close with Escape where safe, restore focus on close, and have a clear title.
- Zoom to 200% and text resizing must not hide content, overlap controls, or force two-dimensional scrolling for normal page content.

# 14. Mobile Rules

Mobile is the default design context, not a compressed desktop layout.

- Prioritize product image, product name, current price, verified savings/context, and the primary action in that order.
- Use 16 px page gutters, 12–16 px product-grid gaps, and the mobile typography scale.
- Use one content column for editorial/detail regions. Use two compact product columns only when the full core information and touch targets remain usable.
- Move desktop sidebars into accessible filter or navigation sheets. Keep the active-filter count visible on the trigger.
- Let search use a full row or dedicated view. Do not squeeze it between several header icons.
- Allow intentional horizontal scrolling only for clearly indicated chip, category, or media rails; the page itself must not overflow horizontally.
- Keep primary product-detail affiliate actions reachable. A sticky bottom action bar is allowed when it includes merchant context, respects device safe areas, and never covers content or consent/error messages.
- Collapse secondary information progressively, but never hide disclosures, full pricing context, errors, or accessibility labels.
- Do not depend on hover. Every interaction needs an obvious tap and keyboard equivalent.
- Place frequent actions within comfortable thumb reach and avoid crowded clusters of icon buttons.
- Use responsive images and avoid loading desktop banner assets on small screens when an appropriately sized source exists.
- Test at 320 px width, common phone widths, large text settings, landscape orientation, and with the on-screen keyboard open.

# 15. Do and Do Not Rules

## Do

- Keep products, prices, decision context, and trustworthy actions visually dominant.
- Use the approved palette and semantic meanings consistently.
- Use Geist, the defined type scale, the 4 px spacing scale, and shared radius rules.
- Design and test the mobile state first, then enhance for wider layouts.
- Reuse established components and interaction patterns.
- Use whitespace, typography, and imagery before adding decorative effects.
- Show accurate merchant context, price freshness, affiliate disclosure, and state feedback.
- Provide loading, empty, success, error, disabled, and unavailable states where applicable.
- Verify contrast, keyboard flow, focus visibility, screen-reader names, and touch targets.
- Keep animation subtle, purposeful, and compatible with reduced-motion preferences.
- Review every new pattern against this document before implementation.

## Do not

- Do not make HypeBuzz so plain that it feels unfinished or so crowded that shopping content becomes hard to scan.
- Do not introduce unapproved brand colors, fonts, shadows, radii, spacing values, or icon families casually.
- Do not use gradients as a default brand treatment; any recurring gradient requires founder approval and contrast testing.
- Do not use orange for ordinary primary navigation or green for unverified promotional claims.
- Do not use white text on the deal-orange or success-green tokens at normal text sizes without verified AA contrast.
- Do not create fake urgency, flashing sale elements, misleading crossed-out prices, or dark patterns.
- Do not hide essential information behind hover, tooltips, carousels, or ambiguous icons.
- Do not use oversized hero areas that push core shopping content below the initial mobile viewport without a clear reason.
- Do not mix multiple card styles, icon systems, or animation personalities on the same experience.
- Do not use tiny text, low-contrast gray, inaccessible focus styles, or touch targets smaller than 44 × 44 px for frequent actions.
- Do not add a dark theme, bottom navigation, decorative gradients, or a second typeface without explicit design approval.
- Do not sacrifice performance or accessibility for visual novelty.
