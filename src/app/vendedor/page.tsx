
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  price_brl: number | null;
  price_diamonds: number | null;
  stock: number;
  status: string;
  images: string[];
};

export default function PainelVendedor() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [aprovado, setAprovado] = useState(false);
  const [statusPerfil, setStatusPerfil] = useState("");
  const [nome, setNome] = useState("");
  const [produtos, setProdutos] = useState<Product[]>([]);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("pokemon");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [diamantes, setDiamantes] = useState("");
  const [estoque, setEstoque] = useState("1");

  const [fotos, setFotos] = useState<File[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editCategoria, setEditCategoria] = useState("pokemon");
  const [editDescricao, setEditDescricao] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editDiamantes, setEditDiamantes] = useState("");
  const [editEstoque, setEditEstoque] = useState("1");

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => fotos.map((foto) => URL.createObjectURL(foto)),
    [fotos]
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

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
    margin: "8px 8px 8px 0",
    border: "none",
    borderRadius: "8px",
    background: "#d5aa50",
    color: "#101522",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

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
    setStatusPerfil(perfil.status);

    if (perfil.status !== "approved") {
      setAprovado(false);
      return;
    }

    setAprovado(true);

    const { data, error: productError } = await supabase
      .from("products")
      .select(
        "id, title, category, description, price_brl, price_diamonds, stock, status, images"
      )
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

  function selecionarFotos(arquivos: FileList | null) {
    if (!arquivos) return;

    const selecionadas = Array.from(arquivos);

    if (selecionadas.length > 5) {
      setMensagem("Você pode selecionar no máximo 5 fotos.");
      return;
    }

    const invalida = selecionadas.find(
      (foto) =>
        !["image/jpeg", "image/png", "image/webp"].includes(foto.type) ||
        foto.size > 5 * 1024 * 1024
    );

    if (invalida) {
      setMensagem(
        "Use imagens JPG, PNG ou WEBP com no máximo 5 MB cada."
      );
      return;
    }

    setMensagem("");
    setFotos(selecionadas);
  }

  async function enviarFotos(
    arquivos: File[],
    usuarioId: string,
    produtoId: string
  ) {
    const urls: string[] = [];

    for (let i = 0; i < arquivos.length; i++) {
      const foto = arquivos[i];
      const nomeSeguro = foto.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const caminho = `${usuarioId}/${produtoId}/${Date.now()}-${i}-${nomeSeguro}`;

      const { error } = await supabase.storage
        .from("cam-store-images")
        .upload(caminho, foto, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("cam-store-images")
        .getPublicUrl(caminho);

      urls.push(data.publicUrl);
    }

    return urls;
  }

  async function cadastrarProduto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMensagem("Faça login novamente.");
      return;
    }

    if (!titulo.trim()) {
      setMensagem("Informe o nome do produto.");
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
      (valorReais !== null &&
        (!Number.isFinite(valorReais) || valorReais < 0)) ||
      (valorDiamantes !== null &&
        (!Number.isInteger(valorDiamantes) || valorDiamantes < 0)) ||
      !Number.isInteger(quantidade) ||
      quantidade < 0
    ) {
      setMensagem("Confira os preços e a quantidade em estoque.");
      return;
    }

    setCarregando(true);

    const { data: produto, error } = await supabase
      .from("products")
      .insert({
        seller_id: userData.user.id,
        title: titulo.trim(),
        category: categoria,
        description: descricao.trim(),
        price_brl: valorReais,
        price_diamonds: valorDiamantes,
        stock: quantidade,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !produto) {
      setMensagem("Erro ao cadastrar: " + (error?.message || "Produto não criado."));
      setCarregando(false);
      return;
    }

    try {
      if (fotos.length > 0) {
        const urls = await enviarFotos(
          fotos,
          userData.user.id,
          produto.id
        );

        const { error: updateError } = await supabase
          .from("products")
          .update({ images: urls })
          .eq("id", produto.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      setMensagem("Produto cadastrado com sucesso!");
    } catch (erro) {
      const detalhe =
        erro instanceof Error ? erro.message : "Erro desconhecido";

      setMensagem(
        "Produto criado, mas houve um problema ao enviar as fotos: " + detalhe
      );
    }

    setTitulo("");
    setDescricao("");
    setPreco("");
    setDiamantes("");
    setEstoque("1");
    setFotos([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await carregarPainel();
    setCarregando(false);
  }

  function iniciarEdicao(produto: Product) {
    setEditando(produto.id);
    setEditTitulo(produto.title);
    setEditCategoria(produto.category);
    setEditDescricao(produto.description || "");
    setEditPreco(
      produto.price_brl !== null ? String(produto.price_brl) : ""
    );
    setEditDiamantes(
      produto.price_diamonds !== null
        ? String(produto.price_diamonds)
        : ""
    );
    setEditEstoque(String(produto.stock));
    setMensagem("");
  }

  async function salvarEdicao(id: string) {
    if (!editTitulo.trim()) {
      setMensagem("Digite o nome do produto.");
      return;
    }

    if (!editPreco.trim() && !editDiamantes.trim()) {
      setMensagem("Informe o preço em reais, diamantes ou ambos.");
      return;
    }

    const valorReais = editPreco.trim() ? Number(editPreco) : null;
    const valorDiamantes = editDiamantes.trim()
      ? Number(editDiamantes)
      : null;
    const quantidade = Number(editEstoque);

    if (
      (valorReais !== null &&
        (!Number.isFinite(valorReais) || valorReais < 0)) ||
      (valorDiamantes !== null &&
        (!Number.isInteger(valorDiamantes) || valorDiamantes < 0)) ||
      !Number.isInteger(quantidade) ||
      quantidade < 0
    ) {
      setMensagem("Confira os preços e a quantidade em estoque.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase
      .from("products")
      .update({
        title: editTitulo.trim(),
        category: editCategoria,
        description: editDescricao.trim(),
        price_brl: valorReais,
        price_diamonds: valorDiamantes,
        stock: quantidade,
      })
      .eq("id", id);

    if (error) {
      setMensagem("Erro ao editar: " + error.message);
      setCarregando(false);
      return;
    }

    setMensagem("Produto atualizado com sucesso!");
    setEditando(null);
    await carregarPainel();
    setCarregando(false);
  }

  async function excluirProduto(id: string) {
    const confirmar = window.confirm(
      "Tem certeza de que deseja excluir este produto? Essa ação não pode ser desfeita."
    );

    if (!confirmar) return;

    setCarregando(true);
    setMensagem("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      setMensagem("Erro ao excluir produto: " + error.message);
      setCarregando(false);
      return;
    }

    setMensagem("Produto excluído com sucesso!");
    setEditando(null);
    await carregarPainel();
    setCarregando(false);
  }

  async function sair() {
    await supabase.auth.signOut();
    setLogado(false);
    setAprovado(false);
    setStatusPerfil("");
    setProdutos([]);
    setSenha("");
    setMensagem("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080d18",
        color: "#fff",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {!logado ? (
        <form
          onSubmit={entrar}
          style={{
            maxWidth: "400px",
            margin: "60px auto",
            padding: "28px",
            background: "#111a2b",
            border: "1px solid #b99445",
            borderRadius: "14px",
          }}
        >
          <h1 style={{ color: "#e7bd63", textAlign: "center" }}>
            CAM STORE
          </h1>
          <h2 style={{ textAlign: "center" }}>Área do vendedor</h2>

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

          {mensagem && <p style={{ color: "#ff7777" }}>{mensagem}</p>}
        </form>
      ) : !aprovado ? (
        <section style={{ maxWidth: "550px", margin: "70px auto" }}>
          <h1 style={{ color: "#e7bd63" }}>Olá, {nome}!</h1>

          {statusPerfil === "rejected" ? (
            <>
              <h2>Cadastro não aprovado</h2>
              <p>Entre em contato com a administração da CAM Store.</p>
            </>
          ) : statusPerfil === "suspended" ? (
            <>
              <h2>Conta suspensa</h2>
              <p>Entre em contato com a administração da CAM Store.</p>
            </>
          ) : (
            <>
              <h2>Cadastro aguardando aprovação</h2>
              <p>
                A administração ainda precisa aprovar seu cadastro para
                liberar as vendas.
              </p>
            </>
          )}

          <button onClick={sair} style={botao}>
            Sair
          </button>
        </section>
      ) : (
        <section style={{ maxWidth: "900px", margin: "auto" }}>
          <h1 style={{ color: "#e7bd63" }}>Painel do vendedor</h1>
          <p>Bem-vindo, {nome}!</p>

          <button onClick={sair} style={botao}>
            Sair
          </button>

          <hr style={{ borderColor: "#35435a", margin: "25px 0" }} />

          <h2>Novo produto</h2>

          <form
            onSubmit={cadastrarProduto}
            style={{
              background: "#111a2b",
              padding: "22px",
              borderRadius: "12px",
              border: "1px solid #35435a",
            }}
          >
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

            <label>Fotos do produto (máximo 5)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => selecionarFotos(e.target.files)}
              style={{ ...campo, padding: "10px" }}
            />
            <p style={{ color: "#aab4c5", fontSize: "13px" }}>
              Formatos JPG, PNG ou WEBP. Máximo de 5 MB por foto.
            </p>

            {previews.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                {previews.map((url, index) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Prévia ${index + 1}`}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #b99445",
                    }}
                  />
                ))}
              </div>
            )}

            <button type="submit" disabled={carregando} style={botao}>
              {carregando ? "Salvando..." : "Cadastrar produto"}
            </button>
          </form>

          <h2 style={{ marginTop: "35px" }}>Meus produtos</h2>

          {produtos.length === 0 ? (
            <p>Você ainda não cadastrou produtos.</p>
          ) : (
            produtos.map((produto) => (
              <article
                key={produto.id}
                style={{
                  background: "#111a2b",
                  border: "1px solid #35435a",
                  borderRadius: "10px",
                  padding: "18px",
                  marginTop: "15px",
                }}
              >
                {editando === produto.id ? (
                  <div>
                    <h3>Editar produto</h3>

                    <label>Nome</label>
                    <input
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      style={campo}
                    />

                    <label>Categoria</label>
                    <select
                      value={editCategoria}
                      onChange={(e) => setEditCategoria(e.target.value)}
                      style={campo}
                    >
                      <option value="diamantes">Diamantes</option>
                      <option value="pokemon">Pokémon</option>
                      <option value="itens">Itens</option>
                      <option value="contas">Contas</option>
                    </select>

                    <label>Descrição</label>
                    <textarea
                      value={editDescricao}
                      onChange={(e) => setEditDescricao(e.target.value)}
                      style={{ ...campo, minHeight: "80px" }}
                    />

                    <label>Preço em reais (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPreco}
                      onChange={(e) => setEditPreco(e.target.value)}
                      style={campo}
                    />

                    <label>Preço em diamantes</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editDiamantes}
                      onChange={(e) => setEditDiamantes(e.target.value)}
                      style={campo}
                    />

                    <label>Estoque</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editEstoque}
                      onChange={(e) => setEditEstoque(e.target.value)}
                      style={campo}
                    />

                    <button
                      onClick={() => salvarEdicao(produto.id)}
                      disabled={carregando}
                      style={botao}
                    >
                      Salvar alterações
                    </button>

                    <button
                      onClick={() => setEditando(null)}
                      disabled={carregando}
                      style={{ ...botao, background: "#64748b" }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <h3>{produto.title}</h3>

                    {produto.images?.length > 0 && (
                  
