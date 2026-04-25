import { NextResponse } from "next/server";
import { getFleetHealthSnapshot } from "@/lib/server/telemetryStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getFleetHealthSnapshot();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      {
        mode: "fallback",
        source: "fallback",
        generatedAt: new Date().toISOString(),
        flaggedBatteries: [],
        message: `fleet health API failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
