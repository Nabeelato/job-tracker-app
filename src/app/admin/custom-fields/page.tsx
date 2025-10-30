"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Settings,
  Info,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import type { CustomField, FieldType } from "@/types";

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: "TEXT", label: "Text", icon: "📝" },
  { value: "NUMBER", label: "Number", icon: "🔢" },
  { value: "DATE", label: "Date", icon: "📅" },
  { value: "DATETIME", label: "Date & Time", icon: "🕐" },
  { value: "SELECT", label: "Dropdown", icon: "📋" },
  { value: "BOOLEAN", label: "Yes/No", icon: "☑️" },
  { value: "EMAIL", label: "Email", icon: "📧" },
  { value: "PHONE", label: "Phone", icon: "📞" },
  { value: "URL", label: "Website URL", icon: "🔗" },
  { value: "TEXTAREA", label: "Long Text", icon: "📄" },
];

export default function CustomFieldsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fieldKey, setFieldKey] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("TEXT");
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [defaultValue, setDefaultValue] = useState("");

  useEffect(() => {
    if (session?.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchCustomFields();
  }, [session, router]);

  const fetchCustomFields = async () => {
    try {
      const response = await fetch("/api/custom-fields");
      if (response.ok) {
        const data = await response.json();
        setCustomFields(data);
      }
    } catch (error) {
      console.error("Error fetching custom fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFieldKey("");
    setFieldLabel("");
    setFieldType("TEXT");
    setOptions([]);
    setOptionInput("");
    setIsRequired(false);
    setIsActive(true);
    setCategory("");
    setDescription("");
    setDefaultValue("");
    setEditingField(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (field: CustomField) => {
    setEditingField(field);
    setFieldKey(field.fieldKey);
    setFieldLabel(field.fieldLabel);
    setFieldType(field.fieldType);
    setOptions(field.options || []);
    setIsRequired(field.isRequired);
    setIsActive(field.isActive);
    setCategory(field.category || "");
    setDescription(field.description || "");
    setDefaultValue(field.defaultValue || "");
    setShowModal(true);
  };

  const handleAddOption = () => {
    if (optionInput.trim() && !options.includes(optionInput.trim())) {
      setOptions([...options, optionInput.trim()]);
      setOptionInput("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setOptions(options.filter((o) => o !== option));
  };

  const handleSave = async () => {
    if (!fieldLabel.trim()) {
      alert("Field label is required");
      return;
    }

    // Generate fieldKey from label if creating new field
    const key = editingField ? fieldKey : fieldLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!key) {
      alert("Invalid field label");
      return;
    }

    setSaving(true);
    try {
      const url = editingField
        ? `/api/custom-fields/${editingField.id}`
        : "/api/custom-fields";
      const method = editingField ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldKey: key,
          fieldLabel,
          fieldType,
          options,
          isRequired,
          isActive,
          category: category || undefined,
          description: description || undefined,
          defaultValue: defaultValue || undefined,
        }),
      });

      if (response.ok) {
        await fetchCustomFields();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save custom field");
      }
    } catch (error) {
      console.error("Error saving custom field:", error);
      alert("Failed to save custom field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom field? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-fields/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCustomFields();
      } else {
        alert("Failed to delete custom field");
      }
    } catch (error) {
      console.error("Error deleting custom field:", error);
      alert("Failed to delete custom field");
    }
  };

  const handleToggleActive = async (field: CustomField) => {
    try {
      const response = await fetch(`/api/custom-fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !field.isActive }),
      });

      if (response.ok) {
        await fetchCustomFields();
      }
    } catch (error) {
      console.error("Error toggling field status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Custom Fields
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add and manage custom fields for job tracking
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Custom Field
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {customFields.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Settings className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No custom fields yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first custom field to add dynamic columns to your job views
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Custom Field
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customFields.map((field) => (
              <div
                key={field.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-6 transition-all ${
                  field.isActive
                    ? "border-gray-200 dark:border-gray-700"
                    : "border-gray-300 dark:border-gray-600 opacity-60"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {FIELD_TYPES.find((t) => t.value === field.fieldType)?.icon || "📌"}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {field.fieldLabel}
                      </h3>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {field.fieldKey}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(field)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title={field.isActive ? "Deactivate" : "Activate"}
                  >
                    {field.isActive ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Type Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                    {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label || field.fieldType}
                  </span>
                  {field.isRequired && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                      Required
                    </span>
                  )}
                </div>

                {/* Description */}
                {field.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {field.description}
                  </p>
                )}

                {/* Options for SELECT type */}
                {field.fieldType === "SELECT" && field.options.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Options:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {field.options.slice(0, 3).map((opt) => (
                        <span
                          key={opt}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                        >
                          {opt}
                        </span>
                      ))}
                      {field.options.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          +{field.options.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Category */}
                {field.category && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Category: {field.category}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => openEditModal(field)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingField ? "Edit Custom Field" : "Create Custom Field"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Field Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g., Last Email Sent"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                  disabled={!!editingField}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                {editingField && (
                  <p className="text-xs text-gray-500 mt-1">Field type cannot be changed after creation</p>
                )}
              </div>

              {/* Options for SELECT type */}
              {fieldType === "SELECT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dropdown Options
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddOption()}
                      placeholder="Enter option and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddOption}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                      <span
                        key={opt}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                      >
                        {opt}
                        <button
                          onClick={() => handleRemoveOption(opt)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Communication, Financial, Timeline"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this field"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Default Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Value (Optional)
                </label>
                <input
                  type="text"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  placeholder="Default value for new jobs"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Required field
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Active (show in job forms and lists)
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !fieldLabel.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingField ? "Update" : "Create"} Field
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
