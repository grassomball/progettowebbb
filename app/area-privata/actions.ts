"use server";

import { redirect } from "next/navigation";
import { distruggiSessione } from "@/lib/session";

export async function logoutUtente() {
  await distruggiSessione();
  redirect("/login");
}
