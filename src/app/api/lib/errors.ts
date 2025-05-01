import { NextResponse } from "next/server";

export interface ErrorResponse {
  error: string;
  details?: any; // For validation errors
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class AuthError extends AppError {
  constructor(message?: string) {
    super(message || "Authentication failed", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(message || "Forbidden", 403);
  }
}

export class ValidationError extends AppError {
  constructor(details: any) {
    super("Validation failed", 422, details);
  }
}

export function handleError(error: unknown) {
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
