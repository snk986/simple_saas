import { NextResponse } from "next/server";
import { z } from "zod";

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => {
    const field = issue.path.join(".") || "request";
    return `${field}: ${issue.message}`;
  });
}

export function invalidRequest(details: string | string[]) {
  return NextResponse.json(
    {
      error: "Invalid request",
      details: Array.isArray(details) ? details : [details],
    },
    { status: 400 },
  );
}

export function invalidJsonRequest() {
  return invalidRequest("request: Body must be valid JSON");
}

export function validationError(error: z.ZodError) {
  return invalidRequest(formatZodIssues(error));
}
