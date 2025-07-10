import React, { useState, useEffect, useContext } from 'react';
import '../css/AiMoodTrips.css';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GOOGLE_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // 🔑 Replace with your real key

const AiMoodTrips = () => {
  const { user } = useContext(UserContext);

  const [form, setForm] = useState({
    mood: '',
    country: '',
    budget: '',
    travelers: 1,
    useGoogle: false
  });

  const [tripData, setTripData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/ai_trip_dataset_final.json')
      .then(res => res.json())
      .then(data => {
        setTripData(data);
        const countryList = [...new Set(data.map(item => item.Country))];
        setCountries(countryList.sort());
      })
      .catch(err => console.error('❌ Error loading JSON:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const travelers = parseInt(form.travelers);
    const totalBudget = parseFloat(form.budget);
    const nights = 2, days = 2;

    let results = tripData.filter(trip => {
      const total =
        (+trip["Avg Flight Cost (₹)"] || 0) +
        (+trip["Hotel (₹/night)"] || 0) * nights +
        (+trip["Food (₹/day)"] || 0) * days +
        (+trip["Local Transport (₹)"] || 0) +
        (+trip["Shopping (₹)"] || 0);

      return (
        trip["Trip Type"] === form.mood &&
        trip["Country"] === form.country &&
        total * travelers <= totalBudget
      );
    }).map(trip => ({ ...trip, source: 'local' }));

    // ✅ Google Places API (admin or 10AM)
    if (form.useGoogle && (user?.email === 'admin@example.com' || new Date().getHours() === 10)) {
      try {
        const query = `${form.mood} tourist places in ${form.country}`;
        const res = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
          params: { query, key: GOOGLE_API_KEY }
        });

        const googleResults = res.data.results.map(place => ({
          DestinationName: place.name,
          Address: place.formatted_address,
          Rating: place.rating,
          PlaceId: place.place_id,
          source: 'google'
        }));

        results = [...results, ...googleResults];
      } catch (err) {
        console.error('❌ Google API Error:', err);
      }
    }

    if (results.length === 0) {
      toast.error('🚫 No trips available within this budget.', {
        position: 'top-center',
        autoClose: 6000
      });
    } else {
      toast.success(`🎉 ${results.length} trip(s) found!`, {
        position: 'top-center',
        autoClose: 6000
      });
    }

    setSuggestions(results);
    setVisibleCount(10);
    setLoading(false);
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <div className="ai-trip-container">
      <h1>🤖 AI Mood-Based Trip Suggestions</h1>

      <form className="trip-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Trip Mood:</label>
          <select name="mood" value={form.mood} onChange={handleChange} required>
            <option value="">-- Select --</option>
            <option value="Honeymoon">💞 Honeymoon</option>
            <option value="Vacation">🏖️ Vacation</option>
            <option value="Solo">🧍 Solo</option>
            <option value="Adventure">🎯 Adventure</option>
            <option value="Family">👨‍👩‍👧‍👦 Family</option>
            <option value="Spiritual">🛐 Spiritual</option>
          </select>
        </div>

        <div className="form-group">
          <label>Select Country:</label>
          <select name="country" value={form.country} onChange={handleChange} required>
            <option value="">-- Select Country --</option>
            {countries.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
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
          <label>Number of Travelers:</label>
          <input
            type="number"
            name="travelers"
            value={form.travelers}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="useGoogle"
              checked={form.useGoogle}
              onChange={handleChange}
            />
            Use Google Places (Admin / 10 AM Only)
          </label>
        </div>

        <button type="submit">✨ Suggest Places</button>
      </form>

      {loading && <p>🔄 Loading suggestions...</p>}

      {suggestions.length > 0 && (
        <div className="results">
          <h2>🔍 Suggestions</h2>
          {suggestions.slice(0, visibleCount).map((trip, i) => (
            <div className="trip-card" key={i}>
              <h3>{trip.DestinationName || trip["Destination Name"]}</h3>

              {trip.source === 'google' ? (
                <>
                  <p>📍 {trip.Address}</p>
                  <p>⭐ Rating: {trip.Rating || 'N/A'}</p>
                  <a href={`https://www.google.com/maps/place/?q=place_id:${trip.PlaceId}`} target="_blank" rel="noreferrer">
                    View on Google Maps
                  </a>
                </>
              ) : (
                <>
                  <p>🌍 Country: {trip.Country}</p>
                  <p>🏞️ State: {trip.State || 'N/A'}</p>
                  <p>✈️ Flight: ₹{trip["Avg Flight Cost (₹)"]}</p>
                  <p>🏨 Hotel (per night): ₹{trip["Hotel (₹/night)"]}</p>
                  <p>🍛 Food (per day): ₹{trip["Food (₹/day)"]}</p>
                  <p>🚗 Transport: ₹{trip["Local Transport (₹)"]}</p>
                  <p>🛍️ Shopping: ₹{trip["Shopping (₹)"]}</p>
                  <p>🎯 Activities: {trip["Activities Included"]}</p>
                </>
              )}
            </div>
          ))}

          {suggestions.length > visibleCount && (
            <button onClick={handleShowMore}>➕ Show More</button>
          )}
        </div>
      )}

      {/* Toast notification container */}
      <ToastContainer position="top-center" autoClose={6000} />
    </div>
  );
};

export default AiMoodTrips;
