import React, { useState, useEffect, useContext } from 'react';
import '../css/AiMoodTrips.css';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BRAND_NAME = 'Journey-Planner';
const BRAND_EMAIL = 'hrishavranjan2003@gmail.com';

// World country list
const WORLD_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bangladesh', 'Belarus', 'Belgium', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China',
  'Colombia', 'Costa Rica', 'Croatia', 'Cyprus', 'Czech Republic',
  'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia',
  'Ethiopia', 'Finland', 'France', 'Georgia', 'Germany',
  'Greece', 'Guatemala', 'Hong Kong', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia', 'Maldives',
  'Malta', 'Mexico', 'Moldova', 'Monaco', 'Mongolia',
  'Morocco', 'Myanmar', 'Nepal', 'Netherlands', 'New Zealand',
  'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia',
  'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Tunisia',
  'Turkey', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vietnam', 'Zambia', 'Zimbabwe'
];

// Indian states / UTs
const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

// Simple country → flag (fallback 🌍)
const COUNTRY_FLAGS = {
  India: '🇮🇳',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  Germany: '🇩🇪',
  France: '🇫🇷',
  Italy: '🇮🇹',
  Spain: '🇪🇸',
  Portugal: '🇵🇹',
  Brazil: '🇧🇷',
  Mexico: '🇲🇽',
  Japan: '🇯🇵',
  China: '🇨🇳',
  'South Korea': '🇰🇷',
  Russia: '🇷🇺',
  'Sri Lanka': '🇱🇰',
  Nepal: '🇳🇵',
  'United Arab Emirates': '🇦🇪',
  Singapore: '🇸🇬',
  Switzerland: '🇨🇭',
  Netherlands: '🇳🇱',
  Sweden: '🇸🇪'
};

const getFlag = (country) => COUNTRY_FLAGS[country] || '🌍';

// Saved structure in localStorage: { map: {key: true}, trips: [trip,...] }
const STORAGE_KEY = 'jp_saved_ai_trips';

