import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, handleError } from "../../lib/errors";
import { userService } from "../../services/userService";

export async function GET(
  request: NextRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    const user_id = request.nextUrl.searchParams.get("user_id");

    let clients;

    if (user_id) {
      clients = await userService.getUserClients(user_id);
    }

    return NextResponse.json(
      {
        clients,
        success: true,
        successMessage: "Clients fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

// POST: create a new client
export async function POST(
  request: NextRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone_no,
      organization,
      billingAddress,
      gstNumber,
      defaultBillingRate,
      paymentTerms,
      userId,
    } = body;

    if (!name || !email || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, or userId" },
        { status: 400 }
      );
    }

    const client = await userService.createNewClient({
      userId,
      name,
      email,
      phone_no,
      organization,
    })

    return NextResponse.json(
      {
        client,
        success: true,
        successMessage: "Client created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

// PUT: update an existing client
export async function PUT(
  request: NextRequest
): Promise<NextResponse<any | ErrorResponse>> {
  try {
    const client_id = request.nextUrl.searchParams.get("client_id");
    if (!client_id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      email,
      phone_no,
      organization,
      billingAddress,
      gstNumber,
      defaultBillingRate,
      paymentTerms,
    } = body;

    const updatedClient = await userService.updateClient(client_id, {
      name,
      email,
      phone_no,
      organization,
    });

    return NextResponse.json(
      {
        client: updatedClient,
        success: true,
        successMessage: "Client updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
