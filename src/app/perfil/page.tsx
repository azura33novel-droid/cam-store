
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

const colors = {
  background: "#080d18",
  panel: "#111b2d",
  card: "#17243a",
  cardHover: "#1c2b43",
  border: "#263750",
  gold: "#e2bb67",
  cyan: "#45d6e8",
  green: "#27c98a",
  red: "#ff6577",
  text: "#f4f7fc",
  muted: "#98a9c2",
};

const buttonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 17px",
  background: colors.gold,
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "13px",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#263750",
  color: colors.text,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  background: "#0b1424",
  color: colors.text,
  marginTop: "8px",
  marginBottom: "18px",
  outline: "none",
  fontSize: "14px",
};

const panelStyle = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: "18px",
  padding: "22px",
  marginTop: "20px",
};

const itemStyle = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: "15px",
  padding: "17px",
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
      setProducts([]);
      setSales([]);
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
    setSection("inicio");
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

  function changeSection(value: string) {
    setMessage("");
    setSection(value);
  }

  const menuItems = [
    { id: "inicio", icon: "⌂", label: "Visão geral" },
    { id: "perfil", icon: "◉", label: "Meu perfil" },
    { id: "anuncios", icon: "▣", label: "Meus anúncios" },
    { id: "vendas", icon: "▤", label: "Minhas vendas" },
  ];

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          <div style={loadingLogo}>CAM</div>
          <h2>Carregando painel...</h2>
          <p style={{ color: colors.muted }}>
            Preparando sua área de vendedor.
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={pageStyle}>
        <div style={loginWrapper}>
          <div style={loginCard}>
            <div style={brandMark}>CAM STORE</div>
            <div style={loginIcon}>♛</div>
            <h1 style={{ marginBottom: "8px" }}>
              Área do vendedor
            </h1>
            <p style={{ color: colors.muted, marginTop: 0 }}>
              Entre na sua conta para gerenciar sua loja.
            </p>

            <form onSubmit={login}>
              <label style={labelStyle}>E-mail</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                required
              />

              <label style={labelStyle}>Senha</label>
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />

              <button
                style={{ ...buttonStyle, width: "100%", padding: "15px" }}
                disabled={busy}
              >
                {busy ? "Entrando..." : "Entrar no painel"}
              </button>
            </form>

            {message && (
              <p style={errorMessage}>{message}</p>
            )}

            <a href="/" style={backLink}>
              ← Voltar para a loja
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (profile.status !== "approved") {
    return (
      <main style={pageStyle}>
        <div style={loginWrapper}>
          <div style={loginCard}>
            <div style={brandMark}>CAM STORE</div>
            <h2>Cadastro aguardando aprovação</h2>
            <p style={{ color: colors.muted }}>
              Seu perfil ainda não está aprovado para vender
              na CAM Store.
            </p>
            <button style={buttonStyle} onClick={logout}>
              Sair da conta
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={dashboard}>
        <header style={topHeader}>
          <a href="/" style={brandLink}>
            <span style={crown}>♛</span>
            <span>
              <strong>CAM STORE</strong>
              <small>PAINEL DO VENDEDOR</small>
            </span>
          </a>

          <div style={headerActions}>
            <a href="/" style={storeButton}>
              ↗ Ver loja
            </a>
            <button style={logoutButton} onClick={logout}>
              Sair da conta
            </button>
          </div>
        </header>

        <section style={welcomeSection}>
          <div>
            <span style={eyebrow}>CENTRAL DO VENDEDOR</span>
            <h1 style={welcomeTitle}>
              Olá, <span style={{ color: colors.gold }}>
                {profile.display_name}
              </span>
            </h1>
            <p style={{ color: colors.muted, marginBottom: 0 }}>
              Gerencie seus anúncios e acompanhe o desempenho da sua loja.
            </p>
          </div>

          <div style={approvedBadge}>
            <span style={onlineDot} />
            Vendedor aprovado
          </div>
        </section>

        <nav style={navigation}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => changeSection(item.id)}
              style={{
                ...navButton,
                ...(section === item.id ? navButtonActive : {}),
              }}
            >
              <span style={{ fontSize: "19px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {message && (
          <div style={noticeStyle}>
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              style={closeNotice}
            >
              ×
            </button>
          </div>
        )}

        {section === "inicio" && (
          <>
            <section style={sectionHeading}>
              <div>
                <span style={eyebrow}>DESEMPENHO</span>
                <h2 style={sectionTitle}>Visão geral</h2>
                <p style={subtitle}>
                  Acompanhe os números da sua loja.
                </p>
              </div>
              <button
                style={refreshButton}
                onClick={loadData}
                disabled={busy}
              >
                ↻ Atualizar dados
              </button>
            </section>

            <div style={statsGrid}>
              <div style={statCard}>
                <div style={statTop}>
                  <span>Vendas realizadas</span>
                  <span style={statIcon}>▤</span>
                </div>
                <strong style={statNumber}>{sales.length}</strong>
                <small style={statDescription}>
                  Produtos vendidos
                </small>
              </div>

              <div style={statCard}>
                <div style={statTop}>
                  <span>Faturamento em reais</span>
                  <span style={statIcon}>R$</span>
                </div>
                <strong style={{ ...statNumber, color: colors.green }}>
                  {money(totalBrl)}
                </strong>
                <small style={statDescription}>
                  Vendas registradas em reais
                </small>
              </div>

              <div style={statCard}>
                <div style={statTop}>
                  <span>Vendas em diamantes</span>
                  <span style={statIcon}>◆</span>
                </div>
                <strong style={{ ...statNumber, color: colors.cyan }}>
                  {totalDiamonds.toLocaleString("pt-BR")}
                </strong>
                <small style={statDescription}>
                  Diamantes vendidos
                </small>
              </div>

              <div style={statCard}>
                <div style={statTop}>
                  <span>Anúncios ativos</span>
                  <span style={statIcon}>▣</span>
                </div>
                <strong style={statNumber}>
                  {activeProducts.length}
                </strong>
                <small style={statDescription}>
                  {soldProducts.length} vendidos
                </small>
              </div>
            </div>

            <section style={panelStyle}>
              <div style={panelHeading}>
                <div>
                  <h2 style={panelTitle}>Acesso rápido</h2>
                  <p style={subtitle}>
                    Escolha o que deseja gerenciar.
                  </p>
                </div>
              </div>

              <div style={quickGrid}>
                <button
                  style={quickCard}
                  onClick={() => changeSection("perfil")}
                >
                  <span style={quickIcon}>◉</span>
                  <strong>Meu perfil</strong>
                  <small>Editar nome e WhatsApp</small>
                  <span style={quickArrow}>→</span>
                </button>

                <button
                  style={quickCard}
                  onClick={() => changeSection("anuncios")}
                >
                  <span style={quickIcon}>▣</span>
                  <strong>Meus anúncios</strong>
                  <small>Gerenciar seus produtos</small>
                  <span style={quickArrow}>→</span>
                </button>

                <button
                  style={quickCard}
                  onClick={() => changeSection("vendas")}
                >
                  <span style={quickIcon}>▤</span>
                  <strong>Minhas vendas</strong>
                  <small>Consultar seu histórico</small>
                  <span style={quickArrow}>→</span>
                </button>
              </div>
            </section>

            <section style={panelStyle}>
              <div style={panelHeading}>
                <div>
                  <h2 style={panelTitle}>Últimas vendas</h2>
                  <p style={subtitle}>
                    Suas vendas mais recentes.
                  </p>
                </div>
                <button
                  style={textButton}
                  onClick={() => changeSection("vendas")}
                >
                  Ver todas →
                </button>
              </div>

              {sales.length === 0 ? (
                <p style={emptyText}>
                  Nenhuma venda registrada até o momento.
                </p>
              ) : (
                sales.slice(0, 4).map((sale) => (
                  <div key={sale.id} style={saleRow}>
                    <div style={saleSymbol}>✓</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{sale.product_title}</strong>
                      <small style={mutedBlock}>
                        {date(sale.sold_at)}
                      </small>
                    </div>
                    <strong style={{ color: colors.green }}>
                      {sale.sale_price_brl !== null
                        ? money(Number(sale.sale_price_brl))
                        : `${Number(sale.sale_price_diamonds).toLocaleString("pt-BR")} diamantes`}
                    </strong>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {section === "perfil" && (
          <section style={panelStyle}>
            <span style={eyebrow}>CONFIGURAÇÕES DA CONTA</span>
            <h2 style={sectionTitle}>Meu perfil</h2>
            <p style={subtitle}>
              Atualize as informações que os compradores verão na sua loja.
            </p>

            <form onSubmit={saveProfile} style={profileForm}>
              <div style={profileAvatar}>
                {profile.display_name.slice(0, 1).toUpperCase()}
              </div>

              <label style={labelStyle}>Nome do vendedor</label>
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                placeholder="Nome da sua loja ou perfil"
              />

              <label style={labelStyle}>Link do WhatsApp</label>
              <input
                style={inputStyle}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="https://wa.me/5511999999999"
                required
              />

              <p style={helperText}>
                Esse contato será utilizado pelos compradores para falar diretamente com você.
              </p>

              <button
                style={buttonStyle}
                disabled={busy}
              >
                {busy ? "Salvando..." : "✓ Salvar alterações"}
              </button>
            </form>
          </section>
        )}

        {section === "anuncios" && (
          <>
            <section style={sectionHeading}>
              <div>
                <span style={eyebrow}>GERENCIAMENTO</span>
                <h2 style={sectionTitle}>Meus anúncios</h2>
                <p style={subtitle}>
                  Gerencie seus produtos publicados na CAM Store.
                </p>
              </div>

              <a href="/vendedor" style={buttonLink}>
                + Gerenciar anúncios
              </a>
            </section>

            <div style={miniStats}>
              <div style={miniStat}>
                <strong>{products.length}</strong>
                <small>Total de anúncios</small>
              </div>
              <div style={miniStat}>
                <strong style={{ color: colors.green }}>
                  {activeProducts.length}
                </strong>
                <small>Ativos</small>
              </div>
              <div style={miniStat}>
                <strong style={{ color: colors.gold }}>
                  {soldProducts.length}
                </strong>
                <small>Vendidos</small>
              </div>
            </div>

            {products.length === 0 ? (
              <div style={emptyCard}>
                <span style={emptyIcon}>▣</span>
                <h3>Você ainda não possui anúncios</h3>
                <p style={subtitle}>
                  Comece adicionando seu primeiro produto à CAM Store.
       </p>
                <a href="/vendedor" style={buttonLink}>
                  Criar anúncio
                </a>
              </div>
            ) : (
              <div style={productsGrid}>
                {products.map((product) => (
                  <article key={product.id} style={productCard}>
                    <a
                      href={`/produto/${product.id}`}
                      style={productImageLink}
                    >
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          style={productImage}
                        />
                      ) : (
                        <div style={productPlaceholder}>
                          <span>▣</span>
                          <small>Sem foto</small>
                        </div>
                      )}

                      <span
                        style={{
                          ...statusBadge,
                          background:
                            product.status === "active"
                              ? "rgba(39,201,138,0.16)"
                              : product.status === "sold"
                              ? "rgba(226,187,103,0.16)"
                              : "rgba(152,169,194,0.16)",
                          color:
                            product.status === "active"
                              ? colors.green
                              : product.status === "sold"
                              ? colors.gold
                              : colors.muted,
                        }}
                      >
                        {product.status === "active"
                          ? "● Ativo"
                          : product.status === "sold"
                          ? "✓ Vendido"
                          : product.status}
                      </span>
                    </a>

                    <div style={productContent}>
                      <small style={categoryLabel}>
                        {product.category}
                      </small>

                      <h3 style={productName}>
                        {product.title}
                      </h3>

                      <div style={productPrices}>
                        {product.price_brl !== null && (
                          <strong>
                            {money(Number(product.price_brl))}
                          </strong>
                        )}

                        {product.price_brl !== null &&
                          product.price_diamonds !== null && (
                            <small style={{ color: colors.gold }}>
                              OU
                            </small>
                          )}

                        {product.price_diamonds !== null && (
                          <strong style={{ color: colors.cyan }}>
                            {Number(product.price_diamonds).toLocaleString("pt-BR")} ◆
                          </strong>
                        )}
                      </div>

                      <small style={stockLabel}>
                        Estoque: {product.stock}
                      </small>

                      <div style={productActions}>
                        <a
                          href={`/produto/${product.id}`}
                          style={viewProductButton}
                        >
                          Ver anúncio
                        </a>

                        <a
                          href={`/vendedor?editar=${encodeURIComponent(product.id)}`}
                          style={editProductButton}
                        >
                          ✎ Editar
                        </a>
                      </div>

                      {product.status === "active" && (
                        <button
                          style={soldButton}
                          disabled={busy}
                          onClick={() => openSaleOptions(product)}
                        >
                          ✓ Marcar como vendido
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {section === "vendas" && (
          <>
            <section style={sectionHeading}>
              <div>
                <span style={eyebrow}>DESEMPENHO FINANCEIRO</span>
                <h2 style={sectionTitle}>Minhas vendas</h2>
                <p style={subtitle}>
                  Consulte todas as vendas registradas na sua conta.
                </p>
              </div>
            </section>

            <div style={statsGrid}>
              <div style={statCard}>
                <div style={statTop}>
                  <span>Quantidade vendida</span>
                  <span style={statIcon}>▤</span>
                </div>
                <strong style={statNumber}>{sales.length}</strong>
              </div>

              <div style={statCard}>
                <div style={statTop}>
                  <span>Total em reais</span>
                  <span style={statIcon}>R$</span>
                </div>
                <strong style={{ ...statNumber, color: colors.green }}>
                  {money(totalBrl)}
                </strong>
              </div>

              <div style={statCard}>
                <div style={statTop}>
                  <span>Total em diamantes</span>
                  <span style={statIcon}>◆</span>
                </div>
                <strong style={{ ...statNumber, color: colors.cyan }}>
                  {totalDiamonds.toLocaleString("pt-BR")}
                </strong>
              </div>
            </div>

            <section style={panelStyle}>
              <h2 style={panelTitle}>Histórico completo</h2>

              {sales.length === 0 ? (
                <div style={emptyCard}>
                  <span style={emptyIcon}>▤</span>
                  <h3>Nenhuma venda registrada</h3>
                  <p style={subtitle}>
                    Quando você registrar uma venda, ela aparecerá aqui.
                  </p>
                </div>
              ) : (
                sales.map((sale) => (
                  <article key={sale.id} style={historyCard}>
                    <div style={historyIcon}>✓</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block" }}>
                        {sale.product_title}
                      </strong>
                      <small style={mutedBlock}>
                        Vendido em {date(sale.sold_at)}
                      </small>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {sale.sale_price_brl !== null && (
                        <strong style={{ color: colors.green }}>
                          {money(Number(sale.sale_price_brl))}
                        </strong>
                      )}

                      {sale.sale_price_diamonds !== null && (
                        <strong style={{ color: colors.cyan }}>
                          {Number(sale.sale_price_diamonds).toLocaleString("pt-BR")} ◆
                        </strong>
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}

        <footer style={footerStyle}>
          <span>CAM STORE</span>
          <small>Central do vendedor</small>
        </footer>
      </div>

      {saleProduct && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalTop}>
              <div style={modalIcon}>✓</div>
              <button
                onClick={() => setSaleProduct(null)}
                style={modalClose}
                disabled={busy}
              >
                ×
              </button>
            </div>

            <span style={eyebrow}>FINALIZAR VENDA</span>
            <h2 style={{ margin: "8px 0" }}>
              Registrar venda
            </h2>

            <p style={{ color: colors.muted }}>
              Você está registrando a venda de:
            </p>

            <div style={selectedProduct}>
              <strong>{saleProduct.title}</strong>
            </div>

            <p style={{ fontWeight: 700 }}>
              Como este produto foi vendido?
            </p>

            {saleProduct.price_brl !== null && (
              <label
                style={{
                  ...choiceStyle,
                  borderColor:
                    saleType === "brl" ? colors.gold : colors.border,
                }}
              >
                <input
                  type="radio"
                  name="saleType"
                  value="brl"
                  checked={saleType === "brl"}
                  onChange={() => setSaleType("brl")}
                />
                <span>
                  <strong>Reais</strong>
                  <small>{money(Number(saleProduct.price_brl))}</small>
                </span>
              </label>
            )}

            {saleProduct.price_diamonds !== null && (
              <label
                style={{
                  ...choiceStyle,
                  borderColor:
                    saleType === "diamonds" ? colors.cyan : colors.border,
                }}
              >
                <input
                  type="radio"
                  name="saleType"
                  value="diamonds"
                  checked={saleType === "diamonds"}
                  onChange={() => setSaleType("diamonds")}
                />
                <span>
                  <strong>Diamantes</strong>
                  <small>
                    {Number(saleProduct.price_diamonds).toLocaleString("pt-BR")} ◆
                  </small>
                </span>
              </label>
            )}

            <p style={helperText}>
              Somente a modalidade escolhida será registrada no histórico.
            </p>

            <div style={modalActions}>
              <button
                style={{ ...buttonStyle, flex: 1 }}
                disabled={busy}
                onClick={confirmSale}
              >
                {busy ? "Registrando..." : "Confirmar venda"}
              </button>

              <button
                style={{ ...secondaryButtonStyle, flex: 1 }}
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
  background: colors.background,
  color: colors.text,
  padding: "0 18px 30px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const dashboard = {
  maxWidth: "1150px",
  margin: "auto",
};

const loadingStyle = {
  minHeight: "85vh",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
};

const loadingLogo = {
  color: colors.gold,
  fontSize: "38px",
  fontWeight: 900,
  letterSpacing: "5px",
};

const loginWrapper = {
  minHeight: "90vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const loginCard = {
  width: "100%",
  maxWidth: "420px",
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: "20px",
  padding: "30px",
  boxSizing: "border-box" as const,
};

const brandMark = {
  color: colors.gold,
  fontWeight: 900,
  letterSpacing: "3px",
  fontSize: "19px",
  marginBottom: "28px",
};

const loginIcon = {
  width: "55px",
  height: "55px",
  borderRadius: "15px",
  background: "rgba(226,187,103,0.12)",
  color: colors.gold,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#d5deeb",
};

const errorMessage = {
  color: colors.red,
  fontSize: "13px",
};

const backLink = {
  display: "block",
  marginTop: "24px",
  color: colors.gold,
  textDecoration: "none",
  fontSize: "13px",
};

const topHeader = {
  minHeight: "82px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap" as const,
  borderBottom: `1px solid ${colors.border}`,
};

const brandLink = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  color: colors.text,
  textDecoration: "none",
};

const crown = {
  color: colors.gold,
  fontSize: "31px",
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  flexWrap: "wrap" as const,
};

const storeButton = {
  color: colors.cyan,
  border: `1px solid ${colors.border}`,
  borderRadius: "9px",
  padding: "10px 13px",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 700,
};

const logoutButton = {
  ...secondaryButtonStyle,
  padding: "10px 13px",
};

const welcomeSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "18px",
  padding: "32px 0 25px",
};

const eyebrow = {
  display: "block",
  color: colors.cyan,
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "2px",
  marginBottom: "8px",
};

const welcomeTitle = {
  fontSize: "clamp(25px, 5vw, 34px)",
  margin: "0 0 8px",
};

const approvedBadge = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(39,201,138,0.1)",
  color: colors.green,
  border: "1px solid rgba(39,201,138,0.25)",
  borderRadius: "30px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 700,
};

const onlineDot = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: colors.green,
};

const navigation = {
  display: "flex",
  gap: "8px",
  overflowX: "auto" as const,
  paddingBottom: "12px",
  borderBottom: `1px solid ${colors.border}`,
};

const navButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid transparent",
  background: "transparent",
  color: colors.muted,
  whiteSpace: "nowrap" as const,
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700,
};

const navButtonActive = {
  background: "rgba(226,187,103,0.12)",
  color: colors.gold,
  border: `1px solid rgba(226,187,103,0.28)`,
};

const noticeStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  background: "rgba(226,187,103,0.1)",
  border: "1px solid rgba(226,187,103,0.25)",
  color: colors.gold,
  padding: "13px 16px",
  borderRadius: "10px",
  marginTop: "18px",
  fontSize: "13px",
};

const closeNotice = {
  background: "transparent",
  color: colors.gold,
  border: "none",
  fontSize: "22px",
  cursor: "pointer",
};

const sectionHeading = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "15px",
  marginTop: "28px",
  marginBottom: "18px",
};

const sectionTitle = {
  fontSize: "25px",
  margin: "0 0 7px",
};

const subtitle = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: 1.6,
  margin: 0,
};

const refreshButton = {
  ...secondaryButtonStyle,
  border: `1px solid ${colors.border}`,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "13px",
  marginTop: "20px",
};

const statCard = {
  background: `linear-gradient(145deg, ${colors.card}, #111b2d)`,
  border: `1px solid ${colors.border}`,
  borderRadius: "15px",
  padding: "19px",
  minWidth: 0,
  overflowWrap: "anywhere" as const,
};

const statTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: colors.muted,
  fontSize: "12px",
  gap: "8px",
};

const statIcon = {
  color: colors.gold,
  fontSize: "17px",
  fontWeight: 900,
};

const statNumber = {
  display: "block",
  fontSize: "clamp(22px, 4vw, 29px)",
  marginTop: "18px",
  marginBottom: "8px",
  color: colors.text,
};

const statDescription = {
  color: colors.muted,
  fontSize: "11px",
};

const quickGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
  marginTop: "18px",
};

const quickCard = {
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
  gap: "9px",
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: "13px",
  padding: "18px",
  color: colors.text,
  textAlign: "left" as const,
  cursor: "pointer",
};

const quickIcon = {
  fontSize: "24px",
  color: colors.gold,
  marginBottom: "5px",
};

const quickArrow = {
  position: "absolute" as const,
  right: "17px",
  top: "18px",
  color: colors.cyan,
  fontSize: "20px",
};

const panelHeading = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const panelTitle = {
  fontSize: "19px",
  margin: "0 0 7px",
};

const textButton = {
  background: "transparent",
  border: "none",
  color: colors.gold,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "12px",
};

const emptyText = {
  color: colors.muted,
  padding: "18px 0",
  fontSize: "13px",
};

const saleRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  borderBottom: `1px solid ${colors.border}`,
  padding: "15px 0",
  fontSize: "13px",
};

const saleSymbol = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  background: "rgba(39,201,138,0.12)",
  color: colors.green,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
};

const mutedBlock = {
  display: "block",
  color: colors.muted,
  fontSize: "11px",
  marginTop: "5px",
};

const profileForm = {
  maxWidth: "550px",
  marginTop: "22px",
};

const profileAvatar = {
  width: "65px",
  height: "65px",
  borderRadius: "18px",
  background: "rgba(226,187,103,0.13)",
  border: `1px solid rgba(226,187,103,0.3)`,
  color: colors.gold,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "27px",
  fontWeight: 900,
  marginBottom: "24px",
};

const helperText = {
  color: colors.muted,
  fontSize: "12px",
  lineHeight: 1.6,
  marginTop: "-8px",
  marginBottom: "18px",
};

const miniStats = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const miniStat = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
  padding: "14px",
  borderRadius: "11px",
  background: colors.card,
  border: `1px solid ${colors.border}`,
};

const productsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
  gap: "15px",
};

const productCard = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: "15px",
  overflow: "hidden",
  minWidth: 0,
};

const productImageLink = {
  display: "block",
  position: "relative" as const,
  background: "#0b1424",
  height: "190px",
  textDecoration: "none",
};

const productImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
};

const productPlaceholder = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  color: colors.muted,
  fontSize: "30px",
};

const statusBadge = {
  position: "absolute" as const,
  top: "11px",
  right: "11px",
  padding: "7px 10px",
  borderRadius: "20px",
  fontSize: "10px",
  fontWeight: 900,
};

const productContent = {
  padding: "15px",
};

const categoryLabel = {
  color: colors.cyan,
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  fontSize: "10px",
  fontWeight: 800,
};

const productName = {
  fontSize: "16px",
  margin: "8px 0 13px",
  minHeight: "38px",
  overflowWrap: "anywhere" as const,
};

const productPrices = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  marginBottom: "12px",
};

const stockLabel = {
  color: colors.muted,
  fontSize: "11px",
};

const productActions = {
  display: "flex",
  gap: "8px",
  marginTop: "14px",
};

const viewProductButton = {
  flex: 1,
  textAlign: "center" as const,
  textDecoration: "none",
  background: "#263750",
  color: colors.text,
  padding: "11px 7px",
  borderRadius: "8px",
  fontSize: "11px",
  fontWeight: 700,
};

const editProductButton = {
  flex: 1,
  textAlign: "center" as const,
  textDecoration: "none",
  background: "rgba(226,187,103,0.13)",
  border: "1px solid rgba(226,187,103,0.28)",
  color: colors.gold,
  padding: "11px 7px",
  borderRadius: "8px",
  fontSize: "11px",
  fontWeight: 700,
};

const soldButton = {
  width: "100%",
  marginTop: "9px",
  padding: "11px",
  borderRadius: "8px",
  border: "1px solid rgba(39,201,138,0.3)",
  background: "rgba(39,201,138,0.1)",
  color: colors.green,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "11px",
};

const buttonLink = {
  display: "inline-block",
  background: colors.gold,
  color: "#111827",
  padding: "12px 16px",
  borderRadius: "9px",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
};

const emptyCard = {
  textAlign: "center" as const,
  padding: "45px 20px",
  background: colors.panel,
  border: `1px dashed ${colors.border}`,
  borderRadius: "15px",
};

const emptyIcon = {
  display: "block",
  fontSize: "35px",
  color: colors.gold,
  marginBottom: "15px",
};

const historyCard = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
  padding: "17px 0",
  borderBottom: `1px solid ${colors.border}`,
  fontSize: "13px",
};

const historyIcon = {
  width: "37px",
  height: "37px",
  flexShrink: 0,
  borderRadius: "11px",
  background: "rgba(39,201,138,0.12)",
  color: colors.green,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  borderTop: `1px solid ${colors.border}`,
  paddingTop: "22px",
  marginTop: "35px",
  color: colors.gold,
  fontWeight: 900,
  fontSize: "12px",
};

const modalOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.82)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "18px",
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: "440px",
  boxSizing: "border-box" as const,
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: "18px",
  padding: "23px",
  color: colors.text,
};

const modalTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "20px",
};

const modalIcon = {
  width: "43px",
  height: "43px",
  borderRadius: "12px",
  background: "rgba(39,201,138,0.12)",
  color: colors.green,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const modalClose = {
  background: "transparent",
  border: "none",
  color: colors.muted,
  fontSize: "27px",
  cursor: "pointer",
};

const selectedProduct = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: "10px",
  padding: "13px",
  margin: "15px 0",
};

const choiceStyle = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
  background: colors.card,
  border: `1px solid ${colors.border}`,
  padding: "14px",
  borderRadius: "10px",
  marginTop: "10px",
  cursor: "pointer",
};

const modalActions = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "10px",
  marginTop: "20px",
};
  
