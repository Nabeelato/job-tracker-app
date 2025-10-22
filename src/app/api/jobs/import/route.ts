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
        // Excel columns from user's format
        const jobNo = row["[Job] Job No."] || row["Job No."] || row["Job No"] || "";
        const clientName = row["[Client] Client"] || row["Client"] || "";
        const title = row["[Job] Name"] || row["Name"] || row["Job Name"] || "";
        const priority = row["Priority"] || null;
        const statusRaw = (row["[State] State"] || row["State"] || "02. RFI").toString();
        const managerName = row["[Job] Manager"] || row["Manager"] || "";

        if (!clientName || !title) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing client name or job title`);
          continue;
        }

        // Map status from Excel to our system - more flexible matching
        let mappedStatus = "RFI_EMAIL_TO_CLIENT_SENT";
        const statusUpper = statusRaw.toUpperCase().trim();
        
        // Match by number prefix or keyword
        if (statusUpper.startsWith("02") || statusUpper.includes("RFI")) {
          mappedStatus = "RFI_EMAIL_TO_CLIENT_SENT";
        } else if (statusUpper.startsWith("03") || statusUpper.includes("INFO SENT TO LAHORE") || statusUpper.includes("JOB STARTED")) {
          mappedStatus = "INFO_SENT_TO_LAHORE_JOB_STARTED";
        } else if (statusUpper.startsWith("04") || statusUpper.includes("MISSING INFO") || statusUpper.includes("CHASE")) {
          mappedStatus = "MISSING_INFO_CHASE_CLIENT";
        } else if (statusUpper.startsWith("05") || statusUpper.includes("LAHORE TO PROCEED") || statusUpper.includes("CLIENT INFO COMPLETE")) {
          mappedStatus = "LAHORE_TO_PROCEED_CLIENT_INFO_COMPLETE";
        } else if (statusUpper.startsWith("06") || statusUpper.includes("REVIEW") || statusUpper.includes("JACK")) {
          mappedStatus = "FOR_REVIEW_WITH_JACK";
        } else if (statusUpper.startsWith("07") || statusUpper.includes("COMPLETED")) {
          mappedStatus = "COMPLETED";
        } else if (statusUpper.includes("CANCEL")) {
          mappedStatus = "CANCELLED";
        }

        // Find manager by name
        let manager = null;
        if (managerName) {
          manager = await prisma.user.findFirst({
            where: { 
              name: {
                contains: managerName,
                mode: "insensitive"
              },
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

        // For now, assign to the importing user or first available staff
        // You can enhance this to match by name if needed
        let assignedUser = await prisma.user.findFirst({
          where: { role: "STAFF" }
        });

        if (!assignedUser) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: No staff member available to assign`);
          continue;
        }

        // Use provided Job No or generate new one
        let finalJobId = jobNo;
        if (!finalJobId) {
          const lastJob = await prisma.job.findFirst({
            orderBy: { jobId: "desc" },
          });
          const lastJobNumber = lastJob?.jobId ? parseInt(lastJob.jobId.split("-")[1]) : 0;
          finalJobId = `JOB-${String(lastJobNumber + 1).padStart(4, "0")}`;
        }

        // Create the job
        await prisma.job.create({
          data: {
            id: crypto.randomUUID(),
            jobId: finalJobId,
            clientName,
            title,
            description: null,
            status: mappedStatus as any,
            priority: priority || null,
            serviceTypes: [],
            assignedToId: assignedUser.id,
            assignedById: session.user.id,
            managerId: manager.id,
            dueDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            startedAt: null,
            lastActivityAt: new Date(),
          },
        });

        // Create status update for job creation
        await prisma.statusUpdate.create({
          data: {
            id: crypto.randomUUID(),
            jobId: finalJobId,
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
