// Final Journey Planner Dashboard (Updated with Real-time Checklists, Strikethrough, Totals)
import React, { useEffect, useState, useContext } from 'react';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import {
  doc, setDoc, collection, getDocs, addDoc, deleteDoc
} from 'firebase/firestore';
import Avatar from 'react-avatar';
import {
  FaSignOutAlt, FaRedo, FaEdit,
  FaMapMarkerAlt
} from 'react-icons/fa';
import EditJourneyModal from './EditJourneyModal';
import '../css/dashboard.css';
import axios from 'axios';
import { UserContext } from '../context/UserContext'; // ✅ Using context now

const getWeatherEmoji = (condition) => {
  switch (condition.toLowerCase()) {
    case 'clear': return '☀️';
    case 'clouds': return '☁️';
    case 'rain': return '🌧️';
    case 'thunderstorm': return '⛈️';
    case 'snow': return '❄️';
    case 'mist': return '🌫️';
    default: return '🌤️';
  }
};

const Dashboard = () => {
  const { user } = useContext(UserContext); // ✅ Use context instead of auth.currentUser
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState([]);
  const [editingJourney, setEditingJourney] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [weather, setWeather] = useState({});
  const [newJourney, setNewJourney] = useState({
    destination: '',
    date: '',
    transportType: '',
    pnr: '',
    from: '',
    to: '',
    time: '',
    hasConnection: false,
    connections: [],
    packingItem: '',
    packingList: [],
    contacts: [],
    contactName: '',
    contactNumber: '',
    expenses: [],
    expenseDesc: '',
    expenseAmount: '',
    expenseCategory: '',
    notes: ''
  });
  const [packingChecks, setPackingChecks] = useState([]);

  useEffect(() => {
    if (user) fetchJourneys(); // ✅ Now based on context user
  }, [user]);

const handleShare = (trip) => {
    const shareText = `🌍 Trip to ${trip.destination}
🗓️ Date: ${trip.date}
🚗 Transport: ${trip.transportType}
📍 Route: ${trip.from} ➡ ${trip.to}
🧳 Packing: ${trip.packingList?.join(', ') || 'N/A'}
🧾 Expenses: ₹${trip.expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)}
📝 Notes: ${trip.notes || 'None'}
`;

    const shareUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination)}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Trip to ${trip.destination}`,
          text: shareText,
          url: shareUrl,
        })
        .then(() => {
          toast.success("✅ Shared successfully!");
        })
        .catch(() => {
          toast.error("❗ Sharing cancelled or failed.");
        });
    } else {
      navigator.clipboard
        .writeText(`${shareText}\n📍 Location: ${shareUrl}`)
        .then(() => {
          toast.success("📋 Trip details copied to clipboard!");
        });
    }
  };

  const fetchJourneys = async () => {
    const journeyRef = collection(db, 'users', user.uid, 'journeys');
    const snapshot = await getDocs(journeyRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setJourneys(data);
  };

  const handleLogout = async () => {
    await auth.signOut();
    toast.success('👋 Logged out');
    navigate('/');
  };

  const handleResetPassword = async () => {
    if (user?.email) {
      await sendPasswordResetEmail(auth, user.email);
      toast.success('📨 Reset link sent to your email');
    } else {
      toast.error('❗ No email found to reset');
    }
  };

  const handleAddPacking = () => {
    if (newJourney.packingItem.trim()) {
      setNewJourney({
        ...newJourney,
        packingList: [...newJourney.packingList, newJourney.packingItem],
        packingItem: ''
      });
      setPackingChecks([...packingChecks, false]);
    }
  };

  const handlePackingCheck = (index) => {
    const updated = [...packingChecks];
    updated[index] = !updated[index];
    setPackingChecks(updated);
  };

  const handleAddContact = () => {
    if (newJourney.contactName.trim() && newJourney.contactNumber.trim()) {
      setNewJourney({
        ...newJourney,
        contacts: [...newJourney.contacts, { name: newJourney.contactName, number: newJourney.contactNumber }],
        contactName: '',
        contactNumber: ''
      });
    }
  };

  const handleAddExpense = () => {
    if (newJourney.expenseDesc && newJourney.expenseAmount) {
      setNewJourney({
        ...newJourney,
        expenses: [...newJourney.expenses, { desc: newJourney.expenseDesc, amount: newJourney.expenseAmount, category: newJourney.expenseCategory }],
        expenseDesc: '',
        expenseAmount: '',
        expenseCategory: ''
      });
    }
  };

  const handleAddJourney = async () => {
    if (!newJourney.destination.trim()) {
      toast.error('❗ Destination is required');
      return;
    }

    const cleanedJourney = {
  ...newJourney,
  destination: newJourney.destination.trim(),
  category: newJourney.category?.trim() || '',
  notes: newJourney.notes.trim()
};


    try {
      const journeyRef = collection(db, 'users', user.uid, 'journeys');
      await addDoc(journeyRef, cleanedJourney);
      toast.success('🎒 Journey added!');
      setNewJourney({
        destination: '',
        date: '',
        transportType: '',
        pnr: '',
        from: '',
        to: '',
        time: '',
        hasConnection: false,
        connections: [],
        packingItem: '',
        packingList: [],
        contacts: [],
        contactName: '',
        contactNumber: '',
        expenses: [],
        expenseDesc: '',
        expenseAmount: '',
        expenseCategory: '',
        notes: ''
      });
      setPackingChecks([]);
      fetchJourneys();
    } catch (error) {
      toast.error('🚫 Failed to add journey');
    }
  };

  const fetchWeather = async (destination) => {
  const apiKey = '9e19066a8c257bf736914b652dc7638c'; // ✅ API key must be a string

  if (!destination || destination.length < 3) {
    toast.error('❗ Please enter a valid destination');
    return;
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${destination}&appid=${apiKey}&units=metric`
    );
    setWeather(prev => ({ ...prev, [destination]: response.data }));
  } catch (err) {
    if (err.response?.status === 404) {
      toast.error(`❌ Weather for "${destination}" not found`);
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      toast.error('🚫 API key issue — check if the key is valid and active');
    } else {
      toast.error('🌐 Failed to fetch weather');
    }
  }
};


  const handleDeleteJourney = async (id) => {
    await deleteDoc(doc(db, 'users', user.uid, 'journeys', id));
    toast.success('🗑 Journey deleted');
    fetchJourneys();
  };

  const toggleCard = (id) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <div className="dashboard-main">
      

      <div className="dashboard-content">
        <h2>✈️ Welcome, {user?.displayName || 'User'}!</h2>

        <div className="form-section">
          <h3>📝 Add New Journey</h3>
          <label style={{ color: 'white', fontSize: '16px' }}>Destination</label>
