const http = require('node:http');
const url = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const db = require('./db/database');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Helper to send error response
function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

// Server instance
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  /* -------------------------------------------------------------
     API ROUTES
  ------------------------------------------------------------- */
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health check
      if (pathname === '/api/health' && method === 'GET') {
        return sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
      }

      // 2. Destinations
      if (pathname === '/api/destinations' && method === 'GET') {
        const destinations = db.getAllDestinations();
        return sendJson(res, 200, destinations);
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
            message: 'Your journey consultation request has been received. Our luxury travel curator will reach out shortly.',
            inquiry
          });
        }
      }

      // Inquiries by ID (PATCH / DELETE)
      const inquiryMatch = pathname.match(/^\/api\/inquiries\/(\d+)$/);
      if (inquiryMatch) {
        const id = Number(inquiryMatch[1]);
        if (method === 'PATCH') {
          const body = await parseBody(req);
          const updated = db.updateInquiry(id, body);
          return sendJson(res, 200, { success: true, inquiry: updated });
        }
        if (method === 'DELETE') {
          db.deleteInquiry(id);
          return sendJson(res, 200, { success: true, message: 'Inquiry removed' });
        }
      }

      // 5. Newsletter
      if (pathname === '/api/newsletter') {
        if (method === 'POST') {
          const body = await parseBody(req);
          if (!body.email || !body.email.includes('@')) {
            return sendError(res, 400, 'A valid email address is required');
          }
          const result = db.addSubscriber(body.email, body.source || 'website_cta');
          return sendJson(res, 200, {
            success: true,
            message: result.alreadySubscribed
              ? 'You are already subscribed to our field notes.'
              : 'Welcome aboard. You are now subscribed to Saad Tour & Travels field notes.',
            ...result
          });
        }
        if (method === 'GET') {
          const subscribers = db.getAllSubscribers();
          return sendJson(res, 200, subscribers);
        }
      }

      // 6. Callbacks
      if (pathname === '/api/callbacks') {
        if (method === 'POST') {
          const body = await parseBody(req);
          if (!body.phone || !body.phone.trim()) {
            return sendError(res, 400, 'Phone number is required');
          }
          const callback = db.createCallback(body.phone, body.preferred_time || 'ASAP');
          return sendJson(res, 201, {
            success: true,
            message: 'Callback request registered. An advisor will call you promptly.',
            callback
          });
        }
        if (method === 'GET') {
          const callbacks = db.getAllCallbacks();
          return sendJson(res, 200, callbacks);
        }
      }

      const callbackMatch = pathname.match(/^\/api\/callbacks\/(\d+)$/);
      if (callbackMatch && method === 'PATCH') {
        const id = Number(callbackMatch[1]);
        const body = await parseBody(req);
        const updated = db.updateCallbackStatus(id, body.status || 'completed');
        return sendJson(res, 200, { success: true, callback: updated });
      }

      // 7. CSV Export
      if (pathname === '/api/export/inquiries.csv' && method === 'GET') {
        const inquiries = db.getAllInquiries();
        const headers = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Destination', 'Travel Date', 'Travellers', 'Style', 'Budget (INR)', 'Status', 'Message', 'Notes'];
        const rows = inquiries.map(q => [
          q.id,
          `"${q.created_at}"`,
          `"${(q.name || '').replace(/"/g, '""')}"`,
          `"${(q.email || '').replace(/"/g, '""')}"`,
          `"${(q.phone || '').replace(/"/g, '""')}"`,
          `"${(q.destination || '').replace(/"/g, '""')}"`,
          `"${(q.travel_date || '').replace(/"/g, '""')}"`,
          `"${(q.travellers || '').replace(/"/g, '""')}"`,
          `"${(q.travel_style || '').replace(/"/g, '""')}"`,
          q.budget || 0,
          `"${q.status}"`,
          `"${(q.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(q.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="saad_tours_inquiries.csv"'
        });
        return res.end(csvContent);
      }

      // Route not found
      return sendError(res, 404, 'API endpoint not found');
    } catch (err) {
      console.error('API Error:', err);
      return sendError(res, 500, err.message || 'Internal server error');
    }
  }

  /* -------------------------------------------------------------
     ADMIN ALIAS
  ------------------------------------------------------------- */
  if (pathname === '/admin' || pathname === '/admin/') {
    const adminPath = path.join(PUBLIC_DIR, 'admin.html');
    if (fs.existsSync(adminPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(adminPath).pipe(res);
    }
  }

  /* -------------------------------------------------------------
     STATIC FILE SERVING
  ------------------------------------------------------------- */
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Saad Tour & Travels Server`);
  console.log(` Running at: http://localhost:${PORT}`);
  console.log(` Admin Portal: http://localhost:${PORT}/admin`);
  console.log(` API Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

