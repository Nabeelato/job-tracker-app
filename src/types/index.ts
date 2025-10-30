export type UserRole = "ADMIN" | "MANAGER" | "SUPERVISOR" | "STAFF"

export type JobStatus = 
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED"

export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

export type ServiceType = "BOOKKEEPING" | "VAT" | "AUDIT" | "FINANCIAL_STATEMENTS"

export interface Job {
  id: string
  title: string
  description: string
  status: JobStatus
  priority: Priority
  isUrgent: boolean
  isLate: boolean
  assignedToId: string
  assignedById: string
  departmentId?: string
  serviceTypes?: ServiceType[]
  dueDate: Date
  completedAt?: Date
  tags: string[]
  createdAt: Date
  updatedAt: Date
  assignedTo: User
  assignedBy: User
  department?: Department
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  departmentId?: string
  isActive: boolean
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Department {
  id: string
  name: string
  managerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  content: string
  jobId: string
  userId: string
  isEdited: boolean
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface StatusUpdate {
  id: string
  jobId: string
  userId: string
  action: string
  oldValue?: string
  newValue?: string
  timestamp: Date
  user: User
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  content: string
  jobId?: string
  isRead: boolean
  createdAt: Date
}

export type FieldType = 
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "DATETIME"
  | "SELECT"
  | "BOOLEAN"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "TEXTAREA"

export interface CustomField {
  id: string
  fieldKey: string
  fieldLabel: string
  fieldType: FieldType
  options: string[]
  isRequired: boolean
  isActive: boolean
  sortOrder: number
  category?: string
  description?: string
  defaultValue?: string
  createdAt: Date
  updatedAt: Date
  createdById: string
  createdBy?: User
}

export interface ColumnLabel {
  id: string
  columnKey: string
  customLabel: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomFieldValue {
  [fieldKey: string]: any
}
