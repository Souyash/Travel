# Tours&Co — Bespoke Journeys Across India

A luxury, high-performance replica and full-stack travel platform inspired by [Tours&Co](https://saadtoursandtravels.com/#top), built with modern web standards, an interactive India SVG map, scroll-driven landscapes, native SQLite persistence, and a complete operations management dashboard.

---

## Highlights & Features

### The Best of Both Worlds: Blended UI & UX
This platform harmoniously blends the editorial luxury aesthetic of **Tours&Co** (`#0F3D6E` navy, `#D4AF37` gold, Fraunces serif) with the high-utility conversion and operational features of **Mercury Tour Operator**:

1. **Top Contact & Trust Utility Bar**:
   - Live phone (`+91 62919 29266`), email, and operational hours.
   - Official accreditation badges: Ministry of Tourism (Govt. of India) & WBTDC Approved.
2. **Instant Live Tour Search with Autocomplete**:
   - Header search bar with glassmorphic dropdown.
   - Real-time search by destination, state, highlights, or style with quick-filter chips (All, India, North East, Abroad).
   - One-click jump to full day-by-day itinerary modal.
3. **Categorized Tour Portfolio Tabs**:
   - Dynamic tabbed navigation: All Curations (19), Domestic Grandeur (7), Himalayas & North East (4), International (6), Expeditions (2).
   - 19 handcrafted packages with badges (Signature Stay, Adventure Luxury, UNESCO Trail, etc.), next departure dates, and live seat counters.
4. **Day-by-Day Interactive Itinerary Modal**:
   - Rich modal with hero photography, all-inclusive pricing, and highlight tags.
   - Structured day-by-day journey timeline.
   - Curated inclusions grid (5★ stays, private transfers, permits, breakfast & dinners, guided excursions).
   - Direct "Book / Inquire This Tour" integration.
5. **Upcoming Fixed Group Departures Schedule (2026–2027)**:
   - Live departures table with departure date, duration, guaranteed departure status, available seats counter, and price.
   - "Reserve Seat" action that pre-fills the inquiry modal with tour name and selected departure date.
6. **Floating WhatsApp & Call Speed Dials**:
   - Direct WhatsApp specialist chat (`wa.me`) and pulsing call button.
7. **Interactive SVG India Map**:
   - Pulsating radar markers for Kashmir, Ladakh, Rajasthan, Kerala, Goa, and Meghalaya with live region panels.
8. **Scroll-Driven Landscapes**:
   - Desktop horizontal translation mapped to vertical page scrolling, with touch snap carousel on mobile.
9. **Testimonials Marquee & Live Counters**:
   - Continuous infinite marquee ticker for verified traveler reviews and animated counter metrics.

### Backend Architecture
- **Zero External Dependencies**: Built entirely on modern Node.js standard libraries (`node:http`, `node:sqlite`, `node:fs`, `node:path`).
- **Native SQLite Database (`db/data.sqlite`)**: Configured with WAL mode and pre-seeded with 19 comprehensive packages.
- **RESTful Endpoints**:
  - `POST /api/inquiries`: Customer consultation requests with validation.
  - `GET /api/inquiries`: Lead retrieval with status/destination filtering.
  - `PATCH /api/inquiries/:id`: Update lead status, budget, and curator notes.
  - `POST /api/newsletter`: Deduplicated newsletter subscriptions.
  - `POST /api/callbacks`: Instant callback request queue.
  - `GET /api/destinations`: Filterable destinations API (`?category=...`).
  - `GET /api/destinations/:slug`: Single destination itinerary & inclusions.
  - `GET /api/departures`: Fixed departures schedule with real-time seat counts.
  - `GET /api/stats`: Real-time inquiry counts, conversion rates, and top destinations.
  - `GET /api/export/inquiries.csv`: One-click CSV lead export.
- **Operations Dashboard (`/admin`)**: Clean web portal for monitoring inquiries, managing callback queues, and tracking booking conversions.

---

## Project Structure

```
.
├── admin.html             # Admin lead & operations dashboard
├── css/
│   └── style.css          # Design tokens, typography, layout & modal styles
├── db/
│   ├── database.js        # SQLite models, schemas, and queries
│   └── data.sqlite        # SQLite database file
├── favicon/
│   └── favicon.svg        # Vector brand favicon
├── index.html             # Main website
├── js/
│   └── script.js          # Interactive features, map, modals & API client
├── logo.png               # High-resolution brand logo
├── server.js              # Node.js HTTP & REST API server
└── package.json           # Package manifest
```

---

## Quick Start

### Prerequisites
- Node.js (v20+ or v24+)

### Running Locally
Start the server:
```bash
node server.js
```

Open in your browser:
- **Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **API Health**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## License
MIT License

