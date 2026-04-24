import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_CHAT_ATTACHMENTS_BUCKET ?? "chat-attachments";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file обязателен" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл больше 8 МБ" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      {
        error:
          "Не удалось загрузить файл. Создайте публичный bucket «" +
          BUCKET +
          "» в Supabase Storage (см. .env.example).",
      },
      { status: 500 }
    );
  }

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  return NextResponse.json({
    url: pub.publicUrl,
    type: file.type || "application/octet-stream",
    name: file.name,
  });
}
