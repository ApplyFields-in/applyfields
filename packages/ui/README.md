# packages/ui — the ApplyFields design system

**What is this?** The colours, components and page templates shared by the citizen website (`apps/web`)
and the Internal Portal (`apps/admin`), so both look the same.

**Owner:** Karthik (Likhith reviews changes to `theme.css`)

## The palette — the only colours allowed
| Token | Hex | Use for |
|---|---|---|
| `teal` | `#114B5F` | Text, sidebar, primary buttons |
| `sea` | `#1A936F` | Progress, active states, icons, big numbers |
| `celadon` | `#88D498` | Badges, highlights |
| `tea` | `#C6DABF` | Soft backgrounds, chips |
| `cream` | `#F3E9D2` | Cards, text on teal |
| `canvas` | blend of tea + cream | Page background |
| `line` | teal at 14% | Borders |

Tailwind's default colours are switched off in [`src/theme.css`](src/theme.css), so `bg-white`,
`text-gray-500` etc. don't exist. Lighter shades: use opacity, e.g. `bg-teal/10`, `text-teal/80`.
Readable text: teal on light colours, cream on teal. Don't put small sea-green text on cream.

## What's inside
| Export | What it is |
|---|---|
| `Card`, `Badge`, `ProgressBar`, `Avatar`, `IconTile`, `SectionTitle`, `PageHeader`, `EmptyState` | Basic pieces |
| `buttonClass({ variant, size })` | Button styles for `<button>`, `<a>` or `<Link>` |
| `Shell`, `Sidebar`, `NavLink`, `MobileDrawer`, `Logo` | The page frame (sidebar, top bar, phone menu) |
| `SectionPage`, `Preview`, `BuildStatus` | Template for pages that aren't built yet |
| `ComingSoon`, `NotBuiltYet` | “Not built yet” screens |
| `cn()` | Join class names |

## How to use
```tsx
import { Badge, Card, buttonClass } from '@applyfields/ui';
<Card className="p-5"><Badge tone="celadon">New</Badge></Card>
```
Each app imports the theme in its `globals.css` and lists the package in `transpilePackages` (`next.config.ts`).
