import React from 'react';
import {
  FaEdit,
  FaCloudDownloadAlt,
  FaMapMarkerAlt,
  FaTrashAlt,
  FaShareAlt,
} from 'react-icons/fa';

const JourneyCard = ({
  trip,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onFetchWeather,
  weather,
  onDownloadPDF,
  onShare, // ✅ Added Share handler
}) => {
  return (
    <div className="journey-card" id={`journey-${trip.id}`}>
      <h3>{trip.destination}</h3>

      {isExpanded ? (
        <>
          <p><strong>Start:</strong> {trip.startDate}</p>
          <p><strong>End:</strong> {trip.endDate}</p>
          <p><strong>Transport:</strong> {trip.transport?.join(', ')}</p>
          <p><strong>Packing:</strong> {trip.packingList?.join(', ')}</p>
          <p><strong>Contacts:</strong></p>
          <ul>
            {trip.contacts?.map((c, i) => (
              <li key={i}>{c.name} - {c.number}</li>
            ))}
          </ul>
          <p><strong>Expenses:</strong></p>
          <ul>
            {trip.expenses?.map((e, i) => (
              <li key={i}>{e.desc}: ₹{e.amount}</li>
            ))}
          </ul>
          <p><strong>Notes:</strong> {trip.notes}</p>
          <p><strong>Weather:</strong> {weather?.main?.temp ?? 'N/A'} °C</p>
        </>
      ) : (
        <p style={{ fontStyle: 'italic', color: '#aaa' }}>
          Click below to view more details...
        </p>
      )}

      <div className="card-actions">
        <button onClick={() => onDelete(trip.id)} title="Delete">
          <FaTrashAlt /> Delete
        </button>
        <button onClick={() => onEdit(trip)} title="Edit">
          <FaEdit /> Edit
        </button>
        <button onClick={() => onToggle(trip.id)}>
          {isExpanded ? '⬆ Show Less' : '⬇ Show More'}
        </button>
        <button onClick={() => onFetchWeather(trip.destination)}>☁ Weather</button>
        <button
          onClick={() =>
            window.open(`https://www.google.com/maps/search/?api=1&query=${trip.destination}`)
          }
          title="View on Google Maps"
        >
          <FaMapMarkerAlt /> Map
        </button>
        <button onClick={() => onDownloadPDF(trip)} title="Download PDF">
          <FaCloudDownloadAlt /> PDF
        </button>
        <button onClick={() => onShare(trip)} title="Share">
          <FaShareAlt /> Share
        </button>
      </div>
    </div>
  );
};

export default JourneyCard;
