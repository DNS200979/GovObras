import { getAuth } from "@carbonfree/database/auth";

// Sempre dinâmico: o handler depende das variáveis do Neon Auth em runtime.
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ path: string[] }> };

export const GET = (request: Request, ctx: Contexto) => getAuth().handler().GET(request, ctx);
export const POST = (request: Request, ctx: Contexto) => getAuth().handler().POST(request, ctx);
