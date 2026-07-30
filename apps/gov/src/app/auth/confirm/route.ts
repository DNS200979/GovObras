import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@carbonfree/database/server";

type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  return NextResponse.redirect(new URL("/login?erro=link_invalido", request.url));
}
