// src/components/EditJourneyModal.js
import React, { useState } from 'react';
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import '../css/EditJourneyModal.css'; // adjust path as needed


Modal.setAppElement('#root');

const EditJourneyModal = ({ isOpen, onRequestClose, journey, userId }) => {
  const [formData, setFormData] = useState({
    destination: journey.destination || '',
    category: journey.category || '',
    startDate: journey.startDate ? new Date(journey.startDate) : new Date(),
    endDate: journey.endDate ? new Date(journey.endDate) : new Date(),
    notes: journey.notes || '',
    expenses: journey.expenses || [],
    packingList: journey.packingList || [],
    placesToVisit: journey.placesToVisit || [],
    contacts: journey.contacts || [],
  });

  const [tempExpense, setTempExpense] = useState({ amount: '', desc: '' });
  const [tempPacking, setTempPacking] = useState('');
  const [tempPlace, setTempPlace] = useState('');
  const [tempContact, setTempContact] = useState({ name: '', phone: '' });

  const handleSubmit = async () => {
    try {
      const docRef = doc(db, 'users', userId, 'journeys', journey.id);
      await updateDoc(docRef, {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('✏️ Journey updated!');
      onRequestClose();
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to update journey');
    }
  };

  const removeItem = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Edit Journey"
      className="modal"
      overlayClassName="overlay"
    >
      <h2>✏️ Edit Journey</h2>

      <label>📍 Destination:</label>
      <input
        type="text"
        value={formData.destination}
        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
      />

      <label>🧭 Category:</label>
      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      >
        <option value="">Select</option>
        <option value="Work">Work</option>
        <option value="Vacation">Vacation</option>
        <option value="Family">Family</option>
        <option value="Adventure">Adventure</option>
      </select>

      <label>🗓️ Start Date:</label>
      <DatePicker
        selected={formData.startDate}
        onChange={(date) => setFormData({ ...formData, startDate: date })}
        dateFormat="yyyy-MM-dd"
      />

      <label>🗓️ End Date:</label>
      <DatePicker
        selected={formData.endDate}
        onChange={(date) => setFormData({ ...formData, endDate: date })}
        dateFormat="yyyy-MM-dd"
      />

      <label>📝 Notes:</label>
      <textarea
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <hr />
      <h4>🧾 Expenses</h4>
      {formData.expenses.map((e, i) => (
        <div key={i}>
          ₹{e.amount} - {e.desc}
          <button onClick={() => removeItem('expenses', i)}>❌</button>
        </div>
      ))}
      <input
        placeholder="Amount"
        type="number"
        value={tempExpense.amount}
        onChange={(e) => setTempExpense({ ...tempExpense, amount: e.target.value })}
      />
      <input
        placeholder="Description"
        value={tempExpense.desc}
        onChange={(e) => setTempExpense({ ...tempExpense, desc: e.target.value })}
      />
      <button
        onClick={() => {
          if (tempExpense.amount && tempExpense.desc) {
            setFormData({ ...formData, expenses: [...formData.expenses, tempExpense] });
            setTempExpense({ amount: '', desc: '' });
          }
        }}
      >➕</button>

      <hr />
      <h4>🎒 Packing List</h4>
      {formData.packingList.map((item, i) => (
        <div key={i}>
          {item}
          <button onClick={() => removeItem('packingList', i)}>❌</button>
        </div>
      ))}
      <input
        placeholder="Add item"
        value={tempPacking}
        onChange={(e) => setTempPacking(e.target.value)}
      />
      <button
        onClick={() => {
          if (tempPacking.trim()) {
            setFormData({ ...formData, packingList: [...formData.packingList, tempPacking] });
            setTempPacking('');
          }
        }}
      >➕</button>

      <hr />
      <h4>📍 Places to Visit</h4>
      {formData.placesToVisit.map((place, i) => (
        <div key={i}>
          {place}
          <button onClick={() => removeItem('placesToVisit', i)}>❌</button>
        </div>
      ))}
      <input
        placeholder="Add place"
        value={tempPlace}
        onChange={(e) => setTempPlace(e.target.value)}
      />
      <button
        onClick={() => {
          if (tempPlace.trim()) {
            setFormData({ ...formData, placesToVisit: [...formData.placesToVisit, tempPlace] });
            setTempPlace('');
          }
        }}
      >➕</button>

      <hr />
      <h4>📞 Contacts</h4>
      {formData.contacts.map((c, i) => (
        <div key={i}>
          {c.name} - {c.phone}
          <button onClick={() => removeItem('contacts', i)}>❌</button>
        </div>
      ))}
      <input
        placeholder="Name"
        value={tempContact.name}
        onChange={(e) => setTempContact({ ...tempContact, name: e.target.value })}
      />
      <input
        placeholder="Phone"
        value={tempContact.phone}
        onChange={(e) => setTempContact({ ...tempContact, phone: e.target.value })}
      />
      <button
        onClick={() => {
          if (tempContact.name && tempContact.phone) {
            setFormData({ ...formData, contacts: [...formData.contacts, tempContact] });
            setTempContact({ name: '', phone: '' });
          }
        }}
      >➕</button>

      <div style={{ marginTop: '1rem' }}>
        <button className="button" onClick={handleSubmit}>💾 Save</button>
        <button className="button" onClick={onRequestClose} style={{ marginLeft: '10px' }}>❌ Cancel</button>
      </div>
    </Modal>
  );
};

export default EditJourneyModal;
