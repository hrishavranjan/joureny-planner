import React, { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import Avatar from 'react-avatar';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import '../css/Profile.css';

const Profile = () => {
  const { user } = useContext(UserContext);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName || '');

  if (!user) {
    return <div className="profile-container"><p>🔄 Loading profile...</p></div>;
  }

  const handleEditName = () => {
    setEditing(true);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      toast.error('⚠️ Name cannot be empty');
      return;
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: nameInput.trim(),
      });
      toast.success('✅ Name updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error('❌ Failed to update name');
    }
  };

  return (
    <div className="profile-container">
      <h2>👤 User Profile</h2>
      <div className="profile-card">
        <Avatar name={user.displayName || 'User'} round size="80" />
        <div className="profile-info">
          <p>
            <strong>Name:</strong>{' '}
            {editing ? (
              <>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    marginRight: '5px',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  style={{
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                {user.displayName || 'N/A'}{' '}
                <button
                  onClick={handleEditName}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  title="Edit Name"
                >
                  ✏️
                </button>
              </>
            )}
          </p>

          <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          <p><strong>UID:</strong> {user.uid || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