<input
  type="text"
  placeholder="Destination"
  value={newJourney.destination}
  onChange={(e) => setNewJourney({ ...newJourney, destination: e.target.value })}
/>

<label style={{ color: 'white', fontSize: '16px' }}>Category</label>
<select
  value={newJourney.category || ''}
  onChange={(e) => setNewJourney({ ...newJourney, category: e.target.value })}
  style={{ padding: '8px', borderRadius: '4px', fontSize: '16px', marginBottom: '10px' }}
>
  <option value="">Select Category</option>
  <option value="🏢 Work">🏢 Work</option>
  <option value="🌴 Vacation">🌴 Vacation</option>
  <option value="👨‍👩‍👧‍👦 Family">👨‍👩‍👧‍👦 Family</option>
  <option value="🧗 Adventure">🧗 Adventure</option>
  <option value="🔖 Other">🔖 Other</option>
</select>


          <h3>🗓️ Trip Dates</h3>
<label>📅 Trip Start Date:</label>
<input
  type="date"
  value={newJourney.startDate}
  onChange={(e) => setNewJourney({ ...newJourney, startDate: e.target.value })}
/>

<label>📆 Trip End Date:</label>
<input
  type="date"
  value={newJourney.endDate}
  onChange={(e) => setNewJourney({ ...newJourney, endDate: e.target.value })}
