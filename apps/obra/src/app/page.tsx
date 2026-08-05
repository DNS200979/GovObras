import { redirect } from "next/navigation";

/**
 * A tela inicial da construtora é o módulo ESG — é o que ela usa para
 * organizar a documentação e instruir o pedido de benefício fiscal.
 * O painel de carbono continua em /painel.
 */
export default function Home() {
  redirect("/esg");
}
