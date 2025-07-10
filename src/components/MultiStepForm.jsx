// src/components/MultiStepForm.js
import React, { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { auth, db, storage } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';

const libraries = ['places'];
const center = { lat: 20.5937, lng: 78.9629 };

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    destination: '',
    category: '',
    startDate: new Date(),
    endDate: new Date(),
    location: null,
    image: null,
    notes: '',
    expenses: [],
    packingList: [],
    placesToVisit: [],
    contacts: [],
  });

  const [tempExpense, setTempExpense] = useState({ amount: '', desc: '' });
  const [tempPacking, setTempPacking] = useState('');
  const [tempPlace, setTempPlace] = useState('');
  const [tempContact, setTempContact] = useState({ name: '', phone: '' });

  const autocompleteRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your key
    libraries,
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      let imageUrl = '';
      if (formData.image) {
        const imgRef = ref(storage, `images/${user.uid}/${Date.now()}-${formData.image.name}`);
        await uploadBytes(imgRef, formData.image);
        imageUrl = await getDownloadURL(imgRef);
      }

      await addDoc(collection(db, 'users', user.uid, 'journeys'), {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        imageUrl,
        createdAt: new Date().toISOString(),
      });

      toast.success('Journey Added Successfully!');
      setStep(1);
      setFormData({
        destination: '',
        category: '',
        startDate: new Date(),
        endDate: new Date(),
        location: null,
        image: null,
        notes: '',
        expenses: [],
        packingList: [],
        placesToVisit: [],
        contacts: [],
      });
    } catch (err) {
      console.error(err);
      toast.error('Error adding journey');
    }
  };

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="form-container">
      <h2>Add New Journey</h2>

      {step === 1 && (
        <div>
          <label>Destination:</label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          />

          <label>Category:</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="">Select Category</option>
            <option value="🏢 Work">🏢 Work</option>
            <option value="🌴 Vacation">🌴 Vacation</option>
            <option value="👨‍👩‍👧‍👦 Family">👨‍👩‍👧‍👦 Family</option>
            <option value="🧗 Adventure">🧗 Adventure</option>
            <option value="🔖 Other">🔖 Other</option>
          </select>

          <label>Start Date:</label>
          <DatePicker
            selected={formData.startDate}
            onChange={(date) => setFormData({ ...formData, startDate: date })}
          />

          <label>End Date:</label>
          <DatePicker
            selected={formData.endDate}
            onChange={(date) => setFormData({ ...formData, endDate: date })}
          />

          <button className="button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label>Select Location:</label>
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={() => {
              const place = autocompleteRef.current.getPlace();
              if (place.geometry) {
                const location = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                };
                setFormData({ ...formData, location });
              }
            }}
          >
            <input type="text" placeholder="Search location" />
          </Autocomplete>

          <GoogleMap
            center={formData.location || center}
            zoom={5}
            mapContainerStyle={{ width: '100%', height: '300px' }}
          >
            {formData.location && <Marker position={formData.location} />}
          </GoogleMap>

          <button className="button" onClick={handleBack}>
            Back
          </button>
          <button className="button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <label>Upload Image:</label>
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
          <textarea
            rows="4"
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <button className="button" onClick={handleBack}>
            Back
          </button>
          <button className="button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          <label>Packing List:</label>
          <input
            value={tempPacking}
            onChange={(e) => setTempPacking(e.target.value)}
          />
          <button
            onClick={() => {
              setFormData({
                ...formData,
                packingList: [...formData.packingList, tempPacking],
              });
              setTempPacking('');
            }}
          >
            Add
          </button>

          <label>Places to Visit:</label>
          <input
            value={tempPlace}
            onChange={(e) => setTempPlace(e.target.value)}
          />
          <button
            onClick={() => {
              setFormData({
                ...formData,
                placesToVisit: [...formData.placesToVisit, tempPlace],
              });
              setTempPlace('');
            }}
          >
            Add
          </button>

          <button className="button" onClick={handleBack}>
            Back
          </button>
          <button className="button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 5 && (
        <div>
          <label>Expense:</label>
          <input
            type="number"
            placeholder="Amount"
            value={tempExpense.amount}
            onChange={(e) =>
              setTempExpense({ ...tempExpense, amount: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Description"
            value={tempExpense.desc}
            onChange={(e) =>
              setTempExpense({ ...tempExpense, desc: e.target.value })
            }
          />
          <button
            onClick={() => {
              setFormData({
                ...formData,
                expenses: [...formData.expenses, tempExpense],
              });
              setTempExpense({ amount: '', desc: '' });
            }}
          >
            Add
          </button>

          <label>Local Contact:</label>
          <input
            placeholder="Name"
            value={tempContact.name}
            onChange={(e) =>
              setTempContact({ ...tempContact, name: e.target.value })
            }
          />
          <input
            placeholder="Phone"
            value={tempContact.phone}
            onChange={(e) =>
              setTempContact({ ...tempContact, phone: e.target.value })
            }
          />
          <button
            onClick={() => {
              setFormData({
                ...formData,
                contacts: [...formData.contacts, tempContact],
              });
              setTempContact({ name: '', phone: '' });
            }}
          >
            Add
          </button>

          <button className="button" onClick={handleBack}>
            Back
          </button>
          <button className="button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiStepForm;
