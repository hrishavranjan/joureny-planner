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

const INITIAL_COMMENTS_PAGE_SIZE = 3;

const AdminFeed = () => {
  const [posts, setPosts] = useState([]);
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});
  const [visibleCommentsCount, setVisibleCommentsCount] = useState({});
  const [likeAnimation, setLikeAnimation] = useState({});
  const [loading, setLoading] = useState(true);

  const { user } = useContext(UserContext);
  const userName = user?.displayName || user?.email || 'Guest';
  const userId = user?.uid || user?.email || null;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'adminPosts'));
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const sorted = data.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(0);
        const bTime = b.timestamp?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      setPosts(sorted);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 LIKE TOGGLE LOGIC (like / dislike)
  const handleLike = async (postId, currentLikes = []) => {
    if (!userId) {
      alert('Please log in to like this post.');
      return;
    }

    const postRef = doc(db, 'adminPosts', postId);
    const hasLiked = currentLikes.includes(userId);

    // If user already liked → remove their like; else → add like
    await updateDoc(postRef, {
      likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    });

    // Play heart animation only when adding like
    if (!hasLiked) {
      setLikeAnimation((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setLikeAnimation((prev) => ({ ...prev, [postId]: false }));
      }, 450);
    }

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

  const formatDate = (isoOrDate) => {
    const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const toggleComments = (postId, totalComments) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    setVisibleCommentsCount((prev) => {
      if (prev[postId]) return prev;
      const initialCount = Math.min(INITIAL_COMMENTS_PAGE_SIZE, totalComments);
      return { ...prev, [postId]: initialCount };
    });
  };

  const handleShowMoreComments = (postId, totalComments) => {
    setVisibleCommentsCount((prev) => {
      const current = prev[postId] || INITIAL_COMMENTS_PAGE_SIZE;
      const next = Math.min(current + INITIAL_COMMENTS_PAGE_SIZE, totalComments);
      return { ...prev, [postId]: next };
    });
  };

  const handleShowLessComments = (postId) => {
    setVisibleCommentsCount((prev) => ({
      ...prev,
      [postId]: INITIAL_COMMENTS_PAGE_SIZE,
    }));
  };

  return (
    <div className="admin-feed-container">
      <h2>Admin Updates</h2>

      {loading ? (
        <div className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="post-card skeleton-card">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-text" />
              <div className="skeleton-line skeleton-text short" />
              <div className="skeleton-line skeleton-media" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p>No updates yet...</p>
      ) : (
        posts.map((post) => {
          const allComments = post.comments || [];
          const isExpanded = showComments[post.id];
          const currentLikes = post.likes || [];
          const hasLiked = userId ? currentLikes.includes(userId) : false;

          const visibleCount =
            visibleCommentsCount[post.id] ||
            Math.min(INITIAL_COMMENTS_PAGE_SIZE, allComments.length);

          const commentsToShow = allComments.slice(0, visibleCount);
          const hasMoreComments = visibleCount < allComments.length;
          const canShowLess =
            allComments.length > INITIAL_COMMENTS_PAGE_SIZE &&
            visibleCount === allComments.length;

          return (
            <div key={post.id} className="post-card">
              <h3>{post.title}</h3>
              <p>{post.content}</p>

              <small>
                {post.timestamp?.toDate
                  ? formatDate(post.timestamp.toDate())
                  : ''}
              </small>

              <p>{post.author}</p>

              {post.mediaUrl && post.type === 'image' && (
                <img src={post.mediaUrl} alt="Post" />
              )}
              {post.mediaUrl && post.type === 'audio' && (
                <audio controls src={post.mediaUrl} />
              )}
              {post.mediaUrl && post.type === 'video' && (
                <video controls src={post.mediaUrl} />
              )}

              <div className="buttons-row">
                <button
                  onClick={() => handleLike(post.id, currentLikes)}
                  disabled={!userId}
                  className={
                    'like-btn ' +
                    (!userId ? 'btn-disabled ' : '') +
                    (likeAnimation[post.id] ? 'heart-pop' : '')
                  }
                >
                  <span className="heart-icon">
                    {hasLiked ? '❤️' : '🤍'}
                  </span>
                  <span className="like-count">{currentLikes.length}</span>
                </button>

                <button
                  onClick={() => toggleComments(post.id, allComments.length)}
                  className={
                    'comment-toggle-btn ' + (isExpanded ? 'active' : '')
                  }
                >
                  <span className="comment-icon">💬</span>
                  <span>{allComments.length}</span>
                </button>
              </div>

              <div
                className={
                  'comments-wrapper ' + (isExpanded ? 'open' : 'closed')
                }
              >
                <div className="comment-input-row">
                  <input
                    type="text"
                    value={commentInput[post.id] || ''}
                    onChange={(e) =>
                      setCommentInput({
                        ...commentInput,
                        [post.id]: e.target.value,
                      })
                    }
                    placeholder="Add comment..."
                  />

                  <button
                    type="button"
                    className="send-comment-btn"
                    onClick={() => handleComment(post.id)}
                  >
                    📨
                  </button>
                </div>

                <div className="comments-list">
                  {commentsToShow.map((c, i) => (
                    <div key={i} className="comment-item">
                      <div className="comment-content">
                        <strong>{c.user}</strong>: {c.text}
                        <div className="comment-time">
                          {formatDate(c.timestamp)}
                        </div>
                      </div>

                      {c.user === userName && (
                        <button
                          className="delete-comment-btn"
                          onClick={() => handleDeleteComment(post.id, c)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {(hasMoreComments || canShowLess) && (
                  <div className="comments-pagination">
                    {hasMoreComments && (
                      <button
                        type="button"
                        className="comments-more-btn"
                        onClick={() =>
                          handleShowMoreComments(post.id, allComments.length)
                        }
                      >
                        Show more comments
                      </button>
                    )}
                    {canShowLess && (
                      <button
                        type="button"
                        className="comments-more-btn"
                        onClick={() => handleShowLessComments(post.id)}
                      >
                        Show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AdminFeed;
