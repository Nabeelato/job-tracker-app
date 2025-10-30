"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Calendar, Clock, Mail, Phone, Link as LinkIcon } from "lucide-react";
import type { CustomField, FieldType, CustomFieldValue, ColumnLabel } from "@/types";

interface CustomFieldsDisplayProps {
  values: CustomFieldValue | null | undefined;
  className?: string;
  compact?: boolean;
}

export function CustomFieldsDisplay({ values, className = "", compact = false }: CustomFieldsDisplayProps) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [columnLabels, setColumnLabels] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fieldsRes, labelsRes] = await Promise.all([
        fetch("/api/custom-fields?active=true"),
        fetch("/api/column-labels"),
      ]);

      if (fieldsRes.ok) {
        const fields = await fieldsRes.json();
        setCustomFields(fields);
      }

      if (labelsRes.ok) {
        const labels: ColumnLabel[] = await labelsRes.json();
        const labelMap = new Map(labels.map((l) => [l.columnKey, l.customLabel]));
        setColumnLabels(labelMap);
      }
    } catch (error) {
      console.error("Error fetching custom fields data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (field: CustomField, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-gray-400 dark:text-gray-600 italic">Not set</span>;
    }

    switch (field.fieldType) {
      case "DATE":
        try {
          const date = new Date(value);
          return (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date.toLocaleDateString()}
            </span>
          );
        } catch {
          return value;
        }

      case "DATETIME":
        try {
          const datetime = new Date(value);
          return (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {datetime.toLocaleString()}
            </span>
          );
        } catch {
          return value;
        }

      case "BOOLEAN":
        return value === true || value === "true" ? (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Yes
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <XCircle className="w-3 h-3" />
            No
          </span>
        );

      case "EMAIL":
        return (
          <a
            href={`mailto:${value}`}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-3 h-3" />
            {value}
          </a>
        );

      case "PHONE":
        return (
          <a
            href={`tel:${value}`}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3 h-3" />
            {value}
          </a>
        );

      case "URL":
        return (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="w-3 h-3" />
            {value}
          </a>
        );

      case "NUMBER":
        return <span className="font-mono">{value}</span>;

      case "TEXTAREA":
        return compact ? (
          <span className="line-clamp-2">{value}</span>
        ) : (
          <span className="whitespace-pre-wrap">{value}</span>
        );

      default:
        return <span>{value}</span>;
    }
  };

  const getFieldLabel = (field: CustomField): string => {
    return columnLabels.get(field.fieldKey) || field.fieldLabel;
  };

  if (loading || !values) {
    return null;
  }

  // Filter fields that have values
  const fieldsWithValues = customFields.filter((field) => {
    const value = values[field.fieldKey];
    return value !== null && value !== undefined && value !== "";
  });

  if (fieldsWithValues.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className={compact ? "space-y-1" : "space-y-2"}>
        {fieldsWithValues.map((field) => (
          <div
            key={field.id}
            className={compact ? "flex items-center gap-2 text-xs" : "flex items-start gap-2 text-sm"}
          >
            <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
              {getFieldLabel(field)}:
            </span>
            <span className="text-gray-900 dark:text-white flex-1">
              {formatValue(field, values[field.fieldKey])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook to get column label (for use in table headers)
export function useColumnLabels() {
  const [columnLabels, setColumnLabels] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColumnLabels();
  }, []);

  const fetchColumnLabels = async () => {
    try {
      const response = await fetch("/api/column-labels");
      if (response.ok) {
        const labels: ColumnLabel[] = await response.json();
        const labelMap = new Map(labels.map((l) => [l.columnKey, l.customLabel]));
        setColumnLabels(labelMap);
      }
    } catch (error) {
      console.error("Error fetching column labels:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (columnKey: string, defaultLabel: string): string => {
    return columnLabels.get(columnKey) || defaultLabel;
  };

  return { getLabel, loading };
}

// Hook to get active custom fields
export function useCustomFields() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const response = await fetch("/api/custom-fields?active=true");
      if (response.ok) {
        const fields = await response.json();
        setCustomFields(fields);
      }
    } catch (error) {
      console.error("Error fetching custom fields:", error);
    } finally {
      setLoading(false);
    }
  };

  return { customFields, loading };
}
