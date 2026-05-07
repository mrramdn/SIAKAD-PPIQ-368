import { NextResponse } from "next/server";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
};

export function successResponse<T>(message: string, data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message,
      data,
    },
    { status },
  );
}

export function errorResponse(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json<ApiResponse<never>>(
    {
      success: false,
      message,
      errors,
    },
    { status },
  );
}
