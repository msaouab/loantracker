import { NextResponse } from "next/server";
import { AppError, ValidationError } from "@/lib/errors";

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.fieldErrors }, { status: 400 });
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
