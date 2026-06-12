import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // ton code ici
  return NextResponse.json({ success: true });
}
