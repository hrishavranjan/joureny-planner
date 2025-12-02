// backend/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({ origin: 'https://joureny-planner.vercel.app' }));
app.use(express.json({ limit: '1mb' }));

// =============================
//  🔑 GEMINI CONFIG
// =============================
// Move these to .env in production
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  'AIzaSyCFcm1tHnx7QSKbnIIWgrCuUJCuMwOFMbE';

const MODEL_NAME = process.env.MODEL_NAME || 'gemini-2.5-flash';

// Official REST pattern:
// https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=API_KEY
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

// =============================
//  🔑 AMADEUS CONFIG (Flights/Hotels - used only for cityCode)
// =============================
const AMADEUS_CLIENT_ID =
  process.env.AMADEUS_CLIENT_ID || 'SzaEXGlgm3pbfAsDgK6b1CucElg0Y2Bq';
const AMADEUS_CLIENT_SECRET =
  process.env.AMADEUS_CLIENT_SECRET || 'XbQs3U9fEe6WPhdh';
const AMADEUS_BASE = process.env.AMADEUS_BASE || 'https://test.api.amadeus.com';

let amadeusToken = null;
let amadeusTokenExpiry = 0;

// =============================
//  🔑 RAPIDAPI INDIAN RAILWAYS (Trains)
// =============================
const RAPIDAPI_KEY =
  process.env.RAPIDAPI_KEY ||
  '262e5262damshb097cc26feeb6f7p108b1ejsn67599f0e215f';
const RAPIDAPI_HOST = 'indian-railway-irctc.p.rapidapi.com';

// =============================
//  BASIC HELPERS
// =============================

app.get('/api/health', (req, res) => res.json({ ok: true }));

function buildMockSuggestions({ mood, country, state, budget, travelers }) {
  const b = Number(budget) || 50000;
  const t = Number(travelers) || 1;
  const perPerson = Math.round(b / Math.max(t, 1));

  const baseNames = [
    'City Highlights',
    'Hidden Gems',
    'Nature Escape',
    'Food & Culture',
    'Adventure Mix',
    'Relax & Reset'
  ];

  const prefix = state
    ? `${country} - ${state}`
    : country || 'Destination';

  return baseNames.map((label, idx) => ({
    destination: `${prefix} - ${label}`,
    summary: `Suggested ${mood || 'trip'} in ${prefix}: ${label.toLowerCase()} with approx per-person cost.`,
    tags: [mood || 'Trip', country || 'World', label.toLowerCase()],
    approxBaseCost: perPerson + idx * 1500
  }));
}

// ======== Amadeus helpers (for city codes only) ========

async function getAmadeusToken() {
  const now = Date.now();
  if (amadeusToken && now < amadeusTokenExpiry - 60_000) {
    return amadeusToken;
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: AMADEUS_CLIENT_ID,
    client_secret: AMADEUS_CLIENT_SECRET
  });

  const resp = await axios.post(
    `${AMADEUS_BASE}/v1/security/oauth2/token`,
    params,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    }
  );

  amadeusToken = resp.data.access_token;
  const expiresIn = resp.data.expires_in || 1800;
  amadeusTokenExpiry = now + expiresIn * 1000;
  return amadeusToken;
}

async function resolveCityCode(destinationRaw) {
  const token = await getAmadeusToken();

  let keyword = (destinationRaw || '').split('-')[0];
  keyword = keyword.split(',')[0].trim();
  if (!keyword) keyword = (destinationRaw || '').trim();
  if (!keyword) return null;

  const resp = await axios.get(`${AMADEUS_BASE}/v1/reference-data/locations`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      keyword,
      subType: 'CITY',
      'page[limit]': 1
    },
    timeout: 10000
  });

  const data = resp.data?.data || [];
  if (!data.length) return null;
  return data[0].iataCode || null;
}

function buildMockTrainPrice(cityCode, travelers) {
  const base = 1200 + (cityCode ? cityCode.charCodeAt(0) * 5 : 0);
  return {
    price: base * travelers,
    currency: 'INR'
  };
}

