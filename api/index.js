const url = require('node:url');
const db = require('../db/database');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch(e) {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // 1. Health check
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
    }

    // 2. Destinations
    if (pathname === '/api/destinations' && method === 'GET') {
      const filter = {
        category: parsedUrl.query.category
      };
      const destinations = db.getAllDestinations(filter);
      return sendJson(res, 200, destinations);
    }

    const destMatch = pathname.match(/^\/api\/destinations\/([a-zA-Z0-9_-]+)$/);
    if (destMatch && method === 'GET') {
      const dest = db.getDestinationBySlug(destMatch[1]);
      if (!dest) return sendError(res, 404, 'Destination not found');
      return sendJson(res, 200, dest);
    }

    // 2b. Departures
    if (pathname === '/api/departures' && method === 'GET') {
      const departures = db.getUpcomingDepartures();
      return sendJson(res, 200, departures);
    }

    // 3. Stats
    if (pathname === '/api/stats' && method === 'GET') {
      const stats = db.getStats();
      return sendJson(res, 200, stats);
    }

    // 4. Inquiries
    if (pathname === '/api/inquiries') {
      if (method === 'GET') {
        const filter = {
          status: parsedUrl.query.status,
          destination: parsedUrl.query.destination
        };
        const inquiries = db.getAllInquiries(filter);
        return sendJson(res, 200, inquiries);
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.name.trim()) {
          return sendError(res, 400, 'Name is required');
        }
        if (!body.email || !body.email.includes('@')) {
          return sendError(res, 400, 'A valid email is required');
        }
        if (!body.phone || !body.phone.trim()) {
          return sendError(res, 400, 'Phone number is required');
        }

        const inquiry = db.createInquiry(body);
        return sendJson(res, 201, {
          success: true,
          message: 'Journey inquiry submitted successfully. A private travel curator will contact you shortly.',
          inquiry
        });
      }
    }

    // Inquiry detail / update
    const inqMatch = pathname.match(/^\/api\/inquiries\/(\d+)$/);
    if (inqMatch) {
      const id = parseInt(inqMatch[1], 10);
      if (method === 'GET') {
        const inq = db.getInquiryById(id);
        if (!inq) return sendError(res, 404, 'Inquiry not found');
        return sendJson(res, 200, inq);
      }
      if (method === 'PATCH') {
        const body = await parseBody(req);
        const updated = db.updateInquiry(id, body);
        return sendJson(res, 200, { success: true, inquiry: updated });
      }
      if (method === 'DELETE') {
        db.deleteInquiry(id);
        return sendJson(res, 200, { success: true, message: 'Inquiry deleted' });
      }
    }

    // 5. Callbacks
    if (pathname === '/api/callbacks') {
      if (method === 'GET') {
        const callbacks = db.getAllCallbacks();
        return sendJson(res, 200, callbacks);
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.phone || !body.phone.trim()) {
          return sendError(res, 400, 'Phone number is required');
        }
        const cb = db.createCallback(body.phone, body.preferred_time);
        return sendJson(res, 201, {
          success: true,
          message: 'Callback request received. We will reach out shortly.',
          callback: cb
        });
      }
    }

    const cbMatch = pathname.match(/^\/api\/callbacks\/(\d+)$/);
    if (cbMatch && method === 'PATCH') {
      const id = parseInt(cbMatch[1], 10);
      const body = await parseBody(req);
      const updated = db.updateCallbackStatus(id, body.status || 'completed');
      return sendJson(res, 200, { success: true, callback: updated });
    }

    // 6. Newsletter
    if (pathname === '/api/newsletter') {
      if (method === 'GET') {
        const subs = db.getAllSubscribers();
        return sendJson(res, 200, subs);
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.email || !body.email.includes('@')) {
          return sendError(res, 400, 'A valid email address is required');
        }
        const result = db.addSubscriber(body.email, body.source || 'website_cta');
        if (result.alreadySubscribed) {
          return sendJson(res, 200, {
            success: true,
            alreadySubscribed: true,
            message: 'You are already subscribed to our luxury travel dispatches.'
          });
        }
        return sendJson(res, 201, {
          success: true,
          message: 'Thank you for subscribing to Tours&Co field notes.'
        });
      }
    }

    // 7. CSV Export
    if (pathname === '/api/export/inquiries.csv' && method === 'GET') {
      const csv = db.exportInquiriesCSV();
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="toursandco_inquiries_' + Date.now() + '.csv"'
      });
      return res.end(csv);
    }

    return sendError(res, 404, 'Endpoint not found: ' + pathname);
  } catch (err) {
    console.error('Vercel API error:', err);
    return sendError(res, 500, 'Internal server error: ' + err.message);
  }
};
