import { NextRequest, NextResponse } from "next/server";
import { markCredentialRenewed } from "@/app/actions/vault";

// POST /api/credentials/[id]/renew  { notifId?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await markCredentialRenewed(params.id, body.notifId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
