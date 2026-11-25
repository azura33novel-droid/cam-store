import { supabase } from "../../lib/supabase";

export default async function Teste() {
  const { error } = await supabase
    .from("seller_profiles")
    .select("id")
    .limit(1);

  return (
    <main style={{ padding: "40px", color: "white", background: "#080d1a", minHeight: "100vh" }}>
      <h1>Teste de conexão CAM Store</h1>

      {error ? (
        <p style={{ color: "#ff5555" }}>
          Erro na conexão: {error.message}
        </p>
      ) : (
        <p style={{ color: "#00dd88" }}>
          Conexão com Supabase funcionando!
        </p>
      )}
    </main>
  );
                   }
