import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, handleError } from "../../lib/errors";
import { roleService } from "../../lib/services/roleService";
import { RoleResponse } from "./types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<RoleResponse | ErrorResponse>> {
  try {
    // Fetch all roles with their associated permissions
    const roles = (await roleService.findAllRoles()).map((role) => ({
      id: role.id,
      name: role.name,
      permissions: role.permission.map((p) => p.name),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      description: role.description,
    }));

    // Return the roles with their permissions
    return NextResponse.json(
      {
        successMessage: "All roles fetched successfully",
        roles,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
