const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'data.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for maximum concurrency & reliability
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    destination TEXT,
    travel_date TEXT,
    travellers TEXT,
    travel_style TEXT,
    budget INTEGER DEFAULT 0,
    message TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'website_cta',
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS callbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    preferred_time TEXT DEFAULT 'ASAP',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'domestic',
    price TEXT NOT NULL,
    duration TEXT NOT NULL,
    badge TEXT NOT NULL DEFAULT 'Curated',
    departure_date TEXT DEFAULT '',
    departure_status TEXT DEFAULT 'Guaranteed Departure',
    seats_left INTEGER DEFAULT 12,
    highlights TEXT DEFAULT '',
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    itinerary TEXT DEFAULT '[]',
    inclusions TEXT DEFAULT '[]'
  );
`);

// Add new columns to destinations table if they were created under old schema
try {
  const cols = db.prepare("PRAGMA table_info(destinations)").all().map(c => c.name);
  if (!cols.includes('category')) db.exec("ALTER TABLE destinations ADD COLUMN category TEXT DEFAULT 'domestic'");
  if (!cols.includes('badge')) db.exec("ALTER TABLE destinations ADD COLUMN badge TEXT DEFAULT 'Curated'");
  if (!cols.includes('departure_date')) db.exec("ALTER TABLE destinations ADD COLUMN departure_date TEXT DEFAULT ''");
  if (!cols.includes('departure_status')) db.exec("ALTER TABLE destinations ADD COLUMN departure_status TEXT DEFAULT 'Guaranteed Departure'");
  if (!cols.includes('seats_left')) db.exec("ALTER TABLE destinations ADD COLUMN seats_left INTEGER DEFAULT 12");
  if (!cols.includes('highlights')) db.exec("ALTER TABLE destinations ADD COLUMN highlights TEXT DEFAULT ''");
  if (!cols.includes('itinerary')) db.exec("ALTER TABLE destinations ADD COLUMN itinerary TEXT DEFAULT '[]'");
  if (!cols.includes('inclusions')) db.exec("ALTER TABLE destinations ADD COLUMN inclusions TEXT DEFAULT '[]'");
} catch (e) {
  // Ignore
}

// Seed or update the comprehensive destinations catalog (Blending Tours&Co + Mercury Tour Operator)
const seedDestinations = [
  {
    slug: 'kashmir',
    name: 'Kashmir',
    region: 'Jammu & Kashmir',
    category: 'domestic',
    price: '₹48,000',
    duration: '6 Days 5 Nights',
    badge: 'Signature Stay',
    departure_date: 'Oct 15, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 6,
    highlights: 'Dal Lake Luxury Houseboat, Gulmarg Gondola Phase 2, Saffron Pampore, Betaab Valley',
    image: 'https://images.unsplash.com/photo-1715457573748-8e8a70b2c1be?q=80&w=1100&auto=format&fit=crop',
    description: 'Shikara mornings on Dal Lake, meadows in bloom and saffron light over the snow-draped Pir Panjal.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Arrival in Srinagar & Dal Lake Sunset', detail: 'Chauffeur airport transfer, check-in to hand-carved cedarwood luxury houseboat. Evening private shikara ride across floating lotus gardens and Char Chinar.' },
      { day: 'Day 2', title: 'Mughal Splendour & Old City Artisan Trail', detail: 'Private guided exploration of Nishat Bagh, Shalimar Bagh, and Jamia Masjid. Evening Pashmina weaving and walnut woodcraft studio visit with master craftsmen.' },
      { day: 'Day 3', title: 'Meadow of Flowers — Gulmarg Alpine Ascent', detail: 'Scenic ascent to Gulmarg (2,650m). Board the Kongdoori & Apharwat Gondola Phase 2 at 4,200m overlooking Nanga Parbat. Alpine lodge dinner by fireside.' },
      { day: 'Day 4', title: 'Valley of Shepherds — Pahalgam & Lidder River', detail: 'Journey through Awantipora ruins and saffron valleys of Pampore to Pahalgam. Evening riverside walk along the crystal Lidder River.' },
      { day: 'Day 5', title: 'Aru & Betaab Valleys Exploration', detail: 'Pony trail or private 4x4 into virgin pine forests of Aru Valley, Chandanwari, and Betaab Valley. Gourmet Kashmiri Wazwan traditional feast.' },
      { day: 'Day 6', title: 'Srinagar Departure', detail: 'Morning floating vegetable market photography cruise on Dal Lake, traditional Kahwa breakfast, and private chauffeur transfer to Srinagar Airport.' }
    ]),
    inclusions: JSON.stringify([
      '5 Nights in 5-star Heritage Hotels & Luxury Cedarwood Houseboat',
      'Dedicated Chauffeur Driven Innova Crysta / Luxury SUV',
      'Daily Gourmet Breakfast & Multi-Course Kashmiri Wazwan Dinners',
      'Gulmarg Gondola Phase 1 & 2 Pre-booked VIP Tickets',
      'Private 2-hour Shikara Rides on Dal Lake with local tea service',
      'All toll, parking, driver allowances & government luxury tourist taxes'
    ])
  },
  {
    slug: 'ladakh',
    name: 'Ladakh',
    region: 'Ladakh',
    category: 'domestic',
    price: '₹62,000',
    duration: '8 Days 7 Nights',
    badge: 'High Altitude Adventure',
    departure_date: 'Nov 02, 2026',
    departure_status: 'Filling Fast',
    seats_left: 4,
    highlights: 'Khardung La Pass (5,359m), Pangong Tso Glamping, Nubra Valley Camel Safari, Thiksey Monastery',
    image: 'https://images.unsplash.com/photo-1617824077360-7a77db40aae1?q=80&w=1100&auto=format&fit=crop',
    description: "The world's highest motorable roads, cobalt lakes and ancient Tibetan Buddhist gompas clinging to the moonscape.",
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Arrival in Leh & Gentle Acclimatisation', detail: 'Scenic mountain flight over the Karakoram into Leh (3,500m). Full day rest with herbal oxygen-rich teas, followed by evening walk to Leh Shanti Stupa.' },
      { day: 'Day 2', title: 'Indus Valley Monasteries & Royal Palaces', detail: 'Visit Shey Palace, 12-storey Thiksey Monastery (resembling Lhasa Potala), and Hemis Gompa with monk chant blessings.' },
      { day: 'Day 3', title: 'Khardung La Pass to Nubra Valley', detail: 'Drive across Khardung La (5,359m), the roof of the world. Descend into the sand dunes of Hunder in Nubra Valley. Sunset ride on Bactrian double-humped camels.' },
      { day: 'Day 4', title: 'Diskit Monastery & Turtuk Baltic Frontier', detail: 'Marvel at the 32-metre Maitreya Buddha at Diskit, then drive to Turtuk — the Northernmost border village of India with unique Balti culture and apricot orchards.' },
      { day: 'Day 5', title: 'Nubra to Pangong Tso via Shyok River', detail: 'Off-road expedition along the turquoise Shyok gorge. Arrive at Pangong Tso (4,250m) as the lake shifts from turquoise to deep indigo. Luxury dome tent stay with Milky Way stargazing.' },
      { day: 'Day 6', title: 'Pangong Sunrise & Return via Chang La', detail: 'Dawn photography over Pangong lake. Traverse Chang La Pass (5,360m) back to Leh with stops at Sindhu Ghat.' },
      { day: 'Day 7', title: 'Magnetic Hill & Hall of Fame', detail: 'Experience the gravity-defying Magnetic Hill, Sangam (confluence of Indus & Zanskar rivers), and browse Tibetan handicraft bazaars.' },
      { day: 'Day 8', title: 'Leh Departure', detail: 'Chauffeur airport transfer with unforgettable aerial Himalayan views of the snow peaks.' }
    ]),
    inclusions: JSON.stringify([
      '7 Nights Luxury Boutique Mountain Resorts & Heated Glamping Domes',
      'Private 4x4 Scorpio / Toyota Fortuner with High Altitude Experienced Captain',
      'Daily Organic Buffet Breakfast & Multi-Course Himalayan Dinners',
      'Oxygen cylinder equipped vehicles & medical acclimatisation support',
      'Inner Line Permits & Protected Area Wildlife Sanctuaries access'
    ])
  },
  {
    slug: 'rajasthan',
    name: 'Rajasthan',
    region: 'Rajasthan',
    category: 'domestic',
    price: '₹74,000',
    duration: '9 Days 8 Nights',
    badge: 'Royal Palace Collection',
    departure_date: 'Oct 24, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 8,
    highlights: 'Udaipur Lake Palace, Jodhpur Mehrangarh Fort, Thar Desert Royal Camp, Jaipur Amber Fort',
    image: 'https://images.unsplash.com/photo-1638904998527-a451c1fbd1cb?q=80&w=1100&auto=format&fit=crop',
    description: 'Lake palaces, honey-coloured sandstone forts and the slow drama of the golden Thar desert at dusk.',
    itinerary: JSON.stringify([
      { day: 'Day 1-2', title: 'Jaipur — The Pink City Heritage', detail: 'Private elephant/jeep ascent to Amber Fort, photo stop at Hawa Mahal, City Palace royal family private chambers, and Jantar Mantar observatory.' },
      { day: 'Day 3-4', title: 'Jodhpur — Blue City & Mehrangarh Citadel', detail: 'Traverse the Aravalli hills to Jodhpur. VIP private curator tour of Mehrangarh Fort towering 400ft above the cobalt blue rooftops. Evening rooftop dinner with fort view.' },
      { day: 'Day 5-6', title: 'Jaisalmer — The Golden Fort & Sam Dunes', detail: 'Drive into the heart of the Thar. Explore the living sandstone fort of Jaisalmer and Patwon Ki Haveli. Night in luxury Swiss royal desert camp with Kalbelia dancers and stargazing.' },
      { day: 'Day 7-8', title: 'Udaipur — City of Lakes & Royal Residences', detail: 'Stop at Ranakpur Marble Jain Temples with 1,444 uniquely carved pillars. Arrive in Venice of the East. Private boat cruise on Lake Pichola past Jag Mandir and Taj Lake Palace.' },
      { day: 'Day 9', title: 'Udaipur Departure', detail: 'Morning vintage car museum walk and airport transfer.' }
    ]),
    inclusions: JSON.stringify([
      '8 Nights in authentic Heritage Haveli & Palace Hotels (Taj / Oberoi partners)',
      'Chauffeur driven luxury vehicle with cold bottled water and onboard Wi-Fi',
      'Royal desert Swiss tent experience with traditional folk performances & bonfire',
      'Private sunset solar boat ride on Lake Pichola',
      'Licensed English-speaking historian guides at all major UNESCO monuments'
    ])
  },
  {
    slug: 'kerala',
    name: 'Kerala',
    region: 'Kerala',
    category: 'domestic',
    price: '₹52,000',
    duration: '7 Days 6 Nights',
    badge: 'Slow Travel & Wellness',
    departure_date: 'Nov 12, 2026',
    departure_status: 'Few Seats Left',
    seats_left: 3,
    highlights: 'Private Alleppey Houseboat, Munnar Tea Valleys, Thekkady Spice Sanctuary, Marari Coast',
    image: 'https://images.unsplash.com/photo-1704365159747-1f7b8913044f?q=80&w=1100&auto=format&fit=crop',
    description: "Drift the palm-lined backwaters, then climb into the mist of Munnar's emerald tea country and Ayurvedic sanctuaries.",
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Kochi Heritage Walk & Chinese Fishing Nets', detail: 'Arrive in Fort Kochi. Explore Mattancherry Palace, Jew Town spice bazaars, and sunset over the historic Chinese fishing nets.' },
      { day: 'Day 2-3', title: 'Munnar — High Ranges & Mist Trails', detail: 'Drive through Cheeyappara waterfalls to Munnar. Private tea tasting session at Kolukkumalai (highest tea plantation on Earth), Eravikulam National Park Nilgiri Tahr safari.' },
      { day: 'Day 4', title: 'Thekkady — Cardamom Hills & Periyar Sanctuary', detail: 'Spice plantation sensory walk with master botanist. Bamboo rafting on Periyar lake spotting wild elephants and native birds.' },
      { day: 'Day 5', title: 'Alleppey — Kettuvallam Backwater Cruise', detail: 'Board your private handcrafted wooden houseboat with dedicated chef, butler, and captain. Drift through tranquil lagoons, coconut groves, and rural village canals.' },
      { day: 'Day 6', title: 'Marari Beach Relaxation & Ayurveda', detail: 'Disembark in Alleppey and transfer to luxury seaside eco-resort in Marari. Traditional 60-minute Ayurvedic Abhyanga massage session.' },
      { day: 'Day 7', title: 'Kochi Departure', detail: 'Farewell coastal breakfast and transfer to Cochin International Airport.' }
    ]),
    inclusions: JSON.stringify([
      '6 Nights in 5-star Heritage Resorts & Private Luxury Houseboat',
      'Dedicated AC Chauffeur throughout Kerala circuit',
      'All meals freshly prepared onboard private houseboat by private chef',
      'Authentic 60-min Ayurvedic Rejuvenation therapy included',
      'Spice plantation entry fees and Periyar wildlife sanctuary permits'
    ])
  },
  {
    slug: 'goa',
    name: 'Goa',
    region: 'Goa',
    category: 'domestic',
    price: '₹36,000',
    duration: '5 Days 4 Nights',
    badge: 'Coastal Luxury',
    departure_date: 'Nov 20, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 7,
    highlights: 'Fontainhas Latin Quarter, Private Sunset Yacht Cruise, South Goa Secluded Sands, Spice Farm',
    image: 'https://images.unsplash.com/photo-1624554305378-0f440dd3a8c1?q=80&w=1100&auto=format&fit=crop',
    description: 'Golden sands, vibrant Portuguese colonial lanes and long, unhurried sunsets over the azure Arabian Sea.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Arrival & Welcome to North Goa Coast', detail: 'Chauffeur transfer to luxury beachfront resort. Evening sundowner cocktail overlooking the Arabian Sea.' },
      { day: 'Day 2', title: 'Fontainhas Latin Quarter Heritage & Panjim', detail: 'Architectural walking tour of pastel-hued Portuguese mansions in Fontainhas. Artisan bakery stop for traditional Bebinca and fado music evening.' },
      { day: 'Day 3', title: 'Private Catamaran Sunset Cruise', detail: 'Morning organic spice plantation tour with traditional Goan lunch served on banana leaves. Late afternoon 2-hour private yacht cruise down the Mandovi River into the open sea.' },
      { day: 'Day 4', title: 'Serene South Goa Beachfront Escapes', detail: 'Explore the tranquil sands of Palolem and Agonda, Cabo de Rama fort cliff viewpoints, and beachside candlelit dining.' },
      { day: 'Day 5', title: 'Goa Departure', detail: 'Lazy breakfast, souvenir shopping in Anjuna boutique markets, and transfer to Goa Dabolim/MOPA Airport.' }
    ]),
    inclusions: JSON.stringify([
      '4 Nights in 5-star Beachfront Boutique Villa or Luxury Resort',
      'Private Chauffeur Sedan for the entire itinerary',
      '2-Hour Private Sunset Catamaran Sailing with wine and canapes',
      'Fontainhas guided historical heritage walk',
      'Daily gourmet breakfast and curated Goan culinary experiences'
    ])
  },
  {
    slug: 'andaman',
    name: 'Andaman & Nicobar',
    region: 'Andaman Islands',
    category: 'domestic',
    price: '₹32,500',
    duration: '5 Days 4 Nights',
    badge: 'Island Escape',
    departure_date: 'Dec 05, 2026',
    departure_status: 'Filling Fast',
    seats_left: 5,
    highlights: 'Radhanagar Beach Sunset, Havelock Scuba Diving, Elephant Beach Coral Reefs, Cellular Jail',
    image: 'https://images.unsplash.com/photo-1589136777351-fdc9c9cab193?q=80&w=1100&auto=format&fit=crop',
    description: 'Turquoise lagoons, pristine white coral sands and world-class diving amidst remote tropical Indian Ocean islands.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Port Blair & Cellular Jail Memorial', detail: 'Arrive in Port Blair, transfer to seaside hotel. Afternoon visit to Cellular Jail national memorial and evocative evening Light & Sound presentation.' },
      { day: 'Day 2', title: 'Catamaran to Havelock & Radhanagar Beach', detail: 'Board premium Makruzz high-speed catamaran to Swaraj Dweep (Havelock Island). Afternoon relaxation at Radhanagar Beach (Asia’s top beach according to Time).' },
      { day: 'Day 3', title: 'Elephant Beach Coral Snorkelling & Water Sports', detail: 'Speedboat to Elephant Beach for guided sea walk, snorkelling along live coral gardens, and kayaking through coastal mangroves.' },
      { day: 'Day 4', title: 'Neil Island (Shaheed Dweep) Natural Bridges', detail: 'Ferry to Neil Island. Discover the natural rock bridge formation, Bharatpur coral beach, and Laxmanpur sunset cliff.' },
      { day: 'Day 5', title: 'Return & Port Blair Departure', detail: 'Morning catamaran back to Port Blair and chauffeur transfer to Veer Savarkar Airport.' }
    ]),
    inclusions: JSON.stringify([
      '4 Nights in Premium Beachfront Resorts with Private Beach Access',
      'Premium Catamaran Tickets (Makruzz / Nautika) between Islands',
      'Guided Snorkelling Session with Certified Marine Instructors',
      'All island transfers, entry permits, and museum tickets',
      'Daily island breakfast and seafood gala dinner'
    ])
  },
  {
    slug: 'lakshadweep',
    name: 'Lakshadweep Islands',
    region: 'Lakshadweep',
    category: 'domestic',
    price: '₹29,500',
    duration: '4 Nights 5 Days',
    badge: 'Pristine Paradise',
    departure_date: 'Dec 18, 2026',
    departure_status: 'Few Seats Left',
    seats_left: 2,
    highlights: 'Agatti Lagoon, Bangaram Coral Atoll, Thinnakara Turtle Island, Glass-bottom Boating',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1100&auto=format&fit=crop',
    description: "India's secluded coral jewel — shallow turquoise lagoons, neon marine life, and tranquil coconut palm atolls.",
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Flight into Agatti Island Lagoon', detail: 'Breathtaking landing on Agatti’s ocean airstrip surrounded by turquoise sea. Traditional coconut water welcome and lagoon beach walk.' },
      { day: 'Day 2', title: 'Speedboat Excursion to Bangaram & Thinnakara', detail: 'Fast boat across turquoise waters to uninhabited Bangaram Island. Snorkel with sea turtles around the shipwreck reef and explore pristine sandbanks.' },
      { day: 'Day 3', title: 'Glass-Bottom Boat Safari & Coral Gardening', detail: 'Lagoon excursion observing brain corals, manta rays, and tropical fish. Afternoon water sports (kayaking, paddleboarding).' },
      { day: 'Day 4', title: 'Kalpitti Island Sunset & Cultural Village Walk', detail: 'Discover local island life, coir making, and sunset boat ride to Kalpitti Islet.' },
      { day: 'Day 5', title: 'Agatti Departure', detail: 'Farewell island breakfast and transfer to Agatti Airport for flight to Kochi.' }
    ]),
    inclusions: JSON.stringify([
      '4 Nights in Agatti / Bangaram Beach Cottages',
      'Complete Lakshadweep Entry Permit & Police Verification clearance',
      'Inter-island Speedboat Charters to Bangaram & Thinnakara',
      'All meals (Breakfast, Lunch, High Tea, Dinner) included',
      'Guided snorkelling kit and life jackets'
    ])
  },
  {
    slug: 'sikkim',
    name: 'Sikkim & Gangtok',
    region: 'Sikkim',
    category: 'himalayan',
    price: '₹24,500',
    duration: '5 Nights 6 Days',
    badge: 'Mercury Signature',
    departure_date: 'Oct 20, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 9,
    highlights: 'Tsomgo Glacial Lake, Baba Mandir, Rumtek Monastery, Nathula Border Viewpoint, Ravangla',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1100&auto=format&fit=crop',
    description: 'Prayer flags flutter over cloud-veiled peaks, sacred mountain lakes and ancient Tibetan gompas in Sikkim.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Siliguri/Bagdogra to Gangtok via Teesta River', detail: 'Chauffeur pickup from Bagdogra Airport (IXB) or NJP. Picturesque drive along the roaring Teesta River to Gangtok (5,500 ft). Evening stroll on MG Marg.' },
      { day: 'Day 2', title: 'Excursion to Sacred Tsomgo Lake & Baba Mandir', detail: 'Climb to glacial Tsomgo Lake at 12,400 ft, revered by locals. Visit historic Baba Harbhajan Singh shrine near Nathula border.' },
      { day: 'Day 3', title: 'Gangtok Cultural Icons & Rumtek Monastery', detail: 'Explore Rumtek Monastery (seat of the Karmapa Lama), Namgyal Institute of Tibetology, Do-drul Chorten, and Ganesh Tok view of Kanchenjunga.' },
      { day: 'Day 4', title: 'Gangtok to Pelling via Ravangla Buddha Park', detail: 'Scenic mountain drive to Pelling with stop at Tathagata Tsal (130 ft high Buddha statue with 360-degree Himalayan backdrop).' },
      { day: 'Day 5', title: 'Pelling Sights: Skywalk & Pemayangtse', detail: 'Visit Pelling Glass Skywalk, Chenrezig statue, sacred Khecheopalri Wish-fulfilling Lake, and ancient Pemayangtse Monastery.' },
      { day: 'Day 6', title: 'Pelling to Bagdogra / NJP Departure', detail: 'Morning descent through scenic tea estates to Bagdogra Airport for your journey home.' }
    ]),
    inclusions: JSON.stringify([
      '5 Nights Deluxe Stays in Gangtok and Pelling with Mountain Views',
      'Exclusive Private SUV (Innova/Xylo) for all transfers and mountain touring',
      'Tsomgo Lake & Baba Mandir Special Protected Area Permits',
      'Daily breakfast and regional Himalayan dinners',
      'All parking, toll, driver allowances included'
    ])
  },
  {
    slug: 'darjeeling-dooars',
    name: 'Darjeeling & Dooars',
    region: 'North Bengal',
    category: 'himalayan',
    price: '₹20,500',
    duration: '5 Nights 6 Days',
    badge: 'Himalayan Heritage',
    departure_date: 'Oct 28, 2026',
    departure_status: 'Filling Fast',
    seats_left: 5,
    highlights: 'Tiger Hill Kanchenjunga Sunrise, DHR Toy Train, Jaldapara Rhino Safari, Tea Estate Bungalow',
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1100&auto=format&fit=crop',
    description: 'Colonial tea heritage, the iconic UNESCO toy train, and wild elephant corridors across the Dooars floodplains.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Bagdogra to Darjeeling — Queen of Hills', detail: 'Scenic ascent through Kurseong tea hills to Darjeeling (6,700 ft). Check-in to heritage hotel and evening visit to Chowrasta Mall.' },
      { day: 'Day 2', title: 'Tiger Hill Sunrise & UNESCO Toy Train', detail: 'Dawn ascent to Tiger Hill for the golden illumination of Mount Kanchenjunga (world 3rd highest peak). Joy ride on steam-hauled Darjeeling Himalayan Railway.' },
      { day: 'Day 3', title: 'Himalayan Mountaineering Institute & Tea Gardens', detail: 'Tour HMI museum, Padmaja Naidu Himalayan Zoological Park (Snow Leopards & Red Pandas), and private tea tasting at Happy Valley Tea Estate.' },
      { day: 'Day 4', title: 'Darjeeling to Dooars Wilderness (Jaldapara/Lataguri)', detail: 'Descent into lush subtropical forests of Dooars. Check-in to jungle resort near Jaldapara National Park.' },
      { day: 'Day 5', title: 'Jaldapara One-Horned Rhino Jeep Safari', detail: 'Early morning jungle safari tracking Greater One-horned Rhinoceros, wild elephants, and spotted deer. Evening tribal cultural dance by campfire.' },
      { day: 'Day 6', title: 'Dooars to Hasimara/Bagdogra Departure', detail: 'Morning bird watching walk in riverside forest and transfer to Bagdogra Airport.' }
    ]),
    inclusions: JSON.stringify([
      '5 Nights in Heritage Darjeeling Hotel & Dooars Jungle Lodge',
      'Private dedicated SUV transportation throughout the tour',
      'UNESCO DHR Toy Train Joyride tickets included',
      'Jaldapara National Park Jungle Jeep Safari with Forest Guide',
      'Daily breakfast and lavish local dinners'
    ])
  },
  {
    slug: 'meghalaya',
    name: 'Seven Sisters & Meghalaya',
    region: 'North East India',
    category: 'himalayan',
    price: '₹32,500',
    duration: '7 Nights 8 Days',
    badge: 'Epic Explorer',
    departure_date: 'Nov 08, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 7,
    highlights: 'Cherrapunji Living Root Bridges, Crystal Dawki River, Kaziranga Rhino Safari, Kamakhya Temple',
    image: 'https://images.unsplash.com/photo-1589983846997-04788035bc83?q=80&w=1100&auto=format&fit=crop',
    description: "Living-root bridges, Asia's cleanest river, roaring waterfalls and the mystical green cloudlands of Meghalaya and Assam.",
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Guwahati Arrival to Shillong (Scotland of the East)', detail: 'Chauffeur pickup at Guwahati Airport. Stop at picturesque Umiam Lake (Barapani) and arrive in Shillong. Evening visit to Police Bazar.' },
      { day: 'Day 2', title: 'Shillong to Cherrapunji (Sohra) Waterfalls', detail: 'Drive through misty canyons. Explore Nohkalikai Falls (tallest plunge waterfall in India), Mawsmai limestone caves, and Seven Sisters Falls.' },
      { day: 'Day 3', title: 'Trek to Double Decker Living Root Bridge', detail: 'Guided trek from Tyrna village down 3,000 steps into deep rainforest to witness the centuries-old bioengineered Ficus elastica root bridges and natural turquoise pools.' },
      { day: 'Day 4', title: 'Mawlynnong (Cleanest Village) & Dawki River', detail: 'Visit Mawlynnong, awarded cleanest village in Asia. Proceed to Dawki for private country boat ride on crystal-clear Umngot river floating as if on glass.' },
      { day: 'Day 5-6', title: 'Kaziranga National Park — Rhino Kingdom', detail: 'Drive to Assam’s World Heritage Kaziranga National Park. Dawn elephant safari and afternoon open-top 4x4 jeep safari tracking the Great Indian One-horned Rhinoceros.' },
      { day: 'Day 7', title: 'Kaziranga Orchid Park & Guwahati Return', detail: 'Visit North East India Orchid Sanctuary showcasing 500+ wild species. Drive to Guwahati for evening Brahmaputra River sunset cruise.' },
      { day: 'Day 8', title: 'Kamakhya Temple & Departure', detail: 'Morning VIP darshan at sacred Maa Kamakhya Temple atop Nilachal hill. Chauffeur transfer to Guwahati Airport.' }
    ]),
    inclusions: JSON.stringify([
      '7 Nights Luxury Eco-Resorts in Shillong, Cherrapunji & Kaziranga',
      'Private Chauffeur-driven Innova Crysta for entire circuit',
      'Kaziranga Elephant & Jeep Safaris with forest naturalist',
      'Dawki Umngot crystal river private boat ride',
      'All Meghalaya & Assam forest permits and entry passes'
    ])
  },
  {
    slug: 'bhutan',
    name: 'Bhutan: Kingdom of Thunder Dragon',
    region: 'Bhutan',
    category: 'international',
    price: '₹42,500',
    duration: '5 Nights 6 Days',
    badge: 'International Bestseller',
    departure_date: 'Oct 22, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 6,
    highlights: 'Paro Taktsang (Tiger\'s Nest) Cliff Monastery, Punakha Dzong Fortress, Thimphu Buddha Dordenma',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1100&auto=format&fit=crop',
    description: 'The enchanted Buddhist Himalayan kingdom of Gross National Happiness, ancient cliffside dzongs and pristine mountain pine forests.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Arrival at Paro / Bagdogra Drive to Thimphu', detail: 'Arrive at Paro International Airport or overland from Bagdogra/Phuentsholing. Check-in to Thimphu hotel and visit Tashichho Dzong at dusk.' },
      { day: 'Day 2', title: 'Thimphu Cultural Treasures & Giant Buddha', detail: 'Marvel at Buddha Dordenma (51m bronze Buddha overlooking the valley), National Memorial Chorten, Motithang Takin Preserve, and traditional painting school.' },
      { day: 'Day 3', title: 'Dochula Pass (108 Stupas) to Punakha', detail: 'Traverse Dochula Pass (3,100m) with panoramic views of the Eastern Himalayas. Tour Punakha Dzong, the most majestic fortress palace in Bhutan at the confluence of Pho Chhu and Mo Chhu rivers.' },
      { day: 'Day 4', title: 'Punakha Suspension Bridge to Paro Valley', detail: 'Walk Bhutan’s longest pedestrian suspension bridge and fertility temple Chimi Lhakhang. Scenic drive back to the sacred Paro valley.' },
      { day: 'Day 5', title: 'Pilgrimage Hike to Taktsang (Tiger’s Nest)', detail: 'Unforgettable hike through pine woods and prayer flags up to Paro Taktsang, miraculously clinging to a 900m sheer granite cliff. Traditional Bhutanese hot stone bath evening.' },
      { day: 'Day 6', title: 'Paro Departure', detail: 'Farewell breakfast and chauffeur transfer to Paro International Airport (PBH) with blessing khata scarf ceremony.' }
    ]),
    inclusions: JSON.stringify([
      '5 Nights in 4-Star Certified Bhutanese Heritage Hotels',
      'Bhutan Visa / Entry Clearance & Sustainable Development Fee (SDF)',
      'Private AC Tourist Coach with Licensed Bhutanese English Guide & Chauffeur',
      'All Meals (Breakfast, Lunch & Dinner) included daily',
      'All monument entries, dzong passes, and cultural exhibits'
    ])
  },
  {
    slug: 'nepal',
    name: 'Nepal: Kathmandu & Pokhara Panorama',
    region: 'Nepal',
    category: 'international',
    price: '₹35,900',
    duration: '6 Nights 7 Days',
    badge: 'Spiritual & Scenic',
    departure_date: 'Nov 04, 2026',
    departure_status: 'Filling Fast',
    seats_left: 4,
    highlights: 'Sarangkot Annapurna Sunrise, Phewa Lake Boating, Pashupatinath Temple, Boudhanath Stupa',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1100&auto=format&fit=crop',
    description: 'Soaring Annapurna peak views, serene lakes, ancient Newari architecture and revered sacred shrines across Nepal.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Arrival in Kathmandu Valley', detail: 'Welcome at Tribhuvan International Airport with traditional marigold garland. Transfer to heritage hotel in Kathmandu and evening dinner.' },
      { day: 'Day 2', title: 'Kathmandu UNESCO Heritage Tour', detail: 'Guided tour of sacred Hindu shrine Pashupatinath on Bagmati River, colossal Boudhanath Buddhist Stupa, and Swayambhunath (Monkey Temple).' },
      { day: 'Day 3', title: 'Scenic Highway to Pokhara (City of Lakes)', detail: 'Picturesque drive along Trishuli river valley to Pokhara under the shadow of Mount Machapuchare (Fishtail Peak). Evening stroll along Lakeside.' },
      { day: 'Day 4', title: 'Sarangkot Sunrise & Pokhara Sights', detail: 'Dawn drive to Sarangkot for golden sunrise over Annapurna I, Dhaulagiri, and Fishtail. Visit Davis Falls, Gupteshwor Mahadev cave, and private wooden boat cruise on Phewa Lake.' },
      { day: 'Day 5', title: 'Pokhara to Kathmandu via Manakamana Cable Car', detail: 'Return drive with thrilling cable car ride to hilltop Manakamana Temple overlooking river gorges. Check-in to Kathmandu.' },
      { day: 'Day 6', title: 'Bhaktapur & Patan Royal Durbar Squares', detail: 'Step back into medieval Malla kingdom history at Bhaktapur Durbar Square and Patan golden temple artisans.' },
      { day: 'Day 7', title: 'Kathmandu Departure', detail: 'Free time for Thamel cashmere and handicraft shopping, followed by airport transfer.' }
    ]),
    inclusions: JSON.stringify([
      '6 Nights Deluxe Accommodation in Kathmandu and Pokhara',
      'All inter-city and sightseeing transfers in private AC vehicle',
      'Private boat cruise on Phewa Lake Pokhara',
      'All UNESCO heritage monument permits & entry fees',
      'Daily breakfast and traditional Nepali cultural dinner with folk dance'
    ])
  },
  {
    slug: 'sri-lanka',
    name: 'Sri Lanka: Ramayana & Scenic Hills',
    region: 'Sri Lanka',
    category: 'international',
    price: '₹48,000',
    duration: '6 Nights 7 Days',
    badge: 'Curated International',
    departure_date: 'Nov 15, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 8,
    highlights: 'Sigiriya Rock Fortress, Temple of Tooth Kandy, Nuwara Eliya Tea Country, Galle Fort',
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?q=80&w=1100&auto=format&fit=crop',
    description: 'Emerald tea country, ancient royal rock citadels, coastal colonial forts and golden Indian Ocean beaches.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Arrival Colombo to Sigiriya Cultural Triangle', detail: 'Arrive at Bandaranaike International Airport (CMB). Chauffeur drive to Sigiriya through coconut country.' },
      { day: 'Day 2', title: 'Sigiriya Lion Rock & Dambulla Cave Temple', detail: 'Climb 5th-century Sigiriya Lion Rock fortress palace with ancient frescoes. Explore Dambulla Cave Temple containing 150+ gilded Buddha statues.' },
      { day: 'Day 3', title: 'Kandy — Sacred Temple of the Tooth Relic', detail: 'Drive through Matale spice gardens to Kandy. Visit Sri Dalada Maligawa (Temple of the Sacred Tooth Relic) and watch Kandyan cultural dance.' },
      { day: 'Day 4', title: 'Nuwara Eliya — Little England & Tea Country', detail: 'Scenic mountain climb past Ramboda Falls into misty Nuwara Eliya. Tour Pedro Tea Estate, colonial golf club, and Gregory Lake.' },
      { day: 'Day 5', title: 'Ella Scenic Train to Yala or Bentota Coast', detail: 'Ride the iconic blue train through tea hills over the Nine Arch Bridge, continuing to coastal sanctuary Bentota.' },
      { day: 'Day 6', title: 'UNESCO Galle Dutch Fort & Madu River Boat Safari', detail: 'Explore 17th-century Galle Fort cobblestone ramparts, lighthouse, and boat safari through Madu River mangrove islands with cinnamon peeling.' },
      { day: 'Day 7', title: 'Colombo City Tour & Departure', detail: 'Colombo architectural highlights (Gangarama Temple, Independence Square) and transfer to airport.' }
    ]),
    inclusions: JSON.stringify([
      '6 Nights in 5-Star Boutique Resorts & Tea Bungalows',
      'Private AC Chauffeur Driven Car throughout Sri Lanka',
      'Sigiriya, Dambulla & Kandy Temple VIP entry tickets',
      'Scenic Blue Mountain Train reserved seating',
      'Daily breakfast and authentic Ceylon spiced gourmet dinners'
    ])
  },
  {
    slug: 'bali',
    name: 'Bali: Island of the Gods',
    region: 'Indonesia',
    category: 'international',
    price: '₹42,500',
    duration: '5 Nights 6 Days',
    badge: 'Island Sanctuary',
    departure_date: 'Dec 02, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 6,
    highlights: 'Ubud Rice Terrace Swing, Uluwatu Cliff Temple Sunset, Nusa Penida T-Rex Cliff, Mount Batur',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1100&auto=format&fit=crop',
    description: 'Emerald tiered rice terraces, sacred sea temples, world-famous cliffs and private luxury pool villas in Bali.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Arrival in Bali & Seminyak/Kuta Check-in', detail: 'Traditional frangipani flower greeting at Denpasar Airport (DPS). Private transfer to luxury villa with private pool. Evening beach club sunset.' },
      { day: 'Day 2', title: 'Ubud Arts, Sacred Monkey Forest & Rice Swing', detail: 'Explore Ubud Palace, Tegalalang emerald rice terraces, famous jungle swing, and Tirta Empul holy spring water purification temple.' },
      { day: 'Day 3', title: 'Nusa Penida Island Tour — Kelingking & Broken Beach', detail: 'Fast boat to Nusa Penida island. Marvel at Kelingking Beach (T-Rex cliff), Angel’s Billabong natural infinity pool, and crystal bay.' },
      { day: 'Day 4', title: 'Kintamani Volcano & Coffee Plantation', detail: 'Panoramic views of Mount Batur active volcano and Lake Batur. Taste world-famous Luwak coffee and exotic spices.' },
      { day: 'Day 5', title: 'Water Sports & Uluwatu Sunset Kecak Fire Dance', detail: 'Tanjung Benoa banana boat & jet ski ride, followed by dramatic clifftop sunset at Uluwatu Temple with authentic Kecak fire dance.' },
      { day: 'Day 6', title: 'Bali Departure', detail: 'Souvenir shopping at Krisna Oleh-Oleh and private airport transfer.' }
    ]),
    inclusions: JSON.stringify([
      '5 Nights in 4-Star Resort + 1 Night Private Pool Villa Upgrade',
      'Private AC Car & Dedicated English Speaking Balinese Tour Guide',
      'Speedboat Return Tickets to Nusa Penida Island with Island Transport',
      'Water sports package (Banana Boat & Jet Ski)',
      'Daily breakfast and special beachfront candlelight dinner'
    ])
  },
  {
    slug: 'vietnam',
    name: 'Vietnam: Ha Long Bay & Lantern Trails',
    region: 'Vietnam',
    category: 'international',
    price: '₹75,000',
    duration: '6 Nights 7 Days',
    badge: 'Exotic Asia',
    departure_date: 'Nov 24, 2026',
    departure_status: 'Filling Fast',
    seats_left: 5,
    highlights: 'Overnight Ha Long Bay Luxury Cruise, Hoi An Ancient Lantern Town, Ba Na Hills Golden Bridge',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1100&auto=format&fit=crop',
    description: 'Limestone karst seascapes, ancient yellow lantern streets, world-famous golden bridges and vibrant street culinary culture.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Hanoi Arrival & Old Quarter Street Food', detail: 'Arrive in Hanoi (HAN). Check-in and cyclo tour through the 36 guild streets of Old Quarter, tasting famous egg coffee and Pho.' },
      { day: 'Day 2', title: 'Overnight Luxury Cruise on Ha Long Bay', detail: 'Board 5-star luxury cruise ship through thousands of limestone karst pillars. Kayaking through Sung Sot (Surprise) cave and sunset party on sundeck.' },
      { day: 'Day 3', title: 'Ha Long Sunrise — Flight to Da Nang', detail: 'Morning Tai Chi on deck, bamboo boat through Luon cave, disembark and flight to coastal Da Nang.' },
      { day: 'Day 4', title: 'Ba Na Hills & Iconic Golden Hand Bridge', detail: 'World-record cable car up to Ba Na Hills. Walk the iconic Golden Bridge held by giant stone hands 1,400m above sea level.' },
      { day: 'Day 5', title: 'Hoi An Ancient Lantern Town & Cooking Class', detail: 'Explore UNESCO heritage Hoi An: Japanese Covered Bridge, lantern-lit night market, and coconut boat basket ride in Cam Thanh forest.' },
      { day: 'Day 6', title: 'Marble Mountains & Da Nang Beach', detail: 'Visit Marble Mountains caves and pagodas, relax at My Khe Beach, and see the Dragon Bridge fire show.' },
      { day: 'Day 7', title: 'Da Nang Departure', detail: 'Farewell Vietnamese breakfast and private transfer to Da Nang International Airport (DAD).' }
    ]),
    inclusions: JSON.stringify([
      '6 Nights including 1 Night 5-Star Ha Long Bay Cruise (Balcony Cabin)',
      'All internal domestic flights (Hanoi to Da Nang) included',
      'Ba Na Hills Cable Car and Golden Bridge VIP Pass',
      'Hoi An Basket Boat ride & Lantern Night Experience',
      'All meals on cruise + daily breakfast'
    ])
  },
  {
    slug: 'japan',
    name: 'Japan: Tokyo, Mount Fuji & Kyoto',
    region: 'Japan',
    category: 'international',
    price: '₹185,000',
    duration: '6 Nights 7 Days',
    badge: 'Premium Luxury',
    departure_date: 'Mar 24, 2027',
    departure_status: 'Early Bird Open',
    seats_left: 10,
    highlights: 'Shinkansen Bullet Train, Mount Fuji 5th Station, Kyoto Bamboo Groves, Fushimi Inari Torii',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1100&auto=format&fit=crop',
    description: 'Ultra-modern Tokyo neon streets, cherry blossom gardens, sacred Mount Fuji views, and serene Zen temples of ancient Kyoto.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Tokyo Arrival & Shinjuku Neon Skyline', detail: 'Welcome at Haneda or Narita Airport. Private transfer to 5-star Tokyo hotel. Evening walk through Shinjuku and Tokyo Metropolitan Observatory.' },
      { day: 'Day 2', title: 'Tokyo Icons: Asakusa, Shibuya & Meiji Shrine', detail: 'Explore Senso-ji Temple in Asakusa, stroll peaceful Meiji Jingu shrine, and witness the thrilling organized chaos of Shibuya Crossing.' },
      { day: 'Day 3', title: 'Mount Fuji 5th Station & Lake Kawaguchiko', detail: 'Journey to the majestic Mount Fuji 5th station (2,300m). Cruise on Lake Ashi and ride the Hakone ropeway overlooking steaming volcanic vents.' },
      { day: 'Day 4', title: 'Shinkansen Bullet Train to Kyoto', detail: 'Experience Japan’s 320 km/h Shinkansen bullet train to imperial Kyoto. Visit Kinkaku-ji (Golden Pavilion) and traditional Gion geisha district.' },
      { day: 'Day 5', title: 'Fushimi Inari Shrine & Arashiyama Bamboo Forest', detail: 'Walk through thousands of vermilion torii gates at Fushimi Inari Taisha. Stroll the soaring emerald green Arashiyama bamboo forest and Togetsukyo bridge.' },
      { day: 'Day 6', title: 'Nara Deer Park & Osaka Dotonbori', detail: 'Bow to sacred free-roaming sika deer in Nara Park and visit Todai-ji giant bronze Buddha. Evening Osaka street food safari in neon Dotonbori.' },
      { day: 'Day 7', title: 'Osaka/Tokyo Departure', detail: 'Bullet train return or direct transfer to Kansai/Tokyo Airport for flight home.' }
    ]),
    inclusions: JSON.stringify([
      '6 Nights in 4/5-Star Centrally Located Luxury Hotels',
      '7-Day JR Whole Japan Rail Pass (Shinkansen Bullet Train access)',
      'Mount Fuji & Lake Kawaguchiko Guided Private Day Tour',
      'All temple entry fees, teamLab digital art museum tickets',
      'Daily Japanese & Western breakfast buffets'
    ])
  },
  {
    slug: 'europe',
    name: 'Swiss Alps & Paris Elegance',
    region: 'Europe',
    category: 'international',
    price: '₹390,000',
    duration: '6 Nights 7 Days',
    badge: 'Grand Luxury',
    departure_date: 'Apr 15, 2027',
    departure_status: 'Guaranteed Departure',
    seats_left: 8,
    highlights: 'Paris Eiffel Tower & Seine Cruise, Mount Titlis Rotating Gondola, Lucerne Lake, Zurich Old Town',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1100&auto=format&fit=crop',
    description: 'Champs-Élysées grand boulevards, Eiffel Tower illumination, snow-capped Swiss Alpine peaks and crystal turquoise lakes.',
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Bonjour Paris — City of Lights', detail: 'Arrive at Paris Charles de Gaulle (CDG). Chauffeur transfer to luxury hotel near Champs-Élysées. Evening private illuminated Seine River cruise.' },
      { day: 'Day 2', title: 'Eiffel Tower Top Level & Louvre Masterpieces', detail: 'Skip-the-line elevator to Eiffel Tower 2nd/3rd level for 360-degree panorama of Paris. Private guided walk inside the Louvre Museum visiting Mona Lisa and Venus de Milo.' },
      { day: 'Day 3', title: 'TGV High-Speed Train to Switzerland', detail: 'Board 300 km/h TGV Lyria train from Paris Gare de Lyon to Zurich/Lucerne. Scenic check-in with panoramic Alpine lake views.' },
      { day: 'Day 4', title: 'Mount Titlis Rotating Cable Car & Glacier Cave', detail: 'Ascend to Mount Titlis (3,020m) on the world’s first Rotair revolving cable car. Walk the Titlis Cliff Walk (Europe’s highest suspension bridge) and explore ice cave.' },
      { day: 'Day 5', title: 'Lucerne Chapel Bridge & Lake Cruise', detail: 'Historic walking tour of Lucerne: Lion Monument, 14th-century wooden Chapel Bridge, followed by first-class paddle steamer cruise on Lake Lucerne.' },
      { day: 'Day 6', title: 'Zurich Bahnhofstrasse & Rhine Falls', detail: 'Day excursion to Europe’s largest waterfall — Rhine Falls. Afternoon luxury watch shopping along Zurich’s Bahnhofstrasse and Limmat river.' },
      { day: 'Day 7', title: 'Zurich Departure', detail: 'Breakfast overlooking the Swiss Alps and private transfer to Zurich International Airport (ZRH).' }
    ]),
    inclusions: JSON.stringify([
      '6 Nights in 5-Star Luxury Hotels (Paris & Lucerne/Zurich)',
      '1st Class High-Speed TGV Lyria Train tickets from Paris to Switzerland',
      'Mount Titlis Cable Car with Glacier Park & Suspension Bridge ticket',
      'Skip-the-line Eiffel Tower & Louvre Museum admissions',
      'Daily French and Swiss gourmet breakfast buffets'
    ])
  },
  {
    slug: 'sundarban',
    name: 'Sundarban Tiger Safari & Cruise',
    region: 'West Bengal',
    category: 'expedition',
    price: '₹7,500',
    duration: '2 Nights 3 Days',
    badge: 'Wildlife Special',
    departure_date: 'Oct 16, 2026',
    departure_status: 'Guaranteed Departure',
    seats_left: 12,
    highlights: 'Mangrove Creek Motorboat Safari, Sajnekhali Tiger Watchtower, Dobanki Canopy Walk, Baul Evening',
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1100&auto=format&fit=crop',
    description: "The world's largest mangrove delta — home to the Royal Bengal Tiger, estuarine crocodiles, and mesmerizing tidal waterways.",
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Kolkata to Godkhali & Cruise to Sundarban', detail: 'AC vehicle pickup from Kolkata. Board private covered motorboat at Godkhali port. Cruise along junction of five rivers into mangrove forests. Evening tribal folk dance & Baul music by campfire.' },
      { day: 'Day 2', title: 'Full Day Deep Mangrove Safari & Watchtowers', detail: 'Dawn boat cruise through narrow mangrove creeks. Visit Sajnekhali Tiger Reserve museum & watchtower, Sudhanyakhali freshwater pond, and Dobanki canopy skywalk at 20ft height.' },
      { day: 'Day 3', title: 'Village Life Experience & Return to Kolkata', detail: 'Visit local honey collector villages and Hamilton Estate. Cruise back to Godkhali port and AC vehicle drop to Kolkata by evening.' }
    ]),
    inclusions: JSON.stringify([
      '2 Nights Eco-Luxury Jungle Resort Stays in Sundarban',
      'AC Coach Transportation from Kolkata to Godkhali return',
      'Exclusive Forest Department Licensed Motorboat for full 3-day safaris',
      'All 6 Freshly Cooked Gourmet Meals (Bengali Bhetki, Prawns, Chicken)',
      'Forest Department entry permits, camera charges, and guide fees'
    ])
  },
  {
    slug: 'durga-puja',
    name: 'Kolkata Durga Puja Heritage Walk',
    region: 'West Bengal',
    category: 'expedition',
    price: '₹6,500',
    duration: '2 Nights 3 Days',
    badge: 'UNESCO Cultural Trail',
    departure_date: 'Oct 18, 2026',
    departure_status: 'Few Seats Left',
    seats_left: 4,
    highlights: 'Centuries-old Rajbari Heritage Pujas, VIP Pandal Access, Hooghly River Sunset Cruise, Dhaak Drums',
    image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=1100&auto=format&fit=crop',
    description: "Experience the UNESCO Intangible Cultural Heritage of Humanity — the dazzling grand autumn festival of Kolkata.",
    itinerary: JSON.stringify([
      { day: 'Day 1', title: 'Aristocratic Bonedi Bari (Heritage Mansions) Puja', detail: 'Private guided VIP tour of 250+ year old ancestral home pujas: Sovabazar Rajbari (founded 1757), Jorasanko Daw Bari, and Laha Bari with antique chandeliers and traditional bhog.' },
      { day: 'Day 2', title: 'Modern Theme Pandals & Hooghly River Cruise', detail: 'Fast-track VIP access to celebrated contemporary art pandals in South Kolkata (Ekdalia, Ballygunge, Maddox Square). Sunset luxury cruiser on the Hooghly river witnessing immersion rituals.' },
      { day: 'Day 3', title: 'Sindoor Khela & Immersion Procession', detail: 'Witness the emotional Dashami Sindoor Khela ritual at historic ghats, hearing resonant Dhaak drums, followed by grand farewell feast.' }
    ]),
    inclusions: JSON.stringify([
      '2 Nights in Central Kolkata Heritage Luxury Hotel',
      'Special VIP Passes for No-Queue Access to Top 15 Mega Pandals',
      'Private AC Tourist Coach with Cultural Heritage Historian',
      'Exclusive Sunset Cruise on Hooghly River with live Baul music',
      'Authentic Royal Bengali Mahabhoj lunches and dinners'
    ])
  }
];

// Upsert all seed destinations
const upsertStmt = db.prepare(`
  INSERT INTO destinations (slug, name, region, category, price, duration, badge, departure_date, departure_status, seats_left, highlights, image, description, itinerary, inclusions)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    region = excluded.region,
    category = excluded.category,
    price = excluded.price,
    duration = excluded.duration,
    badge = excluded.badge,
    departure_date = excluded.departure_date,
    departure_status = excluded.departure_status,
    seats_left = excluded.seats_left,
    highlights = excluded.highlights,
    image = excluded.image,
    description = excluded.description,
    itinerary = excluded.itinerary,
    inclusions = excluded.inclusions;
