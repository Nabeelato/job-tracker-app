import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can import jobs
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Only admins and managers can import jobs" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      try {
        // Expected columns: Client Name, Job Title, Description, Priority, Service Types, Assigned To, Manager, Due Date
        const clientName = row["Client Name"] || row["client_name"] || row["clientName"];
        const title = row["Job Title"] || row["title"] || row["job_title"];
        const description = row["Description"] || row["description"] || "";
        const priority = (row["Priority"] || row["priority"] || "NORMAL").toUpperCase();
        const serviceTypesStr = row["Service Types"] || row["service_types"] || row["serviceTypes"] || "";
        const assignedToEmail = row["Assigned To"] || row["assigned_to"] || row["assignedTo"];
        const managerEmail = row["Manager"] || row["manager"];
        const dueDateStr = row["Due Date"] || row["due_date"] || row["dueDate"];

        if (!clientName || !title) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing client name or job title`);
          continue;
        }

        // Find assigned user by email
        const assignedUser = await prisma.user.findFirst({
          where: { 
            email: assignedToEmail,
            role: "STAFF"
          },
        });

        if (!assignedUser) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Staff member not found with email: ${assignedToEmail}`);
          continue;
        }

        // Find manager by email (optional)
        let manager = null;
        if (managerEmail) {
          manager = await prisma.user.findFirst({
            where: { 
              email: managerEmail,
              role: { in: ["MANAGER", "ADMIN"] }
            },
          });
        }

        // If no manager found, use the importing user if they're a manager
        if (!manager && session.user.role === "MANAGER") {
          manager = await prisma.user.findUnique({
            where: { id: session.user.id }
          });
        }

        // If still no manager, find any manager
        if (!manager) {
          manager = await prisma.user.findFirst({
            where: { role: "MANAGER" }
          });
        }

        if (!manager) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: No manager found`);
          continue;
        }

        // Parse service types
        const serviceTypes: string[] = [];
        if (serviceTypesStr) {
          const types = serviceTypesStr.split(",").map((t: string) => t.trim().toUpperCase());
          for (const type of types) {
            if (["BOOKKEEPING", "VAT", "CESSATION_OF_ACCOUNT", "FINANCIAL_STATEMENTS"].includes(type)) {
              serviceTypes.push(type);
            }
          }
        }

        // Parse due date
        let dueDate = null;
        if (dueDateStr) {
          const parsed = new Date(dueDateStr);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed;
          }
        }

        // Generate job ID
        const lastJob = await prisma.job.findFirst({
          orderBy: { jobId: "desc" },
        });
        const lastJobNumber = lastJob?.jobId ? parseInt(lastJob.jobId.split("-")[1]) : 0;
        const newJobId = `JOB-${String(lastJobNumber + 1).padStart(4, "0")}`;

        // Create the job
        await prisma.job.create({
          data: {
            id: crypto.randomUUID(),
            jobId: newJobId,
            clientName,
            title,
            description: description || null,
            status: "PENDING",
            priority: priority as any,
            serviceTypes: serviceTypes as any,
            assignedToId: assignedUser.id,
            assignedById: session.user.id,
            managerId: manager.id,
            dueDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            startedAt: new Date(),
            lastActivityAt: new Date(),
          },
        });

        // Create status update for job creation
        await prisma.statusUpdate.create({
          data: {
            id: crypto.randomUUID(),
            jobId: newJobId,
            userId: session.user.id,
            action: "JOB_CREATED",
            timestamp: new Date(),
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message || "Unknown error"}`);
        console.error(`Error processing row ${i + 2}:`, error);
      }
    }

    return NextResponse.json({
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      results,
    });
  } catch (error) {
    console.error("Error importing jobs:", error);
    return NextResponse.json(
      { error: "Failed to import jobs" },
      { status: 500 }
    );
  }
}