const AiMoodTrips = () => {
  const { user } = useContext(UserContext);

  const [form, setForm] = useState({
    mood: '',
    country: '',
    state: '',
    budget: '',
    travelers: 1,
    useAiPlaces: false,
    useTrain: false,
    useLocalRecommendations: true
  });
  const [tripData, setTripData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [statesForCountry, setStatesForCountry] = useState([]);

  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [savedMap, setSavedMap] = useState({});

  const loadSavedFromStorage = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { map: {}, trips: [] };

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        const map = {};
        parsed.forEach((key) => {
          map[key] = true;
        });
        return { map, trips: [] };
      }

      const map = parsed.map || (typeof parsed === 'object' ? parsed : {});
      const trips = Array.isArray(parsed.trips) ? parsed.trips : [];
      return { map, trips };
    } catch {
      return { map: {}, trips: [] };
    }
  };

  const saveToStorage = (map, trips) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ map, trips })
      );
    } catch {
    }
  };

  useEffect(() => {
    fetch('/ai_trip_dataset_final.json')
      .then((res) => res.json())
      .then((data) => {
        setTripData(data);
        const dataCountries = [...new Set(data.map((item) => item.Country))];
        const merged = Array.from(
          new Set([...WORLD_COUNTRIES, ...dataCountries])
        ).sort();
        setCountries(merged);
      })
      .catch((err) => console.error('Error loading JSON:', err));
  }, []);

  useEffect(() => {
    const { map } = loadSavedFromStorage();
    setSavedMap(map);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };

      if (name === 'mood') {
        if (value === 'Solo' && (!prev.travelers || prev.travelers < 1)) {
          next.travelers = 1;
        }
        if (value === 'Honeymoon' && (!prev.travelers || prev.travelers < 1)) {
          next.travelers = 1;
        }
      }

      if (name === 'country') {
        if (value === 'India') {
          setStatesForCountry([...INDIA_STATES]);
          next.state = '';
        } else {
          const countryStates = tripData
            .filter((t) => t.Country === value && t.State)
            .map((t) => t.State);
          next.state = '';
          setStatesForCountry(Array.from(new Set(countryStates)).sort());
        }
      }

      if (type === 'checkbox') {
        const labelMap = {
          useAiPlaces: '🤖 AI Places Suggestions',
          useTrain: '🚆 Train details',
          useLocalRecommendations: '📚 Journey-Planner Recommendations'
        };
        const label = labelMap[name] || 'Option';
        toast.info(
          `${checked ? '✅ Enabled' : '❌ Disabled'} ${label}`,
          {
            position: 'top-center',
            autoClose: 2000
          }
        );
      }

      return next;
    });
  };

  const computeEstimatedTotalPerPerson = (trip, nights = 2, days = 2) => {
    return (
      (+trip['Avg Flight Cost (₹)'] || 0) +
      (+trip['Hotel (₹/night)'] || 0) * nights +
      (+trip['Food (₹/day)'] || 0) * days +
      (+trip['Local Transport (₹)'] || 0) +
      (+trip['Shopping (₹)'] || 0)
    );
  };

  const generateWithGeminiViaBackend = async ({
    mood,
    country,
    state,
    budget,
    travelers,
    existing = []
  }) => {
    const url = 'http://localhost:4000/api/gemini-recommendations';
    const resp = await axios.post(url, {
      mood,
      country,
      state,
      budget,
      travelers,
      existing
    });
    if (!resp.data || !resp.data.success) {
      throw new Error('LLM proxy returned an error');
    }
    return resp.data.suggestions || [];
  };

  const buildShareText = (trip, mood, travelers, budget) => {
    const title =
      trip.destination ||
      trip.DestinationName ||
      trip['Destination Name'] ||
      'Trip Suggestion';

    const country = trip.Country || form.country || '';
    const state = trip.parsedState || trip.State || form.state || '';
    const lines = [];

    lines.push(`🧳 ${title}`);
    if (country) {
      lines.push(`🌍 Country: ${country}${state ? ` (${state})` : ''}`);
    }
    lines.push(`🧠 Mood: ${mood}`);
    lines.push(`👥 Travelers: ${travelers}`);
    if (budget) lines.push(`💰 Total Budget: ₹${budget}`);

    if (trip.summary || trip.reason) {
      lines.push('');
      lines.push(`📍 About this place: ${trip.summary || trip.reason}`);
    }

    const bd = trip.breakdown;
    if (bd) {
      lines.push('');
      lines.push('💸 Cost breakdown (per person, approx.):');
      if (bd.hotelPerNight) {
        lines.push(`• 🏨 Hotel (per night): ₹${bd.hotelPerNight}`);
      }
      if (bd.foodPerDay) {
        lines.push(`• 🍽️ Food (per day): ₹${bd.foodPerDay}`);
      }
      if (bd.transport) {
        lines.push(`• 🚕 Transport (local): ₹${bd.transport}`);
      }
      if (bd.shopping) {
        lines.push(`• 🛍️ Shopping: ₹${bd.shopping}`);
      }
      if (bd.activities) {
        lines.push(`• 🎯 Activities: ₹${bd.activities}`);
      }
      lines.push(
        `➡️ Approx. base cost per person: ₹${bd.totalPerPerson || 0}`
      );
    }

    if (trip.train) {
      lines.push(
        `🚆 Train (total for all travellers, approx.): ₹${trip.train.price} ${trip.train.currency}`
      );
    }

    lines.push('');
    lines.push(`Shared via ${BRAND_NAME}`);
    lines.push(`📧 Contact: ${BRAND_EMAIL}`);

    return lines.join('\n');
  };

  const handleShareCard = async (trip, travelers, budget) => {
    const shareText = buildShareText(trip, form.mood, travelers, budget);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${BRAND_NAME} Trip Suggestion`,
          text: shareText
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        toast.success('📋 Trip card copied. You can paste and share anywhere.', {
          position: 'top-center',
          autoClose: 3000
        });
      } else {
        window.location.href = `mailto:?subject=${encodeURIComponent(
          'Trip Suggestion'
        )}&body=${encodeURIComponent(shareText)}`;
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast.error('⚠️ Unable to share card. Try copying manually.', {
        position: 'top-center',
        autoClose: 3000
      });
    }
  };

  const getDestKey = (trip) =>
    (
      trip.destination ||
      trip.DestinationName ||
      trip['Destination Name'] ||
      ''
    )
      .toString()
      .toLowerCase()
      .trim();

  const toggleSaveCard = (trip) => {
    const key = getDestKey(trip);
    if (!key) return;

    const { map, trips } = loadSavedFromStorage();
    const nextMap = { ...map };
    let nextTrips = Array.isArray(trips) ? [...trips] : [];

    if (nextMap[key]) {
      delete nextMap[key];
      nextTrips = nextTrips.filter((t) => getDestKey(t) !== key);
      toast.info('🗑️ Removed from saved trips.', {
        position: 'top-center',
        autoClose: 3000
      });
    } else {
      nextMap[key] = true;
      nextTrips.push({
        ...trip,
        savedAt: new Date().toISOString()
      });
      toast.success('⭐ Trip saved to your Saved Trips page!', {
        position: 'top-center',
        autoClose: 3000
      });
    }

    saveToStorage(nextMap, nextTrips);
    setSavedMap(nextMap);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.info('🔍 Searching for the best trips for you...', {
      position: 'top-center',
      autoClose: 5000
    });

    setLoading(true);
    setSuggestions([]);

    const rawTravelers = parseInt(form.travelers, 10) || 1;
    const travelers =
      form.mood === 'Honeymoon' ? rawTravelers * 2 : rawTravelers;
    const totalBudget = parseFloat(form.budget) || 0;

    let localResults = [];
    if (form.useLocalRecommendations) {
      localResults = tripData
        .filter((trip) => {
          const perPerson = computeEstimatedTotalPerPerson(trip);
          const matchesMood = trip['Trip Type'] === form.mood;
          const matchesCountry = trip['Country'] === form.country;
          const matchesState = form.state ? trip['State'] === form.state : true;
          return (
            matchesMood &&
            matchesCountry &&
            matchesState &&
            perPerson * travelers <= totalBudget
          );
        })
        .map((trip) => {
          const perPerson = computeEstimatedTotalPerPerson(trip);
          return {
            ...trip,
            source: 'local',
            approxBaseCost: perPerson,
            breakdown: {
              hotelPerNight: +trip['Hotel (₹/night)'] || 0,
              foodPerDay: +trip['Food (₹/day)'] || 0,
              transport: +trip['Local Transport (₹)'] || 0,
              shopping: +trip['Shopping (₹)'] || 0,
              activities: 0,
              totalPerPerson: perPerson
            }
          };
        });
    }

    let apiResults = [];

    if (form.useAiPlaces) {
      try {
        const llmSuggestions = await generateWithGeminiViaBackend({
          mood: form.mood,
          country: form.country,
          state: form.state,
          budget: totalBudget,
          travelers,
          existing: []
        });

        apiResults = llmSuggestions.map((s) => ({
          destination: s.destination || s.DestinationName || s.name,
          summary: s.summary || s.reason || '',
          tags: s.tags || [],
          approxBaseCost: s.approxBaseCost || s.estimatedPerPerson || 0,
          breakdown: s.breakdown || null,
          source: 'api'
        }));

        if (form.useTrain && apiResults.length > 0) {
          setEnriching(true);
          try {
            const destinations = apiResults
              .map((x) => x.destination)
              .filter(Boolean);
            const pricingResp = await axios.post(
              'http://localhost:4000/api/live-pricing-batch',
              {
                destinations,
                travelers,
                includeTrain: true,
                country: form.country
              }
            );

            const meta = pricingResp.data && pricingResp.data.__meta;
            if (form.country === 'India' && meta && meta.trainRedirect) {
              toast.info(
                '🚆 Issue fetching live train details. Redirecting to IRCTC for best results.',
                { position: 'top-center', autoClose: 5000 }
              );
              window.open(
                'https://www.irctc.co.in/nget/train-search',
                '_blank',
                'noopener'
              );
            }

            apiResults = apiResults.map((item) => {
              const extra = pricingResp.data?.[item.destination] || {};
              return {
                ...item,
                train: extra.train || null
              };
            });
          } catch (err) {
            console.warn('Train enrichment failed', err);
          }
          setEnriching(false);
        }
      } catch (err) {
        console.error('Gemini backend call failed:', err);
        toast.error('⚠️ AI suggestions failed. Showing local results only.', {
          position: 'top-center',
          autoClose: 5000
        });
      }
    }

    const mergedMap = new Map();
    const pushToMap = (arr) => {
      arr.forEach((item) => {
        const key = (
          item.destination ||
          item.DestinationName ||
          item['Destination Name'] ||
          ''
        )
          .toString()
          .toLowerCase()
          .trim();
        if (!key) return;
        if (!mergedMap.has(key)) mergedMap.set(key, item);
      });
    };

    pushToMap(apiResults || []);
    pushToMap(localResults || []);

    const finalSuggestions = Array.from(mergedMap.values());

    if (finalSuggestions.length === 0) {
      toast.error('🚫 No trips available within this budget or filters.', {
        position: 'top-center',
        autoClose: 5000
      });
    } else {
      toast.success(
        `🎉 ${finalSuggestions.length} suggestion(s) found. Scroll to see the cards.`,
        { position: 'top-center', autoClose: 5000 }
      );
    }

    setSuggestions(finalSuggestions);
    setVisibleCount(10);
    setLoading(false);
  };

  const handleShowMore = async () => {
    if (!form.useAiPlaces) {
      setVisibleCount((prev) => prev + 5);
      toast.info('🔁 Showing 5 more Results.....', {
        position: 'top-center',
        autoClose: 2000
      });
      return;
    }

    toast.info('✨ Fetching more unique places...', {
      position: 'top-center',
      autoClose: 2000
    });

    const existingKeys = suggestions
      .map((s) =>
        (
          s.destination ||
          s.DestinationName ||
          s['Destination Name'] ||
          ''
        )
          .toString()
          .toLowerCase()
          .trim()
      )
      .filter(Boolean);

    try {
      const more = await generateWithGeminiViaBackend({
        mood: form.mood,
        country: form.country,
        state: form.state,
        budget: form.budget,
        travelers: effectiveTravelers,
        existing: existingKeys
      });

      const newItems = (more || []).map((s) => ({
        destination: s.destination || s.DestinationName || s.name,
        summary: s.summary || s.reason || '',
        tags: s.tags || [],
        approxBaseCost: s.approxBaseCost || s.estimatedPerPerson || 0,
        breakdown: s.breakdown || null,
        source: 'api'
      }));

      const map = new Map();
      [...suggestions, ...newItems].forEach((item) => {
        const key = (
          item.destination ||
          item.DestinationName ||
          item['Destination Name'] ||
          ''
        )
          .toString()
          .toLowerCase()
          .trim();
        if (!key) return;
        if (!map.has(key)) map.set(key, item);
      });

      const merged = Array.from(map.values());

      setSuggestions(merged);
      setVisibleCount((prev) => prev + 5);

      if (newItems.length === 0) {
        toast.warning('😅 No more unique destinations found right now.', {
          position: 'top-center',
          autoClose: 3000
        });
      } else {
        toast.success(`🎉 Added ${newItems.length} more result(s)!`, {
          position: 'top-center',
          autoClose: 2000
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('⚠️ Failed fetching extra results.', {
        position: 'top-center',
        autoClose: 3000
      });
    }
  };

  const rawTravelers = parseInt(form.travelers, 10) || 1;
  const effectiveTravelers =
    form.mood === 'Honeymoon' ? rawTravelers * 2 : rawTravelers;

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const extractCityState = (trip) => {
    const dest =
      trip.destination ||
      trip.DestinationName ||
      trip['Destination Name'] ||
      '';
    if (!dest) return { city: '', state: '' };
    const parts = dest.split(',');
    const city = parts[0].trim();
    const state =
      (parts[1] && parts[1].trim()) || trip.State || form.state || '';
    return { city, state };
  };

  const googleMapsUrl = (trip) => {
    const dest =
      trip.destination ||
      trip.DestinationName ||
      trip['Destination Name'] ||
      '';
    const q = dest || `${form.state || ''} ${form.country || ''}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      q
    )}`;
  };

  return (
    <div className="ai-trip-container">
      <h1>🧠 AI Mood-Based Trip Suggestions</h1>

      <form className="trip-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Trip Mood:</label>
          <select
            name="mood"
            value={form.mood}
            onChange={handleChange}
            required
          >
            <option value="">-- Select --</option>
            <option value="Honeymoon">💞 Honeymoon</option>
            <option value="Vacation">🏖️ Vacation</option>
            <option value="Solo">🧍 Solo</option>
            <option value="Adventure">🧗 Adventure</option>
            <option value="Family">👨‍👩‍👧‍👦 Family</option>
            <option value="Spiritual">🛕 Spiritual</option>
          </select>
        </div>

        <div className="form-group">
          <label>Select Country:</label>

          

          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Country --</option>
            {filteredCountries.map((c, i) => (
              <option key={i} value={c}>
                {getFlag(c)} {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>State / Region (optional):</label>
          {statesForCountry.length > 0 ? (
            <select name="state" value={form.state} onChange={handleChange}>
              <option value="">-- Any State --</option>
              {statesForCountry.map((s, i) => (
                <option key={i} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="Enter state / region (optional)"
            />
          )}
        </div>

        <div className="form-group">
          <label>Total Budget (₹):</label>
          <input
            type="number"
            name="budget"
            value={form.budget}
            onChange={handleChange}
            min="5000"
            required
          />
        </div>

        <div className="form-group">
          <label>
            {form.mood === 'Honeymoon'
              ? 'Number of Couples:'
              : 'Number of Travelers:'}
          </label>
          <input
            type="number"
            name="travelers"
            value={form.travelers}
            onChange={handleChange}
            min="1"
            required
          />
          <small>
            👥 Effective travelers: <strong>{effectiveTravelers}</strong>
          </small>
        </div>

        <fieldset className="options-group">
          <legend>What do you want to include?</legend>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="useAiPlaces"
                checked={form.useAiPlaces}
                onChange={handleChange}
              />
              1️⃣ 🤖 AI Places Suggestions
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="useTrain"
                checked={form.useTrain}
                onChange={handleChange}
                disabled={!form.useAiPlaces}
              />
              2️⃣ 🚆 Train details (India only)
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="useLocalRecommendations"
                checked={form.useLocalRecommendations}
                onChange={handleChange}
              />
              3️⃣ 📚 Journey-Planner Recommendations
            </label>
          </div>
        </fieldset>

        <button type="submit" disabled={loading || enriching}>
          ✨ Suggest Places
        </button>
      </form>

      {loading && <p>⏳ Loading suggestions...</p>}
      {enriching && <p>🚆 Adding train details...</p>}

      {suggestions.length > 0 && (
        <div className="results">
          <h2>📌 Suggestions</h2>
          {suggestions.slice(0, visibleCount).map((trip, i) => {
            const countryForFlag = trip.Country || form.country || 'World';
            const flag = getFlag(countryForFlag);
            const { city, state } = extractCityState(trip);
            const bd = trip.breakdown || {};
            const perPerson = bd.totalPerPerson || trip.approxBaseCost || 0;
            const totalAll = perPerson * effectiveTravelers;

            const destKey = getDestKey(trip);
            const isSaved = !!savedMap[destKey];

            return (
              <div className="trip-card shareable-card" key={i}>
                <div className="trip-card-header">
                  <div className="trip-location-line">
                    <span className="trip-country">
                      {flag} {countryForFlag}
                    </span>
                  </div>
                  <span className="trip-card-source">
                    {trip.source === 'api' && 'AI Recommended'}
                    {trip.source === 'local' && 'Our Official Database'}
                  </span>
                </div>

                <p>
                  <strong>State:</strong>{' '}
                  {state || trip.State || 'Not specified'}
                </p>

                <p>
                  <strong>Destination:</strong>{' '}
                  <a
                    href={googleMapsUrl(trip)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {city ||
                      trip.destination ||
                      trip.DestinationName ||
                      trip['Destination Name']}
                    <span className="maps-link"> 🔗 (View on Google Maps)</span>
                  </a>
                </p>

                <p className="about-place">
                  <strong>About this place:</strong>{' '}
                  {trip.summary ||
                    trip.reason ||
                    'Beautiful destination with a mix of local culture and attractions.'}
                </p>

                <div className="cost-breakdown">
                  <p>
                    <strong>Cost breakdown (approx., per person):</strong>
                  </p>
                  <ul>
                    {bd.hotelPerNight ? (
                      <li>🏨 Hotel (per night): ₹{bd.hotelPerNight}</li>
                    ) : null}
                    {bd.foodPerDay ? (
                      <li>🍽️ Food (per day): ₹{bd.foodPerDay}</li>
                    ) : null}
                    {bd.transport ? (
                      <li>🚕 Transport (local): ₹{bd.transport}</li>
                    ) : null}
                    {bd.shopping ? (
                      <li>🛍️ Shopping: ₹{bd.shopping}</li>
                    ) : null}
                    {bd.activities ? (
                      <li>🎯 Activities: ₹{bd.activities}</li>
                    ) : null}
                    {!bd.hotelPerNight &&
                      !bd.foodPerDay &&
                      !bd.transport &&
                      !bd.shopping &&
                      !bd.activities && (
                        <li>ℹ️ Detailed breakdown not available, estimate only.</li>
                      )}
                  </ul>

                  <p className="per-person-total">
                    <strong>
                      💰 Approx. base cost per person: ₹{perPerson}
                    </strong>
                  </p>
                  <p className="total-all">
                    💸 Total approx for {effectiveTravelers} traveller
                    {effectiveTravelers > 1 ? 's' : ''}:{' '}
                    <strong>₹{totalAll}</strong>
                  </p>
                </div>

                {trip.train && form.country === 'India' && (
                  <p className="train-line">
                    <strong>🚆 Train (India, approx.):</strong>{' '}
                    ₹{trip.train.price} {trip.train.currency}{' '}
                    <span className="train-note">
                      (total for all travellers)
                    </span>
                  </p>
                )}

                {trip.tags && trip.tags.length > 0 && (
                  <p className="tags-line">
                    <strong>🏷️ Tags:</strong> {trip.tags.join(', ')}
                  </p>
                )}

                <div className="trip-card-footer">
                  <div className="trip-card-brand">
                    <span className="brand-logo">🧭 {BRAND_NAME}</span>
                    <span className="brand-email">{BRAND_EMAIL}</span>
                  </div>
                  <div className="trip-card-actions">
                    <button
                      type="button"
                      className="save-button"
                      onClick={() => toggleSaveCard(trip)}
                    >
                      {isSaved ? '★ Saved' : '☆ Save'}
                    </button>
                    <button
                      type="button"
                      className="share-button"
                      onClick={() =>
                        handleShareCard(trip, effectiveTravelers, form.budget)
                      }
                    >
                      📤 Share Card
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button onClick={handleShowMore}>
  🔁 Show more results
</button>

        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable={false}
      />
    </div>
  );
};

export default AiMoodTrips;
