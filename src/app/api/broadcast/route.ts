import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendBroadcast, getAllUsersForMention } from "@/app/actions/broadcast";

// GET — fetch users for @mention autocomplete
export async function GET() {
  try {
    const users = await getAllUsersForMention();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}

// POST — send a broadcast
export async function POST(req: NextRequest) {
  try {
    const { message, targetUserIds } = await req.json();
    const result = await sendBroadcast(message, targetUserIds);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
