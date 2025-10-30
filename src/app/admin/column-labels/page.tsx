"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Save,
  X,
  Loader2,
  Tag,
  RotateCcw,
  Edit2,
  Check,
} from "lucide-react";
import type { ColumnLabel, CustomField } from "@/types";

// Default labels for standard columns
const DEFAULT_COLUMN_LABELS: Record<string, string> = {
  jobId: "Job ID",
  title: "Title",
  clientName: "Client Name",
  status: "Status",
  priority: "Priority",
  startedAt: "Start Date",
  dueDate: "Due Date",
  completedAt: "Completed Date",
  createdAt: "Created Date",
  assignedTo: "Assigned To",
  manager: "Manager",
  supervisor: "Supervisor",
  department: "Department",
  description: "Description",
  serviceTypes: "Service Types",
  progress: "Progress",
  tags: "Tags",
};

interface ColumnItem {
  key: string;
  defaultLabel: string;
  customLabel?: string;
  isCustomField: boolean;
}

export default function ColumnLabelsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [columnLabels, setColumnLabels] = useState<ColumnLabel[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (session?.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      const [labelsRes, fieldsRes] = await Promise.all([
        fetch("/api/column-labels"),
        fetch("/api/custom-fields?active=true"),
      ]);

      if (labelsRes.ok) {
        const labels = await labelsRes.json();
        setColumnLabels(labels);
      }

      if (fieldsRes.ok) {
        const fields = await fieldsRes.json();
        setCustomFields(fields);
      }

      // Build combined columns list
      const standardColumns: ColumnItem[] = Object.entries(DEFAULT_COLUMN_LABELS).map(
        ([key, label]) => ({
          key,
          defaultLabel: label,
          customLabel: undefined,
          isCustomField: false,
        })
      );

      if (fieldsRes.ok) {
        const fields = await fieldsRes.json();
        const customFieldColumns: ColumnItem[] = fields.map((field: CustomField) => ({
          key: field.fieldKey,
          defaultLabel: field.fieldLabel,
          customLabel: undefined,
          isCustomField: true,
        }));
        
        const allColumns = [...standardColumns, ...customFieldColumns];
        
        // Apply custom labels
        if (labelsRes.ok) {
          const labels = await labelsRes.json();
          const labelMap = new Map(labels.map((l: ColumnLabel) => [l.columnKey, l.customLabel]));
          
          allColumns.forEach((col) => {
            const customLabel = labelMap.get(col.key);
            if (customLabel && typeof customLabel === 'string') {
              col.customLabel = customLabel;
            }
          });
        }
        
        setColumns(allColumns);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (columnKey: string, currentLabel: string) => {
    setEditingKey(columnKey);
    setEditValue(currentLabel);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveLabel = async (columnKey: string) => {
    if (!editValue.trim()) {
      alert("Label cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/column-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnKey,
          customLabel: editValue.trim(),
        }),
      });

      if (response.ok) {
        await fetchData();
        setEditingKey(null);
        setEditValue("");
      } else {
        alert("Failed to save column label");
      }
    } catch (error) {
      console.error("Error saving label:", error);
      alert("Failed to save column label");
    } finally {
      setSaving(false);
    }
  };

  const resetLabel = async (columnKey: string) => {
    if (!confirm("Reset this column to its default label?")) {
      return;
    }

    try {
      const response = await fetch(`/api/column-labels?columnKey=${columnKey}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert("Failed to reset column label");
      }
    } catch (error) {
      console.error("Error resetting label:", error);
      alert("Failed to reset column label");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const standardColumns = columns.filter((c) => !c.isCustomField);
  const customFieldColumns = columns.filter((c) => c.isCustomField);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Column Labels
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Customize column names displayed in job lists
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Standard Columns */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Standard Columns
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Column Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Default Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Custom Label
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {standardColumns.map((column) => (
                  <tr key={column.key} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                      {column.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {column.defaultLabel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingKey === column.key ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && saveLabel(column.key)}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveLabel(column.key)}
                            disabled={saving}
                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`font-medium ${column.customLabel ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                          {column.customLabel || column.defaultLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {editingKey !== column.key && (
                          <>
                            <button
                              onClick={() => startEdit(column.key, column.customLabel || column.defaultLabel)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {column.customLabel && (
                              <button
                                onClick={() => resetLabel(column.key)}
                                className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Reset to default"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Field Columns */}
        {customFieldColumns.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Custom Field Columns
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Field Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Default Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Custom Label
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {customFieldColumns.map((column) => (
                    <tr key={column.key} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {column.key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {column.defaultLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingKey === column.key ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && saveLabel(column.key)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => saveLabel(column.key)}
                              disabled={saving}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`font-medium ${column.customLabel ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                            {column.customLabel || column.defaultLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {editingKey !== column.key && (
                            <>
                              <button
                                onClick={() => startEdit(column.key, column.customLabel || column.defaultLabel)}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {column.customLabel && (
                                <button
                                  onClick={() => resetLabel(column.key)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  title="Reset to default"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                About Column Labels
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Customize how column names appear in your job lists. Changes apply across all views (table, grid, monthly).
                Custom labels are displayed with blue text. Click the reset icon to revert to the default label.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
