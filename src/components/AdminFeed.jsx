import React, { useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import '../css/AdminFeed.css';
import { UserContext } from '../context/UserContext';

const AdminFeed = () => {
  const [posts, setPosts] = useState([]);
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});
  const { user } = useContext(UserContext);

  const userName = user?.displayName || user?.email || 'Guest';

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const snapshot = await getDocs(collection(db, 'adminPosts'));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const sorted = data.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(0);
      const bTime = b.timestamp?.toDate?.() || new Date(0);
      return bTime - aTime;
    });

    setPosts(sorted);
  };

  const handleLike = async (postId, currentLikes = []) => {
    if (currentLikes.includes(userName)) return;

    const postRef = doc(db, 'adminPosts', postId);
    await updateDoc(postRef, {
      likes: arrayUnion(userName),
    });
    fetchPosts();
  };

  const handleComment = async (postId) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    const newComment = {
      user: userName,
      text,
      timestamp: new Date().toISOString(),
    };

    const postRef = doc(db, 'adminPosts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });

    setCommentInput((prev) => ({ ...prev, [postId]: '' }));
    fetchPosts();
  };

  const handleDeleteComment = async (postId, comment) => {
    const postRef = doc(db, 'adminPosts', postId);
    await updateDoc(postRef, {
      comments: arrayRemove(comment),
    });
    fetchPosts();
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div className="admin-feed-container">
      <h2>Admin Updates</h2>
      {posts.length === 0 ? (
        <p>No updates yet...</p>
      ) : (
        posts.map((post) => {
          const allComments = post.comments || [];
          const isExpanded = showComments[post.id];

          return (
            <div key={post.id} className="post-card">
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <small>{formatDate(post.timestamp?.toDate?.())}</small>
              <p>{post.author}</p>

              {post.mediaUrl && post.type === 'image' && (
                <img src={post.mediaUrl} alt="Post" width="250" />
              )}
              {post.mediaUrl && post.type === 'audio' && (
                <audio controls src={post.mediaUrl} />
              )}
              {post.mediaUrl && post.type === 'video' && (
                <video controls width="300" src={post.mediaUrl} />
              )}

              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                <button onClick={() => handleLike(post.id, post.likes || [])}>
                  Like ({post.likes?.length || 0})
                </button>

                <button
                  onClick={() => toggleComments(post.id)}
                  style={{
                    backgroundColor: '#444',
                    color: 'white',
                    border: 'none',
                    marginLeft: '12px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  💬 {allComments.length}
                </button>
              </div>

              {isExpanded && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '12px',
                    }}
                  >
                    <input
                      type="text"
                      value={commentInput[post.id] || ''}
                      onChange={(e) =>
                        setCommentInput({ ...commentInput, [post.id]: e.target.value })
                      }
                      placeholder="Add comment..."
                      style={{
                        flex: 1,
                        marginRight: '10px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #666',
                        backgroundColor: '#222',
                        color: 'white',
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      style={{
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        fontSize: '20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '6px 12px',
                      }}
                    >
                      📨
                    </button>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    {allComments.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#1f1f1f',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          color: '#eee',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#0cf' }}>{c.user}</strong>: {c.text}
                          <div style={{ fontSize: '12px', color: '#aaa' }}>
                            {formatDate(c.timestamp)}
                          </div>
                        </div>
                        {c.user === userName && (
                          <button
                            style={{
                              marginLeft: '10px',
                              backgroundColor: 'red',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleDeleteComment(post.id, c)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default AdminFeed;
