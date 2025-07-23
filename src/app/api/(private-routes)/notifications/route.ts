import { handleError } from "@/app/api/lib/errors";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { auth } from "../../lib/auth/nextAuthConfig";

const prisma = new PrismaClient();

export const GET = auth(async (request: NextAuthRequest) => {
  try {
    console.log("[GET /api/notifications] Fetching user notifications...");
    
    // Get the user from request
    const sessionUser = await userFromSession(request);
    
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const method = searchParams.get('method');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where conditions
    const whereConditions: any = {
      user_id: sessionUser.id
    };

    // Add method filter if provided
    if (method && method.trim() !== '') {
      whereConditions.method = {
        equals: method,
        mode: 'insensitive'
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereConditions.created_at = {};
      if (dateFrom) {
        whereConditions.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 24 hours to include the entire day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.created_at.lte = endDate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.notifications.count({
      where: whereConditions
    });

    // Fetch notifications with pagination
    const notifications = await prisma.notifications.findMany({
      where: whereConditions,
      orderBy: {
        created_at: 'desc' // Most recent first
      },
      skip: skip,
      take: limit
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    console.log(`[GET /api/notifications] Found ${notifications.length} notifications for user ${sessionUser.id}`);

    return NextResponse.json({
      success: true,
      message: notifications.length === 0 
        ? "No notifications found" 
        : "Notifications retrieved successfully",
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return handleError(error);
  } finally {
    await prisma.$disconnect();
  }
}); 