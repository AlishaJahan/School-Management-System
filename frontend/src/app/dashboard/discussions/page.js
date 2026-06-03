"use client";

import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";

export default function DiscussionForum() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Topics catalog
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  // Active topic thread details
  const [activeThread, setActiveThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  // Topic Creator Modal states
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicClassGrade, setTopicClassGrade] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicSaving, setTopicSaving] = useState(false);

  // Dropdown list for classroom grades
  const classGradesList = [
    "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", 
    "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", 
    "Class 10-A", "Class 11-A", "Class 11-B", "Class 12-A", "Class 12-B"
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        fetchTopics(parsed);
      } catch (e) {
        console.error("Error parsed user:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTopics = async (userContext) => {
    setTopicsLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const user = userContext || currentUser;
    try {
      const res = await fetch("http://localhost:5000/api/discussions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
        // Auto select first topic if any
        if (data.length > 0 && !selectedTopicId) {
          setSelectedTopicId(data[0].id);
          fetchTopicThread(data[0].id);
        }
      } else {
        setError("Failed to fetch classroom discussion boards.");
      }
    } catch (err) {
      console.error(err);
      setError("Network issues fetching topics catalog.");
    } finally {
      setTopicsLoading(false);
      setLoading(false);
    }
  };

  const fetchTopicThread = async (topicId) => {
    if (!topicId) return;
    setThreadLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/discussions/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data);
      } else {
        setError("Failed to fetch discussion thread replies.");
      }
    } catch (err) {
      console.error(err);
      setError("Network issue retrieving forum messages.");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    fetchTopicThread(topicId);
  };

  // Submit new topic (Teachers & Admins only)
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicClassGrade) {
      setError("Topic title and target classroom are required.");
      return;
    }
    setTopicSaving(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: topicTitle,
          class_grade: topicClassGrade,
          description: topicDesc
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`Discussion topic "${topicTitle}" successfully published!`);
        setTopicModalOpen(false);
        setTopicTitle("");
        setTopicClassGrade("");
        setTopicDesc("");
        
        // Refresh topics list and select the new one
        fetchTopics();
        if (data.topic_id) {
          setSelectedTopicId(data.topic_id);
          fetchTopicThread(data.topic_id);
        }
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to publish discussion topic.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error publishing topic.");
    } finally {
      setTopicSaving(false);
    }
  };

  // Submit reply post
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedTopicId) return;
    setReplySaving(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/discussions/${selectedTopicId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyContent })
      });
      if (res.ok) {
        setReplyContent("");
        fetchTopicThread(selectedTopicId);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to publish response.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issue submitting reply.");
    } finally {
      setReplySaving(false);
    }
  };

  // Toggle upvote
  const handleToggleUpvote = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/discussions/posts/${postId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state upvotes seamlessly
        setActiveThread(prev => {
          if (!prev) return null;
          const updatedPosts = prev.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                has_upvoted: data.upvoted ? 1 : 0,
                upvote_count: data.upvote_count
              };
            }
            return post;
          });
          return { ...prev, posts: updatedPosts };
        });
      }
    } catch (err) {
      console.error("Error upvoting post:", err);
    }
  };

  // Delete Topic
  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm("Are you sure you want to permanently delete this discussion topic and all of its posts?")) return;
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/discussions/${topicId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess("Discussion topic deleted successfully.");
        setActiveThread(null);
        setSelectedTopicId(null);
        fetchTopics();
      } else {
        setError("Failed to delete discussion topic.");
      }
    } catch (err) {
      console.error(err);
      setError("Network issues deleting discussion board.");
    }
  };

  // Delete Post reply
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this reply post?")) return;
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/discussions/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTopicThread(selectedTopicId);
      } else {
        setError("Failed to delete post response.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection issues removing post.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-400 font-semibold text-sm">Synchronizing discussions workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-zinc-900/50 to-zinc-950/30 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Collab Space</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">Classroom Discussion Forum</h2>
          <p className="text-sm text-zinc-400">
            Ask questions, participate in topic discussions, and upvote helpful answers with classmates and faculty members.
          </p>
        </div>

        {/* Action Button for Teachers/Admins */}
        {(currentUser?.role === "teacher" || currentUser?.role === "admin") && (
          <button
            onClick={() => setTopicModalOpen(true)}
            className="glow-btn px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 font-bold"
          >
            ➕ New Discussion Topic
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Main Forum Workspace Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full items-start">
        
        {/* LEFT COLUMN: Topics Scopes Sidebar */}
        <div className="lg:col-span-2 flex flex-col gap-4 w-full">
          <div className="glass-card p-5 rounded-2xl border border-white/5 bg-zinc-900/5">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest pl-1">Discussion Rooms ({topics.length})</h3>
          </div>

          {topicsLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
            </div>
          ) : topics.length === 0 ? (
            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-xs text-zinc-500">
              No active discussion topics found.
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {topics.map((t) => {
                const isSelected = selectedTopicId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTopic(t.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group ${
                      isSelected 
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200" 
                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] text-zinc-300"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="text-xs font-bold leading-normal truncate max-w-[200px]">{t.title}</h4>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-indigo-400">
                        {t.class_grade}
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-[10px] text-zinc-500 line-clamp-1 pr-4 font-medium">
                        {t.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-zinc-600 font-semibold border-t border-white/5 pt-2 mt-1">
                      <span>Moderator: {t.teacher_name}</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Thread Discussion */}
        <div className="lg:col-span-3 flex flex-col gap-6 w-full min-h-[400px]">
          {threadLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            </div>
          ) : activeThread ? (
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
              
              {/* Topic header detail card */}
              <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-5">
                <div>
                  <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 uppercase tracking-widest">
                    {activeThread.topic.class_grade}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2 leading-tight">{activeThread.topic.title}</h3>
                  {activeThread.topic.description && (
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-semibold">
                      {activeThread.topic.description}
                    </p>
                  )}
                  <span className="text-[10px] text-zinc-500 block mt-2 font-semibold">
                    Topic Moderated by: <strong className="text-zinc-300">{activeThread.topic.teacher_name}</strong>
                  </span>
                </div>

                {/* Delete topic (Admins & Faculty creators) */}
                {((currentUser?.role === "teacher") || currentUser?.role === "admin") && (
                  <button
                    onClick={() => handleDeleteTopic(activeThread.topic.id)}
                    className="px-3 py-1.5 text-[10px] font-bold text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 rounded-lg transition-all cursor-pointer flex-shrink-0"
                  >
                    Delete Topic
                  </button>
                )}
              </div>

              {/* Discussion Posts list */}
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin mt-2">
                {activeThread.posts.length === 0 ? (
                  <div className="py-12 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-xs text-zinc-500">
                    No postings yet. Ask a question or submit a reply to start the conversation!
                  </div>
                ) : (
                  activeThread.posts.map((post) => {
                    const isFaculty = post.user_role === "teacher" || post.user_role === "admin";
                    return (
                      <div key={post.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2 relative group">
                        
                        {/* Post Header */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              isFaculty ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" : "bg-zinc-800 text-zinc-300 border border-white/5"
                            }`}>
                              {post.user_name.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white leading-none">{post.user_name}</span>
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                                  isFaculty ? "bg-indigo-400/10 border-indigo-400/20 text-indigo-400" : "bg-zinc-950 border-white/5 text-zinc-500"
                                }`}>
                                  {post.user_role}
                                </span>
                              </div>
                              <span className="text-[8px] text-zinc-500 mt-0.5 block font-mono">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Delete Post option */}
                          {(currentUser?.id === post.author_id || currentUser?.role === "admin" || currentUser?.role === "teacher") && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-zinc-600 hover:text-rose-400 font-bold text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Delete Post"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Content text */}
                        <p className="text-xs text-zinc-300 pl-8 leading-relaxed font-medium">
                          {post.content}
                        </p>

                        {/* Thumbs up vote */}
                        <div className="flex justify-start pl-8 mt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleUpvote(post.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                              post.has_upvoted === 1
                                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-inner"
                                : "bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-400 hover:bg-white/5"
                            }`}
                          >
                            <span>👍</span>
                            <span>{post.upvote_count} Upvote{post.upvote_count !== 1 && "s"}</span>
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply console (Textarea) */}
              {currentUser?.role !== "parent" ? (
                <form onSubmit={handleSendReply} className="flex flex-col gap-3 border-t border-white/5 pt-5 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-0.5">Post a reply / Answer</label>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your question or response here..."
                      rows="3"
                      className="glass-input px-4 py-3 text-xs font-medium text-white bg-zinc-950/60 border border-white/10 rounded-xl"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={replySaving || !replyContent.trim()}
                      className="glow-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      {replySaving ? "Posting..." : "Send Response"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold flex items-center gap-2 mt-4">
                  <span>ℹ️ Parents have read-only access to classroom discussion boards to track student updates.</span>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-3xl text-center text-zinc-500 gap-2 text-xs h-[300px]">
              <span>💬</span>
              <p>Choose an active classroom discussion board topic from the left sidebar panel to inspect replies.</p>
            </div>
          )}
        </div>

      </div>

      {/* New Topic Modal (Teacher/Admin only) */}
      <Modal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        title="Launch Discussion Topic"
      >
        <form onSubmit={handleCreateTopic} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Topic Title</label>
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="e.g. Doubts on SQL Subqueries, Homework 4 guidelines"
              className="glass-input px-4 py-3 text-sm font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Target Classroom Grade</label>
            <select
              value={topicClassGrade}
              onChange={(e) => setTopicClassGrade(e.target.value)}
              className="glass-input px-3 py-3 text-xs font-semibold text-white bg-zinc-950/60 border border-white/10 rounded-xl"
              required
            >
              <option value="" className="bg-zinc-950 text-zinc-500">Select Grade Room</option>
              {classGradesList.map((g) => (
                <option key={g} value={g} className="bg-zinc-950 text-white">{g}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Description / Context (Optional)</label>
            <textarea
              value={topicDesc}
              onChange={(e) => setTopicDesc(e.target.value)}
              placeholder="Add instructions, guiding questions, or context guidelines for this discussion board topic..."
              rows="3"
              className="glass-input px-4 py-3 text-xs font-medium text-white bg-zinc-950/60 border border-white/10 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={topicSaving}
            className="glow-btn py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer font-bold"
          >
            {topicSaving ? "Publishing Topic..." : "Publish Topic Board"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
