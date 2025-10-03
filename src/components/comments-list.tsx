"use client";

import { MessageSquare, AtSign } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  mentions?: string[];
}

interface CommentsListProps {
  comments: Comment[];
  currentUserId?: string;
}

export default function CommentsList({ comments, currentUserId }: CommentsListProps) {
  const renderCommentContent = (content: string, mentions: string[] = []) => {
    // Regex to match @[Name](userId) format
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Check if this mention is for current user
      const isCurrentUser = match[2] === currentUserId;

      // Add mention with highlighting
      parts.push(
        <span
          key={`mention-${match.index}`}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
            isCurrentUser
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
          title={isCurrentUser ? "You were mentioned" : undefined}
        >
          <AtSign className="w-3 h-3" />
          {match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>
      );
    }

    return <div className="whitespace-pre-wrap break-words">{parts}</div>;
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No comments yet</p>
        <p className="text-sm mt-1">Be the first to comment on this job</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isCurrentUserMentioned = comment.mentions?.includes(currentUserId || "");

        return (
          <div
            key={comment.id}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 border transition-all ${
              isCurrentUserMentioned
                ? "border-blue-500 dark:border-blue-500/50 shadow-lg"
                : "border-gray-200 dark:border-gray-700 shadow-sm"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {comment.user.name.charAt(0).toUpperCase()}
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {comment.user.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {comment.user.role}
                    </span>
                    {isCurrentUserMentioned && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <AtSign className="w-3 h-3" />
                        You were mentioned
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(new Date(comment.createdAt))}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-sm text-gray-700 dark:text-gray-300 pl-13">
              {renderCommentContent(comment.content, comment.mentions)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
