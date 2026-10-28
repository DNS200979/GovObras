"use server";

import { redirect } from "next/navigation";
import { getAuth } from "@carbonfree/database/auth";

export async function sair() {
  await getAuth().signOut();
  redirect("/login");
}
