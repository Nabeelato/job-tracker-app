"use client";

import { useEffect, useState } from "react";
import type { CustomField, FieldType, CustomFieldValue } from "@/types";

interface CustomFieldsFormProps {
  values: CustomFieldValue;
  onChange: (values: CustomFieldValue) => void;
  className?: string;
}

export function CustomFieldsForm({ values, onChange, className = "" }: CustomFieldsFormProps) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const response = await fetch("/api/custom-fields?active=true");
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

  const handleFieldChange = (fieldKey: string, value: any) => {
    onChange({
      ...values,
      [fieldKey]: value,
    });
  };

  const renderField = (field: CustomField) => {
    const value = values[field.fieldKey] ?? field.defaultValue ?? "";

    switch (field.fieldType) {
      case "TEXT":
      case "EMAIL":
      case "PHONE":
      case "URL":
        return (
          <input
            type={field.fieldType.toLowerCase()}
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder={field.description || `Enter ${field.fieldLabel.toLowerCase()}`}
          />
        );

      case "NUMBER":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder={field.description || `Enter ${field.fieldLabel.toLowerCase()}`}
          />
        );

      case "DATE":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        );

      case "DATETIME":
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        );

      case "SELECT":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            required={field.isRequired}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {field.fieldLabel.toLowerCase()}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "BOOLEAN":
        return (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.fieldKey}
                value="true"
                checked={value === true || value === "true"}
                onChange={(e) => handleFieldChange(field.fieldKey, true)}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.fieldKey}
                value="false"
                checked={value === false || value === "false"}
                onChange={(e) => handleFieldChange(field.fieldKey, false)}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
            </label>
          </div>
        );

      case "TEXTAREA":
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            required={field.isRequired}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder={field.description || `Enter ${field.fieldLabel.toLowerCase()}`}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>Loading custom fields...</div>;
  }

  if (customFields.length === 0) {
    return null;
  }

  // Group by category
  const groupedFields: Record<string, CustomField[]> = {};
  customFields.forEach((field) => {
    const category = field.category || "Other";
    if (!groupedFields[category]) {
      groupedFields[category] = [];
    }
    groupedFields[category].push(field);
  });

  return (
    <div className={className}>
      {Object.entries(groupedFields).map(([category, fields]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.fieldLabel}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {field.description}
                  </p>
                )}
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to validate custom fields
export function validateCustomFields(
  values: CustomFieldValue,
  customFields: CustomField[]
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  customFields.forEach((field) => {
    if (field.isRequired && field.isActive) {
      const value = values[field.fieldKey];
      if (!value || (typeof value === "string" && !value.trim())) {
        errors[field.fieldKey] = `${field.fieldLabel} is required`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
