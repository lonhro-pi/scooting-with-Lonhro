import { NextResponse } from "next/server";
import { getLatestTelemetrySnapshot } from "@/lib/server/telemetryStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const telemetry = await getLatestTelemetrySnapshot();
    return NextResponse.json(telemetry, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch latest telemetry." },
      { status: 500 },
    );
  }
}
