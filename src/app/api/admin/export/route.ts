import { NextResponse, type NextRequest } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { buildExport } from "@/lib/services/admin";
import { exportQuerySchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getApiUser("ADMIN");
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const parsed = exportQuerySchema.safeParse({
    dataset: request.nextUrl.searchParams.get("dataset"),
    format: request.nextUrl.searchParams.get("format"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz parametre." }, { status: 400 });
  const limit = await rateLimit(`export:admin:${user.id}`, 30, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  const file = await buildExport(parsed.data.dataset, parsed.data.format);
  return new NextResponse(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
