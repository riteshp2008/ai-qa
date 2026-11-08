import "server-only";

import { NextResponse } from "next/server";

import { AppError, httpStatusByCode } from "@/domain/errors";

/** Maps a thrown error to a JSON response for route handlers. */
export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message, errors: error.fieldErrors }, { status: httpStatusByCode[error.code] });
  }
  console.error(fallbackMessage, error);
  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}
