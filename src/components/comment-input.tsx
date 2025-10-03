"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, X, AtSign } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface CommentInputProps {
  jobId: string;
  onCommentAdded: () => void;
}

export default function CommentInput({ jobId, onCommentAdded }: CommentInputProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Fetch all users for mention autocomplete
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const curPos = e.target.selectionStart || 0;

    setComment(value);
    setCursorPosition(curPos);

    // Check if user is typing @ for mention
    const textBeforeCursor = value.substring(0, curPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Check if there's no space between @ and cursor
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionStartPos(lastAtIndex);
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (user: User) => {
    const beforeMention = comment.substring(0, mentionStartPos);
    const afterMention = comment.substring(cursorPosition);

    // Use format: @[Name](userId)
    const mentionText = `@[${user.name}](${user.id})`;
    const newComment = beforeMention + mentionText + " " + afterMention;

    setComment(newComment);
    setShowMentionDropdown(false);
    setMentionSearch("");

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch) ||
    user.email.toLowerCase().includes(mentionSearch) ||
    user.role.toLowerCase().includes(mentionSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      setComment("");
      onCommentAdded();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }

    // Close mention dropdown on Escape
    if (e.key === "Escape" && showMentionDropdown) {
      setShowMentionDropdown(false);
    }
  };

  // Render comment with mentions highlighted
  const renderCommentPreview = () => {
    if (!comment) return null;

    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(comment)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {comment.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add mention
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 rounded"
        >
          @{match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < comment.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{comment.substring(lastIndex)}</span>
      );
    }

    return (
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-2 border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          Preview:
        </div>
        {parts}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add a Comment
          </label>

          {/* Preview mentions */}
          {comment && renderCommentPreview()}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={comment}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type @ to mention someone... (Ctrl+Enter to send)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              disabled={submitting}
            />

            {/* Mention Dropdown */}
            {showMentionDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <AtSign className="w-3 h-3" />
                    Mention a user
                  </div>
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => insertMention(user)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.role} • {user.email}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100">
                        Click to mention
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Type <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded">@</span> to mention team members. They&apos;ll receive a notification.
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {comment.length > 0 && `${comment.length} characters`}
          </div>
          <button
            type="submit"
            disabled={!comment.trim() || submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Comment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
