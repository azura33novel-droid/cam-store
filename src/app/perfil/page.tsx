
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  display_name: string;
  whatsapp_url: string | null;
  status: string;
};

type Product = {
  id: string;
  title: string;
  category: string;
  price_brl: number | null;
  price_diamonds: number | null;
  stock: number;
  status: string;
  images: string[];
  sold_at: string | null;
};

type Sale = {
  id: string;
  product_title: string;
  sale_price_brl: number | null;
  sale_price_diamonds: number | null;
  sold_at: string;
};

type SaleType = "brl" | "diamonds";

const inputStyle = {
  width: "100%",
  padding: "13px",
  borderRadius: "9px",
  border: "1px solid #39445b",
  background: "#111827",
  color: "#ffffff",
  marginTop: "7px",
  marginBottom: "15px",
};

const buttonStyle = {
  padding: "12px 18px",
  borderRadius: "9px",
  border: "none",
  background: "#d6ad55",
  color: "#111827",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#263247",
  color: "#ffffff",
};

export default function PerfilVendedor() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [section, setSection] = useState("inicio");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [saleType, setSaleType] = useState<SaleType>("brl");

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    const { data: profileData, error: profileError } =
      await supabase
        .from("seller_profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (profileError || !profileData) {
      setMessage("Não foi possível carregar seu perfil.");
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setName(profileData.display_name || "");
    setWhatsapp(profileData.whatsapp_url || "");

    const [productsResult, salesResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("sales")
        .select("*")
        .eq("seller_id", userId)
        .order("sold_at", { ascending: false }),
    ]);

    if (productsResult.error) {
      setMessage("Erro ao carregar seus anúncios.");
    } else {
      setProducts(productsResult.data || []);
    }

    if (salesResult.error) {
      setMessage("Erro ao carregar seu histórico de vendas.");
    } else {
      setSales(salesResult.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("E-mail ou senha incorretos.");
      setBusy(false);
      return;
    }

    await loadData();
    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setProducts([]);
    setSales([]);
    setMessage("");
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc(
      "atualizar_perfil_vendedor",
      {
        p_display_name: name,
        p_whatsapp_url: whatsapp,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Perfil atualizado com sucesso!");
      await loadData();
    }

    setBusy(false);
  }

  function openSaleOptions(product: Product) {
    if (product.price_brl !== null) {
      setSaleType("brl");
    } else {
      setSaleType("diamonds");
    }

    setSaleProduct(product);
    setMessage("");
  }

  async function confirmSale() {
    if (!saleProduct) return;

    if (
      saleType === "brl" &&
      saleProduct.price_brl === null
    ) {
      setMessage("Este anúncio não possui preço em reais.");
      return;
    }

    if (
      saleType === "diamonds" &&
      saleProduct.price_diamonds === null
    ) {
      setMessage("Este anúncio não possui preço em diamantes.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc(
      "marcar_produto_vendido",
      {
        p_product_id: saleProduct.id,
        p_sale_type: saleType,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Venda registrada com sucesso!");
      setSaleProduct(null);
      await loadData();
    }

    setBusy(false);
  }

  const activeProducts = products.filter(
    (product) => product.status === "active"
  );

  const soldProducts = products.filter(
    (product) => product.status === "sold"
  );

  const totalBrl = sales.reduce(
    (total, sale) =>
      total + Number(sale.sale_price_brl || 0),
    0
  );

  const totalDiamonds = sales.reduce(
    (total, sale) =>
      total + Number(sale.sale_price_diamonds || 0),
    0
  );

  const money = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const date = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR");

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>Carregando seu perfil...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={pageStyle}>
        <div style={panelStyle}>
          <h1 style={{ color: "#d6ad55" }}>CAM STORE</h1>
          <h2>Entrar no perfil do vendedor</h2>

          <form onSubmit={login}>
            <label>E-mail</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button style={buttonStyle} disabled={busy}>
              {busy ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {message && <p>{message}</p>}

          <p>
            <a href="/" style={{ color: "#d6ad55" }}>
              Voltar para a loja
            </a>
          </p>
        </div>
      </main>
    );
  }

  if (profile.status !== "approved") {
    return (
      <main style={pageStyle}>
        <div style={panelStyle}>
          <h2>Perfil não aprovado</h2>
          <p>
            Seu cadastro ainda não está aprovado para vender
            na CAM Store.
          </p>
          <button style={buttonStyle} onClick={logout}>
            Sair da conta
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: "1050px", margin: "auto" }}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ color: "#d6ad55", margin: 0 }}>
              CAM STORE
            </h1>
            <p style={{ color: "#aab4c8" }}>
              Painel do vendedor
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={logout}
          >
            Sair
          </button>
        </header>

        <div style={panelStyle}>
          <h2>Olá, {profile.display_name}!</h2>
          <p style={{ color: "#aab4c8" }}>
            Gerencie seu perfil, anúncios e vendas.
          </p>

          <nav style={navStyle}>
            {[
              ["inicio", "Visão geral"],
              ["perfil", "Meu perfil"],
              ["anuncios", "Meus anúncios"],
              ["vendas", "Minhas vendas"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSection(value)}
                style={{
                  ...buttonStyle,
                  background:
                    section === value ? "#d6ad55" : "#263247",
                  color:
                    section === value ? "#111827" : "#ffffff",
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {message && (
            <p style={{ color: "#d6ad55", marginTop: "18px" }}>
              {message}
            </p>
          )}

          {section === "inicio" && (
            <section>
              <h2>Resumo das vendas</h2>

              <div style={statsGrid}>
                <div style={statStyle}>
                  <small>Produtos vendidos</small>
                  <h2>{sales.length}</h2>
                </div>

                <div style={statStyle}>
                  <small>Total em reais</small>
                  <h2>{money(totalBrl)}</h2>
                </div>

                <div style={statStyle}>
                  <small>Total em diamantes</small>
                  <h2>
                    {totalDiamonds.toLocaleString("pt-BR")}
                  </h2>
                </div>

                <div style={statStyle}>
                  <small>Anúncios ativos</small>
                  <h2>{activeProducts.length}</h2>
                </div>
              </div>

              <h2>Atalhos</h2>

              <div style={navStyle}>
                <button
                  style={buttonStyle}
                  onClick={() => setSection("perfil")}
                >
                  Editar perfil
                </button>

                <button
                  style={buttonStyle}
                  onClick={() => setSection("anuncios")}
                >
                  Ver meus anúncios
                </button>

                <button
                  style={buttonStyle}
                  onClick={() => setSection("vendas")}
                >
                  Ver histórico de vendas
                </button>
              </div>
            </section>
          )}

          {section === "perfil" && (
            <section>
              <h2>Meu perfil</h2>

              <form onSubmit={saveProfile}>
                <label>Nome do vendedor</label>
                <input
                  style={inputStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />

                <label>Link do WhatsApp</label>
                <input
                  style={inputStyle}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="https://wa.me/5511999999999"
                  required
                />

                <button style={buttonStyle} disabled={busy}>
                  {busy ? "Salvando..." : "Salvar alterações"}
                </button>
              </form>
            </section>
          )}

          {section === "anuncios" && (
            <section>
              <h2>Meus anúncios</h2>

              <p>
                <strong>{activeProducts.length}</strong> ativos
                {" · "}
                <strong>{soldProducts.length}</strong> vendidos
              </p>

              {products.length === 0 && (
                <p>Você ainda não possui anúncios.</p>
              )}

              {products.map((product) => (
                <article key={product.id} style={itemStyle}>
                  <div style={productRowStyle}>
                    <a
                      href={`/produto/${product.id}`}
                      style={{ display: "block", flexShrink: 0 }}
                      aria-label={`Ver anúncio ${product.title}`}
                    >
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          style={imageStyle}
                        />
                      ) : (
                        <div style={imagePlaceholderStyle}>
                          Sem foto
                        </div>
                      )}
                    </a>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ marginTop: 0 }}>
                        <a
                          href={`/produto/${product.id}`}
                          style={productTitleLinkStyle}
                        >
                          {product.title}
                        </a>
                      </h3>

                      <p style={{ color: "#aab4c8" }}>
                        Categoria: {product.category}
                      </p>

                      {product.price_brl !== null && (
                        <p>
                          {money(Number(product.price_brl))}
                        </p>
                      )}

                      {product.price_diamonds !== null && (
                        <p>
                          {Number(product.price_diamonds).toLocaleString("pt-BR")}
                          {" diamantes"}
                        </p>
                      )}

                      <p>
                        Estoque: {product.stock}
                      </p>

                      <p>
                        Status:{" "}
                        {product.status === "active"
                          ? "Ativo"
                          : product.status === "sold"
                          ? "Vendido"
                          : product.status}
                      </p>

                      <div style={actionButtonsStyle}>
                        <a
                          href={`/produto/${product.id}`}
                          style={linkButtonStyle}
                        >
                          Ver anúncio
                        </a>

                        <a
                          href="/vendedor"
                          style={secondaryLinkButtonStyle}
                        >
                          Editar anúncio
                        </a>

                        {product.status === "active" && (
                          <button
                            style={buttonStyle}
                            disabled={busy}
                            onClick={() => openSaleOptions(product)}
                          >
                            Marcar como vendido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          {section === "vendas" && (
            <section>
              <h2>Histórico de vendas</h2>

              <div style={statsGrid}>
                <div style={statStyle}>
                  <small>Quantidade</small>
                  <h2>{sales.length}</h2>
                </div>

                <div style={statStyle}>
                  <small>Total em reais</small>
                  <h2>{money(totalBrl)}</h2>
                </div>

                <div style={statStyle}>
                  <small>Total em diamantes</small>
                  <h2>
                    {totalDiamonds.toLocaleString("pt-BR")}
                  </h2>
                </div>
              </div>

              {sales.length === 0 && (
                <p>Você ainda não possui vendas registradas.</p>
              )}

              {sales.map((sale) => (
                <article key={sale.id} style={itemStyle}>
                  <h3>{sale.product_title}</h3>

                  {sale.sale_price_brl !== null && (
                    <p>
                      Vendido por: {money(Number(sale.sale_price_brl))}
                    </p>
                  )}

                  {sale.sale_price_diamonds !== null && (
                    <p>
                      Vendido por:{" "}
                      {Number(sale.sale_price_diamonds).toLocaleString("pt-BR")}
                      {" diamantes"}
                    </p>
                  )}

                  <small style={{ color: "#aab4c8" }}>
                    Vendido em: {date(sale.sold_at)}
                  </small>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>

      {saleProduct && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ marginTop: 0 }}>
              Registrar venda
            </h2>

            <p>
              Anúncio: <strong>{saleProduct.title}</strong>
            </p>

            <p>Por qual modalidade este produto foi vendido?</p>

            {saleProduct.price_brl !== null && (
              <label style={choiceStyle}>
                <input
                  type="radio"
                  name="saleType"
                  value="brl"
                  checked={saleType === "brl"}
                  onChange={() => setSaleType("brl")}
                />
                <span>
                  Reais — {money(Number(saleProduct.price_brl))}
                </span>
              </label>
            )}

            {saleProduct.price_diamonds !== null && (
              <label style={choiceStyle}>
                <input
                  type="radio"
                  name="saleType"
                  value="diamonds"
                  checked={saleType === "diamonds"}
                  onChange={() => setSaleType("diamonds")}
                />
                <span>
                  Diamantes —{" "}
                  {Number(saleProduct.price_diamonds).toLocaleString("pt-BR")}
                </span>
              </label>
            )}

            <p style={{ color: "#aab4c8", fontSize: "13px" }}>
              Somente a modalidade escolhida será registrada no histórico.
            </p>

            <div style={actionButtonsStyle}>
              <button
                style={buttonStyle}
                disabled={busy}
                onClick={confirmSale}
              >
                {busy ? "Registrando..." : "Confirmar venda"}
              </button>

              <button
                style={secondaryButtonStyle}
                disabled={busy}
                onClick={() => setSaleProduct(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#080d18",
  color: "#ffffff",
  padding: "20px",
};

const panelStyle = {
  background: "#151e2e",
  border: "1px solid #29364d",
  borderRadius: "14px",
  padding: "22px",
  marginTop: "20px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const navStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "10px",
  marginTop: "20px",
  marginBottom: "25px",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginTop: "20px",
  marginBottom: "25px",
};

const statStyle = {
  background: "#202c40",
  borderRadius: "10px",
  padding: "17px",
  overflowWrap: "anywhere" as const,
};

const itemStyle = {
  background: "#202c40",
  borderRadius: "10px",
  padding: "16px",
  marginTop: "14px",
};

const imageStyle = {
  width: "105px",
  height: "105px",
  objectFit: "cover" as const,
  borderRadius: "8px",
};

const imagePlaceholderStyle = {
  ...imageStyle,
  background: "#111827",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#aab4c8",
  fontSize: "12px",
};

const productRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "14px",
};

const productTitleLinkStyle = {
  color: "#ffffff",
  textDecoration: "none",
};

const actionButtonsStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "9px",
  marginTop: "14px",
};

const linkButtonStyle = {
  ...buttonStyle,
  display: "inline-block",
  textDecoration: "none",
  textAlign: "center" as const,
};

const secondaryLinkButtonStyle = {
  ...secondaryButtonStyle,
  display: "inline-block",
  textDecoration: "none",
  textAlign: "center" as const,
};

const modalOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.78)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "18px",
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: "440px",
  background: "#151e2e",
  border: "1px solid #39445b",
  borderRadius: "14px",
  padding: "22px",
  color: "#ffffff",
};

const choiceStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "#202c40",
  padding: "14px",
  borderRadius: "9px",
  marginTop: "10px",
  marginBottom: "10px",
  cursor: "pointer",
};
