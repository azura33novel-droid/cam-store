
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  title: string;
  category: string;
  price_brl: number | null;
  price_diamonds: number | null;
  stock: number;
  status: string;
};

export default function PainelVendedor() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [aprovado, setAprovado] = useState(false);
  const [nome, setNome] = useState("");
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("pokemon");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [diamantes, setDiamantes] = useState("");
  const [estoque, setEstoque] = useState("1");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarPainel() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const { data: perfil, error } = await supabase
      .from("seller_profiles")
      .select("display_name, status")
      .eq("id", userData.user.id)
      .single();

    if (error || !perfil) {
      setMensagem("Não foi possível localizar seu perfil.");
      return;
    }

    setNome(perfil.display_name);

    if (perfil.status !== "approved") {
      setAprovado(false);
      return;
    }

    setAprovado(true);

    const { data, error: productError } = await supabase
      .from("products")
      .select("id, title, category, price_brl, price_diamonds, stock, status")
      .eq("seller_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (productError) {
      setMensagem("Erro ao carregar produtos: " + productError.message);
      return;
    }

    setProdutos(data || []);
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

    setLogado(true);
    await carregarPainel();
    setCarregando(false);
  }

  async function cadastrarProduto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMensagem("Faça login novamente.");
      return;
    }

    if (!preco.trim() && !diamantes.trim()) {
      setMensagem("Informe o preço em reais, diamantes ou ambos.");
      return;
    }

    const valorReais = preco.trim() ? Number(preco) : null;
    const valorDiamantes = diamantes.trim() ? Number(diamantes) : null;
    const quantidade = Number(estoque);

    if (
      (valorReais !== null && (!Number.isFinite(valorReais) || valorReais < 0)) ||
      (valorDiamantes !== null && (!Number.isFinite(valorDiamantes) || valorDiamantes < 0)) ||
      !Number.isInteger(quantidade) ||
      quantidade < 0
    ) {
      setMensagem("Confira os preços e a quantidade em estoque.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from("products").insert({
      seller_id: userData.user.id,
      title: titulo,
      category: categoria,
      description: descricao,
      price_brl: valorReais,
      price_diamonds: valorDiamantes,
      stock: quantidade,
      status: "active",
    });

    setCarregando(false);

    if (error) {
      setMensagem("Erro ao cadastrar: " + error.message);
      return;
    }

    setMensagem("Produto cadastrado com sucesso!");
    setTitulo("");
    setDescricao("");
    setPreco("");
    setDiamantes("");
    setEstoque("1");

    await carregarPainel();
  }

  async function sair() {
    await supabase.auth.signOut();
    setLogado(false);
    setAprovado(false);
    setProdutos([]);
    setSenha("");
    setMensagem("");
  }

  const campo = {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px",
    margin: "8px 0 18px",
    background: "#080d18",
    color: "#fff",
    border: "1px solid #35435a",
    borderRadius: "8px",
  };

  const botao = {
    padding: "12px 18px",
    marginTop: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#d5aa50",
    color: "#101522",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080d18",
      color: "#fff",
      padding: "24px",
      fontFamily: "Arial, sans-serif"
    }}>
      {!logado ? (
        <form onSubmit={entrar} style={{
          maxWidth: "400px",
          margin: "60px auto",
          padding: "28px",
          background: "#111a2b",
          border: "1px solid #b99445",
          borderRadius: "14px"
        }}>
          <h1 style={{ color: "#e7bd63", textAlign: "center" }}>
            CAM STORE
          </h1>
          <h2 style={{ textAlign: "center" }}>
            Área do vendedor
          </h2>

          <label>E-mail</label>
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
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          {mensagem && <p>{mensagem}</p>}
        </form>
      ) : !aprovado ? (
        <section style={{ maxWidth: "550px", margin: "70px auto" }}>
          <h1 style={{ color: "#e7bd63" }}>Olá, {nome}!</h1>
          <h2>Cadastro aguardando aprovação</h2>
          <p>A administração ainda precisa aprovar seu cadastro para liberar as vendas.</p>
          <button onClick={sair} style={botao}>Sair</button>
        </section>
      ) : (
        <section style={{ maxWidth: "850px", margin: "auto" }}>
          <h1 style={{ color: "#e7bd63" }}>Painel do vendedor</h1>
          <p>Bem-vindo, {nome}!</p>

          <button onClick={sair} style={botao}>Sair</button>

          <hr style={{ borderColor: "#35435a", margin: "25px 0" }} />

          <h2>Novo produto</h2>

          <form onSubmit={cadastrarProduto} style={{
            background: "#111a2b",
            padding: "22px",
            borderRadius: "12px",
            border: "1px solid #35435a"
          }}>
            <label>Nome do produto</label>
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              style={campo}
            />

            <label>Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={campo}
            >
              <option value="diamantes">Diamantes</option>
              <option value="pokemon">Pokémon</option>
              <option value="itens">Itens</option>
              <option value="contas">Contas</option>
            </select>

            <label>Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{ ...campo, minHeight: "90px" }}
            />

            <label>Preço em reais (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              style={campo}
            />

            <label>Preço em diamantes</label>
            <input
              type="number"
              min="0"
              step="1"
              value={diamantes}
              onChange={(e) => setDiamantes(e.target.value)}
              style={campo}
            />

            <label>Quantidade em estoque</label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={estoque}
              onChange={(e) => setEstoque(e.target.value)}
              style={campo}
            />

            <button type="submit" disabled={carregando} style={botao}>
              {carregando ? "Salvando..." : "Cadastrar produto"}
            </button>
          </form>

          <h2 style={{ marginTop: "35px" }}>Meus produtos</h2>

          {produtos.length === 0 ? (
            <p>Você ainda não cadastrou produtos.</p>
          ) : (
            produtos.map((produto) => (
              <article key={produto.id} style={{
                background: "#111a2b",
                border: "1px solid #35435a",
                borderRadius: "10px",
                padding: "16px",
                marginTop: "12px"
              }}>
                <h3>{produto.title}</h3>
                <p>Categoria: {produto.category}</p>
                <p>
                  Preço: {produto.price_brl !== null
                    ? `R$ ${Number(produto.price_brl).toFixed(2)}`
                    : ""}
                  {produto.price_brl !== null && produto.price_diamonds !== null ? " / " : ""}
                  {produto.price_diamonds !== null
                    ? `${produto.price_diamonds} diamantes`
                    : ""}
                </p>
                <p>Estoque: {produto.stock}</p>
                <p>Status: {produto.status}</p>
              </article>
            ))
          )}

          {mensagem && <p>{mensagem}</p>}
        </section>
      )}
    </main>
  );
                        }
