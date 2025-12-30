import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLabourAttendanceSchema, validateRequest } from "@/lib/validations";
import { Prisma, ShiftType } from "@prisma/client";

// GET /api/labour-attendance - List all attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shiftType = searchParams.get("shiftType");
    const siteId = searchParams.get("siteId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const labourName = searchParams.get("labourName");

    const where: Prisma.LabourAttendanceWhereInput = {};

    if (shiftType && shiftType !== "ALL" && Object.values(ShiftType).includes(shiftType as ShiftType)) {
      where.shiftType = shiftType as ShiftType;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (labourName) {
      where.labourName = {
        contains: labourName,
        mode: "insensitive",
      };
    }

    if (startDate && endDate) {
      where.attendanceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.attendanceDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.attendanceDate = { lte: new Date(endDate) };
    }

    const attendanceRecords = await prisma.labourAttendance.findMany({
      where,
      include: {
        site: true,
        markedBy: true,
      },
      orderBy: {
        attendanceDate: "desc",
      },
    });

    // Calculate summary statistics
    const summary = {
      total: attendanceRecords.length,
      warehouse: attendanceRecords.filter((a) => a.shiftType === "WAREHOUSE")
        .length,
      site: attendanceRecords.filter((a) => a.shiftType === "SITE").length,
      totalShifts: attendanceRecords.reduce(
        (sum, a) => sum + a.shiftsWorked,
        0
      ),
      totalWages: attendanceRecords.reduce(
        (sum, a) => sum + (a.totalWage || 0),
        0
      ),
      uniqueLabourers: new Set(attendanceRecords.map((a) => a.labourName)).size,
    };

    return NextResponse.json({ attendanceRecords, summary });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

// POST /api/labour-attendance - Create new attendance record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CRITICAL FIX: Ensure user ID exists before proceeding
    if (!session.user?.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(createLabourAttendanceSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      labourName,
      attendanceDate,
      shiftType,
      siteId,
      shiftsWorked,
      wagePerShift,
      incentive,
      notes,
    } = validation.data;

    // Validate site for SITE shift type
    if (shiftType === "SITE" && !siteId) {
      return NextResponse.json(
        { error: "Site is required for site attendance" },
        { status: 400 }
      );
    }

    // Verify site exists if provided
    if (siteId) {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
      });
      if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }
    }

    // Calculate total wage
    const incentiveValue = incentive ?? 0;
    const totalWage = wagePerShift ? wagePerShift * shiftsWorked + incentiveValue : null;

    const attendance = await prisma.labourAttendance.create({
      data: {
        labourName,
        attendanceDate: new Date(attendanceDate),
        shiftType,
        siteId: shiftType === "SITE" ? siteId : null,
        shiftsWorked,
        wagePerShift: wagePerShift || null,
        incentive: incentiveValue,
        totalWage: totalWage,
        notes: notes || null,
        markedByUserId: session.user.id, // FIXED: No more || "" fallback
      },
      include: {
        site: true,
        markedBy: true,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance record:", error);
    return NextResponse.json(
      { error: "Failed to create attendance record" },
      { status: 500 }
    );
  }
}

