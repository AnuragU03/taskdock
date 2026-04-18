import { NextRequest, NextResponse } from "next/server";
import { acknowledgeBroadcast } from "@/app/actions/broadcast";

// POST /api/broadcast/[id]/ack  { response: 'yes' | 'no' }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { response, replyText } = await req.json();
    if (response !== "yes" && response !== "no") {
      return NextResponse.json({ error: "Invalid response" }, { status: 400 });
    }
    const result = await acknowledgeBroadcast(id, response, replyText);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
