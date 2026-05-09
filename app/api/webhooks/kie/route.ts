import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.info("[kie webhook] received callback", {
      taskId: payload?.data?.taskId ?? payload?.taskId,
      status: payload?.data?.status ?? payload?.status,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[kie webhook] invalid callback", error);
    return NextResponse.json({ received: true });
  }
}
