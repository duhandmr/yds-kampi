import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { exportUserData } from "@/lib/services/user-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getApiUser("USER");
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const limit = await rateLimit(`export:me:${user.id}`, 10, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  const data = await exportUserData(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="yds-kampi-verilerim-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
