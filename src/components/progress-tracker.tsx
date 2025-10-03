"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ProgressTrackerProps {
  jobId: string;
  currentProgress: number;
  onUpdate: (newProgress: number) => void;
  canUpdate: boolean;
}

export default function ProgressTracker({
  jobId,
  currentProgress,
  onUpdate,
  canUpdate,
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState(currentProgress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (progress === currentProgress) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      onUpdate(progress);
    } catch (err: any) {
      setError(err.message);
      setProgress(currentProgress); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = () => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-orange-500";
    if (progress < 75) return "bg-yellow-500";
    if (progress < 100) return "bg-blue-500";
    return "bg-green-500";
  };

  const milestones = [0, 25, 50, 75, 100];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Progress Tracker
        </h3>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentProgress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      {/* Milestone Markers */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-6">
        {milestones.map((milestone) => (
          <div key={milestone} className="flex flex-col items-center">
            <div
              className={`w-2 h-2 rounded-full mb-1 ${
                currentProgress >= milestone
                  ? "bg-blue-600 dark:bg-blue-400"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
            <span>{milestone}%</span>
          </div>
        ))}
      </div>

      {canUpdate && (
        <div>
          <div className="flex items-center gap-4 mb-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <button
              onClick={handleUpdate}
              disabled={loading || progress === currentProgress}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                `Update to ${progress}%`
              )}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Drag the slider to update job progress. Team members will be notified at milestones.
          </p>
        </div>
      )}

      {!canUpdate && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Only the assigned staff member can update progress
        </p>
      )}
    </div>
  );
}
