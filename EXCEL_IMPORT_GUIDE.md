# Excel Import Feature for Jobs

## Overview
You can now bulk import jobs from an Excel file (.xlsx or .xls). This is perfect for migrating existing jobs or creating multiple jobs at once.

## How to Use

1. **Access the Import Feature**
   - Go to the Jobs page (`/jobs`)
   - Click the green "Import Excel" button (only visible to Admins and Managers)

2. **Prepare Your Excel File**
   - Create an Excel file with the following columns (column names are case-insensitive):

### Required Columns
- **Client Name** - The name of the client
- **Job Title** - The title/description of the job
- **Assigned To** - Email address of the staff member (must exist in system with STAFF role)

### Optional Columns
- **Description** - Detailed job description
- **Priority** - Must be one of: LOW, NORMAL, HIGH, URGENT (default: NORMAL)
- **Service Types** - Comma-separated list of services:
  - BOOKKEEPING
  - VAT
  - CESSATION_OF_ACCOUNT
  - FINANCIAL_STATEMENTS
  - Example: `BOOKKEEPING, VAT`
- **Manager** - Email address of the manager (must have MANAGER or ADMIN role)
  - If not provided, uses the importing user (if they're a manager)
  - If still not found, assigns any available manager
- **Due Date** - Date in formats:
  - YYYY-MM-DD (e.g., 2025-12-31)
  - MM/DD/YYYY (e.g., 12/31/2025)
  - Excel date format will also work

## Excel Template Example

| Client Name | Job Title | Description | Priority | Service Types | Assigned To | Manager | Due Date |
|-------------|-----------|-------------|----------|---------------|-------------|---------|----------|
| ABC Corp | Annual Accounts | Prepare annual accounts for 2024 | HIGH | BOOKKEEPING,FINANCIAL_STATEMENTS | staff@example.com | manager@example.com | 2025-12-31 |
| XYZ Ltd | VAT Return Q4 | Quarterly VAT return | NORMAL | VAT | staff2@example.com | manager@example.com | 2025-11-15 |
| Smith & Co | Bookkeeping | Monthly bookkeeping | LOW | BOOKKEEPING | staff@example.com | | 2025-10-30 |

## Import Process

1. Click "Import Excel" button
2. Select your Excel file
3. Click "Import Jobs"
4. Review the results:
   - Success count
   - Failed count
   - Error details (if any)

## Important Notes

- **Job IDs** are automatically generated (JOB-0001, JOB-0002, etc.)
- **Status** is set to PENDING for all imported jobs
- **Started At** and **Last Activity At** are set to the import time
- **Timeline** entries are created for each job
- If staff member or manager email is not found, that row will fail
- Failed rows don't stop the import - other rows continue processing
- All errors are reported at the end

## Error Handling

Common errors:
- "Missing client name or job title" - Required fields are empty
- "Staff member not found with email: xxx" - Email doesn't exist or user is not STAFF role
- "No manager found" - Could not find any manager for the job
- Invalid priority values will default to NORMAL
- Invalid service types are skipped
- Invalid dates are ignored (job created without due date)

## API Endpoint

**POST** `/api/jobs/import`
- **Content-Type**: multipart/form-data
- **Body**: File upload with key "file"
- **Access**: ADMIN and MANAGER only
- **Response**: 
  ```json
  {
    "message": "Import completed. Success: 10, Failed: 2",
    "results": {
      "success": 10,
      "failed": 2,
      "errors": [
        "Row 5: Staff member not found with email: invalid@example.com",
        "Row 8: Missing client name or job title"
      ]
    }
  }
  ```

## Tips

- Test with a small file first (5-10 rows)
- Make sure all email addresses exist in your system
- Use Excel's data validation to ensure correct formats
- Keep a backup of your Excel file
- Review the error messages to fix issues in your file
- You can re-import after fixing errors
