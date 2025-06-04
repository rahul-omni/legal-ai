import { NextResponse } from "next/server";

export interface ErrorResponse {
  error: string;
  details?: any; // For validation errors
}

export class ErrorApp extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
  }
}

export class ErrorNotFound extends ErrorApp {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class ErrorAuth extends ErrorApp {
  constructor(message?: string) {
    super(message || "Authentication failed", 401);
  }
}

export class ErrorForbidden extends ErrorApp {
  constructor(message?: string) {
    super(message || "Forbidden", 403);
  }
}

export class ErrorAlreadyExists extends ErrorApp {
  constructor(resource: string) {
    super(`${resource} already exists`, 409);
  }
}

export class ErrorValidation extends ErrorApp {
  constructor(details?: any) {
    super("Validation failed", 422, details);
  }
}

export function handleError(error: unknown) {
  if (error instanceof ErrorNotFound) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof ErrorAuth) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof ErrorForbidden) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof ErrorValidation) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ErrorApp) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