/>

<h3>🚗 Choose Your Transport</h3>
<select
  value={newJourney.transportType}
  onChange={(e) =>
    setNewJourney({ ...newJourney, transportType: e.target.value })
  }
>
  <option value="">🚦 Select Transport</option>
  <option value="train">🚆 Train</option>
  <option value="flight">✈️ Flight</option>
  <option value="bus">🚌 Bus</option>
  <option value="ship">🛳️ Ship</option>
  <option value="other">🔧 Other</option>
</select>


          {newJourney.transportType && (
            <>
              <input type="text" placeholder="PNR Number" value={newJourney.pnr} onChange={(e) => setNewJourney({ ...newJourney, pnr: e.target.value })} />
              <input type="text" placeholder="From" value={newJourney.from} onChange={(e) => setNewJourney({ ...newJourney, from: e.target.value })} />
              <input type="text" placeholder="To" value={newJourney.to} onChange={(e) => setNewJourney({ ...newJourney, to: e.target.value })} />
              <input type="text" placeholder="Time (e.g., 10:30 AM)" value={newJourney.time} onChange={(e) => setNewJourney({ ...newJourney, time: e.target.value })} />
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0', color: 'white', fontSize: '16px' }}>
  <input
    type="checkbox"
    checked={newJourney.hasConnection}
    onChange={(e) => setNewJourney({ ...newJourney, hasConnection: e.target.checked })}
    style={{ width: '16px', height: '16px' }}
  />
  Add Connecting Transport
</label>

              {newJourney.hasConnection && (
                <textarea placeholder="Connections (Train/Bus/Flight Details)" onChange={(e) => setNewJourney({ ...newJourney, connections: e.target.value.split(',') })}></textarea>
              )}
            </>
          )}

          <label>Add Packaging Item</label>
          <input type="text" value={newJourney.packingItem} onChange={(e) => setNewJourney({ ...newJourney, packingItem: e.target.value })} />
          <button style={{ backgroundColor: 'green', color: 'white' }} onClick={handleAddPacking}>Add</button>
          <div>
  {newJourney.packingList.map((item, i) => (
    <label
      key={i}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px',
        color: 'white',
        fontSize: '16px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        checked={packingChecks[i]}
        onChange={() => handlePackingCheck(i)}
        style={{ width: '16px', height: '16px' }}
      />
      <span style={{ textDecoration: packingChecks[i] ? 'line-through' : 'none' }}>
        {item}
      </span>
    </label>
  ))}
</div>


          <label>Add Local Contact</label>
          <input type="text" placeholder="Name" value={newJourney.contactName} onChange={(e) => setNewJourney({ ...newJourney, contactName: e.target.value })} />
          <input type="text" placeholder="Phone Number" value={newJourney.contactNumber} onChange={(e) => setNewJourney({ ...newJourney, contactNumber: e.target.value })} />
          <button style={{ backgroundColor: 'green', color: 'white' }} onClick={handleAddContact}>Add</button>
          <ul>
            {newJourney.contacts.map((c, i) => (
              <li key={i}>{c.name} - {c.number}</li>
            ))}
          </ul>

          <label>Add Expense</label>
          <input type="text" placeholder="Item" value={newJourney.expenseDesc} onChange={(e) => setNewJourney({ ...newJourney, expenseDesc: e.target.value })} />
          <input type="text" placeholder="Amount" value={newJourney.expenseAmount} onChange={(e) => setNewJourney({ ...newJourney, expenseAmount: e.target.value })} />
          <input type="text" placeholder="Category" value={newJourney.expenseCategory} onChange={(e) => setNewJourney({ ...newJourney, expenseCategory: e.target.value })} />
          <button style={{ backgroundColor: 'green', color: 'white' }} onClick={handleAddExpense}>Add</button>
          <ul>
            {newJourney.expenses.map((e, i) => (
              <li key={i}>{e.desc} (₹{e.amount}) - {e.category}</li>
            ))}
          </ul>

          <label style={{ color: 'white', fontSize: '16px' }}>Notes</label>
