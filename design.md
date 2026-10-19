# Design — ShiftPatch

Locked visual system for the app (Hallmark **Cobalt**, modern-minimal). Implementation lives in `app/globals.css` (`:root` tokens) and `app/layout.tsx` (fonts). Change colors and chrome here first, then mirror token values in CSS.

## Genre and theme

- **Genre:** modern-minimal (utilitarian staffing product)
- **Theme:** Cobalt — cool paper, electric-blue accent, hairline borders, no shadows except subtle UI lift on primary actions

## Color (OKLCH)

| Token | Role |
| --- | --- |
| `--color-paper` | Page background |
| `--color-paper-2` / `--color-surface-raised` | Raised surfaces (header bar, tab hover) |
| `--color-ink` | Primary text |
| `--color-muted` | Secondary text |
| `--color-rule` / `--color-border` | Hairlines, input borders |
| `--color-accent` | Brand, primary buttons, active tabs, logo fill |
| `--color-accent-ink` | Text on accent surfaces |
| `--color-focus` | Focus ring (matches accent) |
| `--color-danger` / `--color-danger-bg` | Errors |
| `--color-ok` / `--color-ok-bg` | Success banners |

## Typography

- **Display:** Space Grotesk (`--font-display`) — headings, logo monogram, app title
- **Body:** Inter (`--font-body`)
- **Mono:** Geist Mono (`--font-geist-mono`) — Tailwind `--font-mono` only

## Layout

- **Content width:** `--shell-narrow` (40rem) for nurse/agency; `--shell-wide` (72rem) for admin
- **Signed-out login:** centered card (`--auth-card-width`), full-viewport gate (`.auth-gate`)
- **Signed-in chrome:** full-width header bar (`.app-header-bar`); main content stays in `.shell`

## App chrome

- **Header:** horizontal bar edge-to-edge; brand left (SP monogram + “ShiftPatch”), user name + role badge + sign-out icon right
- **Logo:** `--logo-size` square, “SP” centered (grid + `--logo-font-size`, `--logo-letter-spacing`)
- **Status pills:** `--radius-pill`; outline + tinted background + matching text (role badge, credential Active/Expired/neutral)
- **Role tabs (nurse):** Marketplace / Credential — horizontal pills with `--tab-gap`; active tab filled with `--color-accent`
- **Admin tabs:** Operations / Audit / Scheduled hours — same tab pattern as nurse
- **Icon actions:** `.btn-icon` at `--touch-min`; refresh spins while loading; password show/hide on login

## Motion and a11y

- Hover lift on default buttons only; `prefers-reduced-motion` disables transforms and spin
- `:focus-visible` ring at 2px `--color-focus`, no animated focus
- Tabs: `tablist` / `tab` / `tabpanel`; icon buttons: `aria-label` + `title`

## Controls

- **Radius:** `--radius-control` (6px) on inputs, buttons, cards, tabs, logo
- **Spacing:** 4pt scale `--space-xs` … `--space-xl`
- **Touch:** `--touch-min` 44px minimum targets
