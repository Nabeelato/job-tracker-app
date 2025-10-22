# Excel Import Feature for Jobs

## Overview
You can now bulk import jobs from an Excel file (.xlsx or .xls). This is perfect for migrating existing jobs or creating multiple jobs at once.

## How to Use

1. **Access the Import Feature**
   - Go to the Jobs page (`/jobs`)
   - Click the green "Import Excel" button (only visible to Admins and Managers)

2. **Prepare Your Excel File**
   - Create an Excel file with the following columns (column names are case-insensitive):

### Required Columns (exact column names)
- **[Client] Client** - The name of the client
- **[Job] Name** - The title/description of the job

### Optional Columns (exact column names)
- **[Job] Job No.** - Job ID (e.g., JOB-0001, JOB-0002)
  - If provided, uses this exact ID
  - If empty/missing, automatically generates the next available ID
- **Priority** - Must be one of: LOW, NORMAL, HIGH, URGENT (default: NORMAL)
- **[State] State** - Job status. Accepted values:
  - PENDING
  - IN PROGRESS (or IN_PROGRESS)
  - ON HOLD (or ON_HOLD)
  - AWAITING APPROVAL (or AWAITING_APPROVAL)
  - PENDING COMPLETION (or PENDING_COMPLETION)
  - COMPLETED
  - CANCELLED
  - Default: PENDING if not specified
- **[Job] Manager** - Name of the manager (not email)
  - System will search for manager by name (case-insensitive partial match)
  - If not provided, uses the importing user (if they're a manager)
  - If still not found, assigns any available manager

**Note:** Jobs are automatically assigned to available staff members.

## Excel Template Example

| [Job] Job No. | [Client] Client | [Job] Name | Priority | [State] State | [Job] Manager |
|---------------|-----------------|------------|----------|---------------|---------------|
| JOB-0001 | ABC Corp | Annual Accounts 2024 | HIGH | IN PROGRESS | John Smith |
| JOB-0002 | XYZ Ltd | VAT Return Q4 | NORMAL | PENDING | John Smith |
| | Smith & Co | Monthly Bookkeeping | LOW | PENDING | Sarah Jones |
| JOB-0010 | Tech Solutions | Year End Accounts | URGENT | AWAITING APPROVAL | John Smith |

## Import Process

1. Click "Import Excel" button
2. Select your Excel file
3. Click "Import Jobs"
4. Review the results:
   - Success count
   - Failed count
   - Error details (if any)

## Important Notes

- **Job IDs**: Can be provided in Excel or auto-generated
  - If `[Job] Job No.` is empty, system generates next available ID (JOB-0001, JOB-0002, etc.)
  - If provided, uses the exact ID from Excel
- **Status**: Uses the value from `[State] State` column or defaults to PENDING
- **Started At** and **Last Activity At** are set to the import time
- **Timeline** entries are created for each job
- **Manager**: Matched by name (case-insensitive, partial match allowed)
- **Staff Assignment**: Jobs are automatically assigned to available staff members
- Failed rows don't stop the import - other rows continue processing
- All errors are reported at the end

## Error Handling

Common errors:
- "Missing client name or job title" - Required `[Client] Client` or `[Job] Name` fields are empty
- "No manager found" - Could not find any manager in the system
- "No staff member available to assign" - No STAFF users exist in the system
- Invalid priority values will default to NORMAL
- Invalid status values will default to PENDING

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