`);

for (const d of seedDestinations) {
  upsertStmt.run(
    d.slug,
    d.name,
    d.region,
    d.category,
    d.price,
    d.duration,
    d.badge,
    d.departure_date,
    d.departure_status,
    d.seats_left,
    d.highlights,
    d.image,
    d.description,
    d.itinerary,
    d.inclusions
  );
}

module.exports = {
  db,

  // Inquiries
  createInquiry(data) {
    const stmt = db.prepare(`
      INSERT INTO inquiries (name, email, phone, destination, travel_date, travellers, travel_style, budget, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.name.trim(),
      data.email.trim().toLowerCase(),
      data.phone.trim(),
      data.destination || 'All India',
      data.travel_date || '',
      data.travellers || '2 adults',
      data.travel_style || 'Luxury',
      Number(data.budget) || 0,
      data.message || ''
    );
    return this.getInquiryById(info.lastInsertRowid);
  },

  getInquiryById(id) {
    return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  },

  getAllInquiries(filter = {}) {
    let query = 'SELECT * FROM inquiries';
    const params = [];
    const conditions = [];

    if (filter.status && filter.status !== 'all') {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    if (filter.destination && filter.destination !== 'all') {
      conditions.push('destination = ?');
      params.push(filter.destination);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    return db.prepare(query).all(...params);
  },

  updateInquiry(id, updates) {
    const fields = [];
    const values = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.budget !== undefined) {
      fields.push('budget = ?');
      values.push(Number(updates.budget) || 0);
    }

    if (fields.length === 0) return this.getInquiryById(id);

    values.push(id);
    db.prepare(`UPDATE inquiries SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getInquiryById(id);
  },

  deleteInquiry(id) {
    return db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
  },

  // Newsletter Subscribers
  addSubscriber(email, source = 'website_cta') {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const stmt = db.prepare('INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)');
      const info = stmt.run(cleanEmail, source);
      return { id: info.lastInsertRowid, email: cleanEmail, alreadySubscribed: false };
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return { email: cleanEmail, alreadySubscribed: true };
      }
      throw err;
    }
  },

  getAllSubscribers() {
    return db.prepare('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC').all();
  },

  // Callbacks
  createCallback(phone, preferred_time = 'ASAP') {
    const stmt = db.prepare('INSERT INTO callbacks (phone, preferred_time) VALUES (?, ?)');
    const info = stmt.run(phone.trim(), preferred_time.trim());
    return db.prepare('SELECT * FROM callbacks WHERE id = ?').get(info.lastInsertRowid);
  },

  getAllCallbacks() {
    return db.prepare('SELECT * FROM callbacks ORDER BY created_at DESC').all();
  },

  updateCallbackStatus(id, status) {
    db.prepare('UPDATE callbacks SET status = ? WHERE id = ?').run(status, id);
    return db.prepare('SELECT * FROM callbacks WHERE id = ?').get(id);
  },

  // Destinations & Tour Catalog
  getAllDestinations(filter = {}) {
    let query = 'SELECT * FROM destinations';
    const params = [];
    if (filter.category && filter.category !== 'all') {
      query += ' WHERE category = ?';
      params.push(filter.category);
    }
    query += ' ORDER BY id ASC';
    const rows = db.prepare(query).all(...params);
    return rows.map(r => ({
      ...r,
      image_url: r.image,
      highlights: r.highlights ? (typeof r.highlights === 'string' && r.highlights.startsWith('[') ? JSON.parse(r.highlights) : r.highlights.split(',').map(s => s.trim())) : [],
      itinerary: r.itinerary ? JSON.parse(r.itinerary) : [],
      inclusions: r.inclusions ? JSON.parse(r.inclusions) : []
    }));
  },

  getDestinationBySlug(slug) {
    const r = db.prepare('SELECT * FROM destinations WHERE slug = ?').get(slug);
    if (!r) return null;
    return {
      ...r,
      image_url: r.image,
      highlights: r.highlights ? (typeof r.highlights === 'string' && r.highlights.startsWith('[') ? JSON.parse(r.highlights) : r.highlights.split(',').map(s => s.trim())) : [],
      itinerary: r.itinerary ? JSON.parse(r.itinerary) : [],
      inclusions: r.inclusions ? JSON.parse(r.inclusions) : []
    };
  },

  // Fixed Departures (from Mercury Tour Operator model)
  getUpcomingDepartures() {
    const rows = db.prepare(`
      SELECT slug, name, region, category, price, duration, badge, departure_date, departure_status, seats_left, image
      FROM destinations
      WHERE departure_date IS NOT NULL AND departure_date != ''
      ORDER BY id ASC
    `).all();
    return rows.map(r => ({ ...r, image_url: r.image }));
  },

  getDepartures() {
    return this.getUpcomingDepartures();
  },

  // Statistics
  getStats() {
    const totalInquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
    const newInquiries = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'").get().count;
    const bookedInquiries = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'booked'").get().count;
    const totalSubscribers = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get().count;
    const pendingCallbacks = db.prepare("SELECT COUNT(*) as count FROM callbacks WHERE status = 'pending'").get().count;
    const totalDestinations = db.prepare('SELECT COUNT(*) as count FROM destinations').get().count;
    const topDest = db.prepare(`
      SELECT destination, COUNT(*) as count
      FROM inquiries
      WHERE destination IS NOT NULL AND destination != ''
      GROUP BY destination
      ORDER BY count DESC
      LIMIT 1
    `).get();

    return {
      totalInquiries,
      newInquiries,
      bookedInquiries,
      totalSubscribers,
      pendingCallbacks,
      totalDestinations,
      topDestination: topDest ? topDest.destination : 'Kashmir',
      conversionRate: totalInquiries > 0 ? ((bookedInquiries / totalInquiries) * 100).toFixed(1) + '%' : '0%'
    };
  }
};