// ======== RapidAPI Indian Railway helper ========
async function fetchTrainViaRapidAPI(trainNumber, travelers) {
  const departureDate = '20250717'; // demo

  const resp = await axios.get(
    'https://indian-railway-irctc.p.rapidapi.com/api/trains/v1/train/status',
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapid-api': 'rapid-api-database'
      },
      params: {
        departure_date: departureDate,
        isH5: 'true',
        client: 'web',
        deviceIdentifier: 'JourneyPlanner-App',
        train_number: trainNumber
      },
      timeout: 15000
    }
  );

  const base = 900;
  return {
    price: base * travelers,
    currency: 'INR',
    source: 'IRCTC RapidAPI',
    rawStatus: resp.data
  };
}

// Helper to split approxBaseCost into hotel/food/transport/shopping/activities
function buildCostBreakdownFromBase(amount) {
  const num = Number(amount || 0);
  if (!num || num <= 0) {
    return {
      hotelPerNight: 0,
      foodPerDay: 0,
      transport: 0,
      shopping: 0,
      activities: 0,
      totalPerPerson: 0
    };
  }

  const nights = 2;
  const days = 2;

  const hotelPerNight = Math.round((num * 0.35) / nights);
  const foodPerDay = Math.round((num * 0.2) / days);
  const transport = Math.round(num * 0.15);
  const shopping = Math.round(num * 0.15);

  const used =
    hotelPerNight * nights +
    foodPerDay * days +
    transport +
    shopping;

  const activities = Math.max(0, num - used);

  return {
    hotelPerNight,
    foodPerDay,
    transport,
    shopping,
    activities,
    totalPerPerson: num
  };
}

