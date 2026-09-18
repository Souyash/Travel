# Saad Tour & Travels — Bespoke Journeys Across India

A luxury, high-performance replica and full-stack travel platform inspired by [Saad Tour & Travels](https://saadtoursandtravels.com/#top), built with modern web standards, an interactive India SVG map, scroll-driven landscapes, native SQLite persistence, and a complete operations management dashboard.

---

## Highlights & Features

### Frontend Experiences
- **Sticky Navigation & Backdrop Blur**: Nav shrinks and applies translucent backdrop filter on scroll; includes mobile drawer with escape key support.
- **Hero Slideshow with Ken Burns Effect**: 6-slide background carousel with staggered text animation and interactive progress dots.
- **Interactive SVG India Map**: Pulsating radar markers for Kashmir, Ladakh, Rajasthan, Kerala, Goa, and Meghalaya with live region cards.
- **Scroll-Driven Landscapes**: Desktop horizontal translation mapped to vertical page scrolling, with touch snap carousel on mobile devices.
- **Live Counter Animations**: Statistics animated with cubic ease upon entering viewport.
- **Testimonials Marquee**: Continuous infinite marquee ticker for verified traveler reviews.
- **Consultation & Callback Modals**: Integrated modals for custom journey planning and callback requests.
- **Floating Call FAB**: Fixed call button (`tel:6291929266`) with pulsating glow animation and scroll-dimming.

### Backend Architecture
- **Zero External Dependencies**: Built entirely on modern Node.js standard libraries (`node:http`, `node:sqlite`, `node:fs`, `node:path`).
- **SQLite Database (`db/data.sqlite`)**: Configured with WAL mode and pre-seeded destination packages.
- **RESTful Endpoints**:
  - `POST /api/inquiries`: Customer consultation requests with validation.
  - `GET /api/inquiries`: Lead retrieval with status/destination filtering.
  - `PATCH /api/inquiries/:id`: Update lead status, budget, and curator notes.
  - `POST /api/newsletter`: Deduplicated newsletter subscriptions.
  - `POST /api/callbacks`: Instant callback request queue.
  - `GET /api/destinations`: Live package itinerary data.
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

