# Savor — Task 11 Mobile App Experience

## App idea and problem

Savor connects people with affordable surplus food from nearby independent shops. Bakeries, produce shops and cafes often have good food left at the end of a service window; Savor gives neighbours a simple way to discover a box, choose a pickup time and reserve it rather than letting it go to waste.

## Target users

Local residents looking for lower-cost food, people who enjoy discovering neighbourhood shops, and people motivated to reduce food waste. The sample location and inventory are illustrative Brooklyn demo data.

## Main user goal

Find an available nearby surplus box and complete a reservation with a pickup name, pickup time and payment preference, then keep the confirmation ticket for collection.

## Core journey

1. Read the welcome proposition and choose Get started.
2. Create an account or log in with a valid email and password. The local demo checks input format and length.
3. Wait for the home rescue list to load; search listings or filter by category.
4. Open an available box and review its merchant, stock, description and price.
5. Choose a quantity within current stock, a pickup window, and a payment method.
6. Confirm the pickup name and reservation. The app shows a brief confirmation-in-progress state.
7. Review the ticket with the selected box, quantity, pickup window, payment preference and calculated total. Optionally download a calendar event.
8. Use Explore, Saved or Profile to browse, revisit favourites and view past reservations.

## Information architecture and navigation

```text
Welcome
└── Auth (log in / sign up)
    └── Home
        ├── Details ── Reserve ── Success
        │     └── Shop
        ├── Explore ── Details
        ├── Saved ── Details
        └── Profile
              ├── Past reservations
              ├── Simulate offline ── Error ── Retry ── prior destination
              └── Log out ── Welcome

Home ── contextual search/category empty state ── clear / explore
Home ── sold-out listing ── Sold Out ── notify preference
```

All primary destinations have a back path and the persistent bottom navigation is available on Home, Explore, Saved and Profile. A prototype jump bar is available only at `?demo=1`.

## Screens

- Welcome / onboarding
- Authentication with log-in/sign-up mode
- Home / nearby listings
- Rescue details
- Reservation form
- Reservation success / pickup ticket
- Explore / all listings and category filters
- Saved / favourites and no-favourites empty state
- Profile / identity, reservation history, offline simulation and log out
- Shop details
- Sold-out listing
- Contextual empty results (search, category, Saved, reservations, Explore category)
- Connection error and loading
- Terms and privacy modal

## States handled

- First Home visit: animated loading skeleton followed by local listing data.
- Auth: inline invalid-email and too-short-password errors; submit busy state.
- Reservation: live subtotal, per-box fee and total; stock-bounded quantity controls; inline missing pickup-name/time errors; confirmation busy state and success ticket.
- Sold out / unavailable: stock reason and disabled reservation CTA; persistent notify preference.
- Search/category/Explore: filtered lists and contextual empty states with clear/reset actions where relevant.
- Saved/Profile: empty Saved and reservation history states.
- Connection: `?error=1` or Profile's offline toggle presents an error; Retry reattempts and returns to the prior destination when connectivity is restored.
- Success: selected item, quantity, time, payment preference, pickup location and total are displayed.

## Design decisions

- **Colour:** muted cream canvas and dark forest-green primary actions, with warm orange food accents and red-toned errors. CSS custom properties centralize these colours in `styles.css`.
- **Typography:** DM Sans for interface copy and Manrope for expressive headings, with system-font fallbacks.
- **Spacing and shape:** a compact 4px-based spacing rhythm, rounded cards and controls, and soft shadows carry the original friendly mobile prototype style forward.
- **Components:** shared primary/outline buttons, input groups, category chips, listing cards, bottom navigation, inline field errors, state illustrations, status toast, confirmation ticket and animated skeletons.
- **Mobile/accessibility:** fluid single-column layout, scrollable category row, safe-area padding, 44px minimum tap targets, visible keyboard focus, labelled icon buttons and live-region feedback. Checked at 360px and 375px viewport widths.

## Simulated vs real

- **Real in-browser interactions:** client-side form validation, category/search filtering, quantity/fee calculations, selectable reservation options, responsive navigation, contextual state rendering, browser-local favourites/profile/reservations/stock/notification preferences, and `.ics` calendar file download.
- **Simulated:** account creation/login (no identity service), listing/network data, inventory (sample stock stored locally), reservation/checkout/payment processing, email delivery, notification delivery, impact metrics, pickup ticket/barcode and offline retry. No server, payment processor, email service or merchant inventory API is connected.
- Share uses the Web Share API when supported and a toast fallback otherwise. Terms and privacy are explanatory demo copy, not legal advice or a production privacy policy.

## Run and deploy

Open `index.html` directly in a browser. There is no package manager, build command or framework. See [README.md](./README.md) for static deployment notes.
