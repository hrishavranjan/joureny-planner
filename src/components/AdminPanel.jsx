import React, { useState, useEffect, useContext } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserContext } from '../context/UserContext';
import { toast } from 'react-toastify';
import '../css/AdminPanel.css';

const ADMIN_EMAIL = 'hrishavranjan2003@gmail.com';
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dq8z64kam';
const UPLOAD_PRESET = 'uploads';

const AdminPanel = () => {
  const { user } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    mediaFile: null,
    type: '',
  });
  const [editingPostId, setEditingPostId] = useState(null);
  const [oldMediaPreview, setOldMediaPreview] = useState('');

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'adminPosts'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    } catch (err) {
      toast.error('❌ Error loading posts');
    }
  };

  const uploadToCloudinary = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'journey_planner/admin_updates');
    const resourceType = type === 'audio' ? 'raw' : type;

    try {
      const res = await fetch(`${CLOUDINARY_URL}/${resourceType}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) return data.secure_url;
      throw new Error(data.error?.message || 'Upload failed');
    } catch (err) {
      toast.error('❌ Media upload failed');
      return '';
    }
  };

  const handleAddOrUpdatePost = async () => {
    try {
      let mediaUrl = '';
      let type = newPost.type;

      let oldPost = null;
      if (editingPostId) {
        const confirm = window.confirm('Are you sure you want to save the changes to this post?');
        if (!confirm) return;
        oldPost = posts.find(p => p.id === editingPostId);
      }

      if (newPost.mediaFile && newPost.type) {
        mediaUrl = await uploadToCloudinary(newPost.mediaFile, newPost.type);
      } else if (oldPost) {
        mediaUrl = oldPost.mediaUrl || '';
        type = oldPost.type || '';
      }

      if (editingPostId) {
        const postRef = doc(db, 'adminPosts', editingPostId);
        await updateDoc(postRef, {
          title: newPost.title,
          content: newPost.content,
          mediaUrl,
          type,
        });
        toast.success('✏️ Post updated');
        setEditingPostId(null);
        setOldMediaPreview('');
      } else {
        await addDoc(collection(db, 'adminPosts'), {
          title: newPost.title,
          content: newPost.content,
          mediaUrl,
          type,
          author: 'Hrishav (Admin)',
          timestamp: Timestamp.now(),
          likes: [],
          comments: [],
        });
        toast.success('✅ Post added');
      }

      setNewPost({ title: '', content: '', mediaFile: null, type: '' });
      fetchPosts();
    } catch (err) {
      toast.error('❌ Failed to post');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'adminPosts', id));
      toast.success('🗑 Post deleted');
      fetchPosts();
    } catch {
      toast.error('❌ Failed to delete');
    }
  };

  const handleEdit = (post) => {
    setNewPost({
      title: post.title,
      content: post.content,
      mediaFile: null,
      type: post.type,
    });
    setOldMediaPreview(post.mediaUrl || '');
    setEditingPostId(post.id);
    toast.info('✏️ Loaded post into editor for editing');
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setNewPost({ title: '', content: '', mediaFile: null, type: '' });
    setOldMediaPreview('');
  };

  const handleDeleteComment = async (postId, comment) => {
    try {
      const postRef = doc(db, 'adminPosts', postId);
      await updateDoc(postRef, {
        comments: arrayRemove(comment),
      });
      toast.success('🗑 Comment deleted');
      fetchPosts();
    } catch {
      toast.error('❌ Failed to delete comment');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return 'Time not available';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return !isAdmin ? (
    <p style={{ color: 'white' }}>🚫 You are not authorized to access the Admin Panel.</p>
  ) : (
    <div className="admin-panel">
      <h2>🛠 Admin Panel - Post Updates</h2>

      <input
        type="text"
        className="admin-input"
        placeholder="Post Title"
        value={newPost.title}
        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
      />

      <textarea
        className="admin-textarea"
        placeholder="Post content"
        value={newPost.content}
        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
      />

      <input
        type="file"
        className="admin-file"
        onChange={(e) => setNewPost({ ...newPost, mediaFile: e.target.files[0] })}
      />

      <select
        className="admin-select"
        value={newPost.type}
        onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
      >
        <option value="">Select Media Type</option>
        <option value="image">🖼️ Image</option>
        <option value="audio">🎧 Audio</option>
        <option value="video">📹 Video</option>
      </select>

      {editingPostId && oldMediaPreview && (
        <div style={{ marginTop: '10px' }}>
          <strong>🔁 Previous Media Preview:</strong>
          {newPost.type === 'image' && (
            <img src={oldMediaPreview} alt="preview" style={{ width: '150px', marginTop: '8px' }} />
          )}
          {newPost.type === 'audio' && (
            <audio controls src={oldMediaPreview} style={{ marginTop: '8px' }} />
          )}
          {newPost.type === 'video' && (
            <video controls src={oldMediaPreview} style={{ width: '200px', marginTop: '8px' }} />
          )}
        </div>
      )}

      <div style={{ marginTop: '12px' }}>
        <button
          className="admin-button"
          style={editingPostId ? { backgroundColor: 'gold', color: 'black' } : {}}
          onClick={handleAddOrUpdatePost}
        >
          {editingPostId ? '💾 Save Changes' : '➕ Add Post'}
        </button>

        {editingPostId && (
          <button
            onClick={handleCancelEdit}
            style={{
              marginLeft: '10px',
              backgroundColor: '#ccc',
              color: 'black',
              padding: '6px 10px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ❌ Cancel
          </button>
        )}
      </div>

      <hr className="admin-divider" />

      <div className="admin-post-list">
        <h3>📋 Existing Posts</h3>
        {posts.length === 0 ? (
          <p>No posts yet...</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              <p>
                👤 {post.author} | 🕒 {formatTimestamp(post.timestamp)}
              </p>

              {post.mediaUrl && post.type === 'image' && (
                <img className="post-media" src={post.mediaUrl} alt="uploaded" />
              )}
              {post.mediaUrl && post.type === 'audio' && (
                <audio controls src={post.mediaUrl} />
              )}
              {post.mediaUrl && post.type === 'video' && (
                <video controls src={post.mediaUrl} />
              )}

              <div style={{ marginTop: '12px' }}>
                <button className="delete-button" onClick={() => handleDelete(post.id)}>
                  🗑 Delete
                </button>{' '}
                <button className="admin-button" onClick={() => handleEdit(post)}>
                  ✏️ Edit
                </button>
              </div>

              {post.likes?.length > 0 && (
                <p style={{ marginTop: '8px', color: '#0f0' }}>
                  ❤️ Liked by: {post.likes.join(', ')}
                </p>
              )}

              {post.comments?.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>💬 Comments:</strong>
                  <ul style={{ paddingLeft: '20px' }}>
                    {post.comments.map((c, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#0af' }}>{c.user}:</span> {c.text}
                        <button
                          onClick={() => handleDeleteComment(post.id, c)}
                          style={{
                            marginLeft: '10px',
                            backgroundColor: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
