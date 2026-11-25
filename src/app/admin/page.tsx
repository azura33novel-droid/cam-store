
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Seller = {
  id: string;
  display_name: string;
  whatsapp: string;
  created_at: string;
};

export default function Admin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [vendedores, setVendedores] = useState<Seller[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarVendedores() {
    const { data, error } = await supabase
      .from("seller_profiles")
      .select("id, display_name, whatsapp, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMensagem("Erro ao carregar vendedores: " + error.message);
      return;
    }

    setVendedores(data || []);
  }

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setMensagem("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    const { data, error: adminError } = await supabase.rpc("is_admin");

    if (adminError || !data) {
      await supabase.auth.signOut();
      setMensagem("Acesso negado. Esta conta não é administradora.");
      setCarregando(false);
      return;
    }

    setLogado(true);
    await carregarVendedores();
    setCarregando(false);
  }

  async function alterarStatus(id: string, status: string) {
    setMensagem("");

    const { error } = await supabase.rpc("admin_set_seller_status", {
      p_seller_id: id,
      p_status: status,
    });

    if (error) {
      setMensagem("Erro: " + error.message);
      return;
    }

    setMensagem(
      status === "approved"
        ? "Vendedor aprovado com sucesso!"
        : "Cadastro rejeitado."
    );

    await carregarVendedores();
  }

  async function sair() {
    await supabase.auth.signOut();
    setLogado(false);
    setVendedores([]);
    setSenha("");
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080d18",
      color: "#fff",
      padding: "25px",
      fontFamily: "Arial, sans-serif"
    }}>
      {!logado ? (
        <form onSubmit={entrar} style={{
          maxWidth: "400px",
          margin: "70px auto",
          padding: "30px",
          background: "#111a2b",
          border: "1px solid #b99445",
          borderRadius: "14px"
        }}>
          <h1 style={{ color: "#e7bd63", textAlign: "center" }}>
            CAM STORE
          </h1>
          <h2 style={{ textAlign: "center" }}>
            Administração
          </h2>

          <label>E-mail administrativo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={campo}
          />

          <label>Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={campo}
          />

          <button type="submit" disabled={carregando} style={botao}>
            {carregando ? "Verificando..." : "Entrar no painel"}
          </button>

          {mensagem && <p style={{ color: "#ff7777" }}>{mensagem}</p>}
        </form>
      ) : (
        <section style={{ maxWidth: "850px", margin: "auto" }}>
          <h1 style={{ color: "#e7bd63" }}>Painel Administrativo</h1>
          <p>Vendedores aguardando aprovação</p>

          <button onClick={sair} style={botao}>
            Sair
          </button>

          {mensagem && <p>{mensagem}</p>}

          {vendedores.length === 0 ? (
            <p>Nenhum vendedor aguardando aprovação.</p>
          ) : (
            vendedores.map((vendedor) => (
              <article key={vendedor.id} style={{
                background: "#111a2b",
                border: "1px solid #35435a",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "18px"
              }}>
                <h3>{vendedor.display_name}</h3>
                <p>WhatsApp: {vendedor.whatsapp}</p>
                <p>
                  Cadastro: {new Date(vendedor.created_at).toLocaleDateString("pt-BR")}
                </p>

                <button
                  onClick={() => alterarStatus(vendedor.id, "approved")}
                  style={{ ...botao, background: "#168653" }}
                >
                  Aprovar
                </button>

                <button
                  onClick={() => alterarStatus(vendedor.id, "rejected")}
                  style={{ ...botao, background: "#a93636" }}
                >
                  Rejeitar
                </button>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
}

const campo = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px",
  margin: "9px 0 20px",
  background: "#080d18",
  color: "#fff",
  border: "1px solid #35435a",
  borderRadius: "8px",
};

const botao = {
  padding: "12px 18px",
  margin: "8px 8px 8px 0",
  border: "none",
  borderRadius: "8px",
  background: "#d5aa50",
  color: "#101522",
  fontWeight: "bold" as const,
  cursor: "pointer",
};
      