<textarea
  placeholder="Notes..."
  value={newJourney.notes}
  onChange={(e) => setNewJourney({ ...newJourney, notes: e.target.value })}
/>

          <button onClick={handleAddJourney}>➕ Add Journey</button>
        </div>

        <div className="journey-grid">
          {journeys.map((trip) => {
            const tempData = weather[trip.destination];
            const weatherEmoji = tempData?.weather?.[0]?.main ? getWeatherEmoji(tempData.weather[0].main) : '';
            const totalExpenses = trip.expenses?.reduce((sum, e) => {
              const amt = parseFloat(e.amount);
              return isNaN(amt) ? sum : sum + amt;
            }, 0);

            return (
              <div className="journey-card" key={trip.id} id={`journey-${trip.id}`}>
                <h3>{trip.destination}</h3>
                {expandedCardId === trip.id ? (
                  <>
                    <p><strong>Date:</strong> {trip.date}</p>
                    <p><strong>Category:</strong> {trip.category || 'N/A'}</p>

                    <p><strong>Transport:</strong> {trip.transportType}</p>
                    <p><strong>PNR:</strong> {trip.pnr}</p>
                    <p><strong>Route:</strong> {trip.from} ➡ {trip.to} at {trip.time}</p>
                    <p><strong>Connections:</strong> {trip.connections?.join(', ')}</p>
                    <p><strong>Packing List:</strong> {trip.packingList?.join(', ')}</p>
                    <p><strong>Contacts:</strong></p>
                    <ul>{trip.contacts?.map((c, i) => (<li key={i}>{c.name} - {c.number}</li>))}</ul>
                    <p><strong>Expenses:</strong></p>
                    <ul>{trip.expenses?.map((e, i) => (<li key={i}>{e.desc}: ₹{e.amount} ({e.category})</li>))}</ul>
                    <p><strong>Total Expense:</strong> ₹{totalExpenses}</p>
                    <p><strong>Notes:</strong> {trip.notes}</p>
                    <p><strong>Weather:</strong> {tempData?.main?.temp ? `${weatherEmoji} ${tempData.main.temp} °C (${tempData.weather[0].description})` : 'N/A'}</p>
                    <div style={{ marginTop: '10px' }}>
                      <iframe title="map" width="100%" height="200" frameBorder="0" style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(trip.destination)}`} allowFullScreen></iframe>
                    </div>
                  </>
                ) : (
                  <p style={{ fontStyle: 'italic', color: '#aaa' }}>Click below to view more details...</p>
                )}

                <div className="card-actions">
                  <button style={{ backgroundColor: 'red', color: 'white' }} onClick={() => handleDeleteJourney(trip.id)}>🗑 Delete</button>
                  <button onClick={() => setEditingJourney(trip)}><FaEdit /> Edit</button>
                  <button onClick={() => toggleCard(trip.id)}>{expandedCardId === trip.id ? '⬆ Show Less' : '⬇ Show More'}</button>
                  <button onClick={() => {
  fetchWeather(trip.destination);
  if (expandedCardId === trip.id) {
    // force re-render by toggling off and on
    setExpandedCardId(null);
    setTimeout(() => setExpandedCardId(trip.id), 0);
  }
}}>☁ Weather</button>
<button onClick={() => handleShare(trip)}>🔗 Share</button>

                  <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${trip.destination}`)}><FaMapMarkerAlt /> Map</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingJourney && (
        <EditJourneyModal
          isOpen={!!editingJourney}
          onRequestClose={() => {
            setEditingJourney(null);
            fetchJourneys();
          }}
          journey={editingJourney}
          userId={user.uid}
        />
      )}
    </div>
  );
};

export default Dashboard;