// NEW: make sure we can read numbers even if Gemini adds " INR", etc.
function normalizeBaseFromSuggestion(s) {
  const candidates = [
    s.approxBaseCost,
    s.estimatedPerPerson,
    s.totalPerPerson,
    s.perPerson,
    s.costPerPerson,
    s.pricePerPerson
  ];

  for (const raw of candidates) {
    if (raw === undefined || raw === null) continue;

    if (typeof raw === 'number' && !Number.isNaN(raw) && raw > 0) {
      return raw;
    }

    const cleaned = String(raw).match(/[\d.]+/g);
    if (cleaned && cleaned.length) {
      const n = Number(cleaned.join(''));
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }

  return 0;
}

// =============================
//  GEMINI: AI RECOMMENDATIONS
// =============================

app.post('/api/gemini-recommendations', async (req, res) => {
  try {
    const {
      mood,
      country,
      state,
      budget,
      travelers,
      existing
    } = req.body || {};

    const existingList = Array.isArray(existing) ? existing : [];
    const existingStr = existingList.join(', ');

    if (!mood || !country) {
      const mock = buildMockSuggestions({
        mood,
        country,
        state,
        budget,
        travelers
      }).map((s) => {
        const base = normalizeBaseFromSuggestion(s);
        return {
          ...s,
          approxBaseCost: base,
          breakdown: buildCostBreakdownFromBase(base)
        };
      });

      return res.json({
        success: true,
        suggestions: mock,
        note: 'Required fields missing. Using local suggestions.'
      });
    }

    const prompt = `
Return a JSON array of up to 10 DIFFERENT travel suggestions for a user.

Mood: ${mood}
Country: ${country}
StateOrRegion: ${state || 'Any'}
TotalBudgetINR: ${budget}
Travelers: ${travelers}
ExistingDestinations (do NOT repeat any of these city/place names): [${existingStr}]

Each object MUST be exactly:
{
  "destination": "City or Place, State",
  "summary": "1–3 lines about this place (small history + why visit)",
  "tags": ["tag1","tag2","tag3"],
  "approxBaseCost": number  // per person, INR
}

Rules:
- Give a mix of famous and lesser-known places.
- Do NOT include any destination whose city/place name already appears in ExistingDestinations.
- Avoid repeating the same city name across different objects in the same response.
- Respond with VALID JSON ONLY (no backticks, no extra text).
`.trim();

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 1.0,
        topP: 0.9,
        topK: 40
      }
    };

    let suggestions = [];

    try {
      console.log('Using Gemini model:', MODEL_NAME);
      console.log('Calling Gemini endpoint:', GEMINI_ENDPOINT);

      const upstreamResp = await axios.post(GEMINI_ENDPOINT, body, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      console.log('Upstream status:', upstreamResp.status);

      const data = upstreamResp.data || {};
      const candidates = data.candidates || [];
      const first = candidates[0]?.content;

      let textual = '';

      if (first?.parts && Array.isArray(first.parts)) {
        textual = first.parts.map((p) => (p.text || '')).join('');
      } else if (typeof first === 'string') {
        textual = first;
      } else {
        textual = JSON.stringify(data);
      }

      let cleaned = (textual || '').trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, '');
        if (cleaned.endsWith('```')) {
          cleaned = cleaned.slice(0, -3).trim();
        }
      }

      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      const startIndex =
        firstBracket !== -1 &&
        (firstBracket < firstBrace || firstBrace === -1)
          ? firstBracket
          : firstBrace;
      if (startIndex > 0) {
        cleaned = cleaned.slice(startIndex);
      }

      const parsed = JSON.parse(cleaned);
      suggestions = Array.isArray(parsed) ? parsed : [parsed];
    } catch (parseOrUpErr) {
      console.warn(
        'Gemini parse/upstream error, using mock suggestions:',
        parseOrUpErr.message || parseOrUpErr
      );
      suggestions = buildMockSuggestions({
        mood,
        country,
        state,
        budget,
        travelers
      });
    }

    const withBreakdown = (suggestions || []).map((s) => {
      const base = normalizeBaseFromSuggestion(s);
      const breakdown = buildCostBreakdownFromBase(base);

      return {
        destination: s.destination,
        summary: s.summary,
        tags: s.tags || [],
        approxBaseCost: base,
        breakdown
      };
    });

    return res.json({ success: true, suggestions: withBreakdown });
  } catch (err) {
    console.error('Hard failure in /api/gemini-recommendations:', err);
    const { mood, country, state, budget, travelers } = req.body || {};
    const mock = buildMockSuggestions({
      mood,
      country,
      state,
      budget,
      travelers
    }).map((s) => {
      const base = normalizeBaseFromSuggestion(s);
      return {
        destination: s.destination,
        summary: s.summary,
        tags: s.tags || [],
        approxBaseCost: base,
        breakdown: buildCostBreakdownFromBase(base)
      };
    });
    return res.json({
      success: true,
      suggestions: mock,
      note: 'Server error fallback.'
    });
  }
});

// =============================
//  LIVE PRICING (Train only used in UI)
// =============================
app.post('/api/live-pricing-batch', async (req, res) => {
  try {
    const {
      destinations = [],
      travelers = 1,
      includeTrain = false,
      country = ''
    } = req.body || {};

    const result = {};
    const meta = { trainRedirect: false };

    for (const dest of destinations) {
      if (!dest) continue;

      console.log('Live pricing for destination:', dest);
      let cityCode = null;
      try {
        cityCode = await resolveCityCode(dest);
      } catch (err) {
        console.warn('resolveCityCode failed for', dest, err.message);
      }

      let train = null;

      if (cityCode && country === 'India' && includeTrain) {
        try {
          train = await fetchTrainViaRapidAPI('12051', travelers);
        } catch (err) {
          console.warn(
            'RapidAPI train call failed, will ask frontend to redirect to IRCTC.',
            err.message
          );
          meta.trainRedirect = true;
          train = buildMockTrainPrice(cityCode, travelers);
        }
      }

      result[dest] = {
        train: train || null
      };
    }

    return res.json({ __meta: meta, ...result });
  } catch (err) {
    console.error('Error in /api/live-pricing-batch:', err);
    return res.status(500).json({ error: 'pricing failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);
