import { redirect } from "next/navigation";

/** Tela inicial da concreteira: as obras que ela atende. */
export default function Home() {
  redirect("/obras");
}
