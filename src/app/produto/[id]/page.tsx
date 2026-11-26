
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Product = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  description: string | null;
  price_brl: number | null;
  price_diamonds: number | null;
  stock: number;
  images: string[];
  status: string;
  sold_at: string | null;
};

type Seller = {
  display_name: string;
  whatsapp_url: string | null;
  avatar_url: string | null;
};

export default function ProdutoPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [photo, setPhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError("");

      const { data: productData, error: productError } =
        await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

      if (productError || !productData) {
        setError("Anúncio não encontrado ou indisponível.");
        setLoading(false);
        return;
      }

      setProduct(productData as Product);

      const { data: sellerData } = await supabase
        .from("seller_profiles")
        .select("display_name, whatsapp_url, avatar_url")
        .eq("id", productData.seller_id)
        .maybeSingle();

      if (sellerData) {
        setSeller(sellerData as Seller);
      }

      setLoading(false);
    }

    if (id) loadProduct();
  }, [id]);

  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const whatsappLink = (value: string | null) => {
    if (!value) return "";

    const trimmed = value.trim();

    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const number = trimmed.replace(/\D/g, "");
    if (number.length >= 10) {
      return `https://wa.me/${number.startsWith("55") ? number : `55${number}`}`;
    }

    return "";
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={styles.message}>Carregando anúncio...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main style={styles.page}>
        <h2 style={styles.title}>Anúncio indisponível</h2>
        <p style={styles.muted}>{error}</p>
        <Link href="/" style={styles.back}>Voltar à loja</Link>
      </main>
    );
  }

  const images = product.images || [];
  const sold = product.status === "sold";
  const contact = whatsappLink(seller?.whatsapp_url || null);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <Link href="/" style={styles.logo}>👑 CAM STORE</Link>
        <Link href="/" style={styles.back}>Voltar à loja</Link>
      </header>

      <div style={styles.container}>
        <section style={styles.gallery}>
          <div style={styles.mainImage}>
            {images.length > 0 ? (
              <img
                src={images[photo]}
                alt={product.title}
                style={styles.image}
              />
            ) : (
              <div style={styles.noImage}>Sem imagem disponível</div>
            )}

            {sold && <span style={styles.sold}>VENDIDO</span>}
          </div>

          {images.length > 1 && (
            <div style={styles.thumbnails}>
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setPhoto(index)}
                  style={{
                    ...styles.thumbButton,
                    borderColor: photo === index ? "#00d9ff" : "#26364a",
                  }}
                >
                  <img src={img} alt={`Foto ${index + 1}`} style={styles.thumb} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section style={styles.details}>
          <span style={styles.category}>{product.category}</span>

          <h1 style={styles.title}>{product.title}</h1>

          <div style={styles.prices}>
            {product.price_brl !== null && (
              <p style={styles.price}>{money(product.price_brl)}</p>
            )}

            {product.price_diamonds !== null && (
              <p style={styles.diamondPrice}>
                💎 {product.price_diamonds.toLocaleString("pt-BR")} diamantes
              </p>
            )}
          </div>

          <div style={styles.separator} />

          <h3 style={styles.subtitle}>Descrição</h3>
          <p style={styles.description}>
            {product.description || "O vendedor não adicionou uma descrição."}
          </p>

          <p style={styles.stock}>
            {sold ? "Produto vendido" : `Estoque: ${product.stock}`}
          </p>

          <div style={styles.sellerBox}>
            <h3 style={styles.subtitle}>Vendedor</h3>

            <div style={styles.sellerInfo}>
              {seller?.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt="Foto do vendedor"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>👤</div>
              )}

              <strong>{seller?.display_name || "Vendedor"}</strong>
            </div>
          </div>

          {sold ? (
            <button disabled style={styles.disabledButton}>
              Produto vendido
            </button>
          ) : contact ? (
            <a
              href={contact}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsapp}
            >
              Conversar com vendedor pelo WhatsApp
            </a>
          ) : (
            <p style={styles.muted}>
              O vendedor ainda não cadastrou um link de WhatsApp.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#080d18",
    color: "#f5f7fa",
    padding: "20px",
  },
  header: {
    maxWidth: "1100px",
    margin: "0 auto 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    color: "#e5bd55",
    fontWeight: 900,
    fontSize: "22px",
    textDecoration: "none",
  },
  back: {
    color: "#00d9ff",
    textDecoration: "none",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "35px",
  },
  gallery: {
    minWidth: 0,
  },
  mainImage: {
    position: "relative",
    width: "100%",
    minHeight: "280px",
    aspectRatio: "1 / 1",
    background: "#111c2d",
    border: "1px solid #26364a",
    borderRadius: "16px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    position: "absolute",
    inset: 0,
  },
  noImage: {
    height: "100%",
    minHeight: "280px",
    display: "grid",
    placeItems: "center",
    color: "#8291a7",
  },
  sold: {
    position: "absolute",
    top: "15px",
    left: "15px",
    background: "#dc2626",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: 900,
  },
  thumbnails: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
    flexWrap: "wrap",
  },
  thumbButton: {
    width: "75px",
    height: "75px",
    padding: "3px",
    border: "2px solid",
    borderRadius: "9px",
    background: "#111c2d",
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  details: {
    background: "#111827",
    border: "1px solid #26364a",
    borderRadius: "16px",
    padding: "24px",
    alignSelf: "start",
  },
  category: {
    color: "#00d9ff",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 800,
  },
  title: {
    fontSize: "28px",
    margin: "12px 0",
    overflowWrap: "anywhere",
  },
  prices: {
    marginTop: "20px",
  },
  price: {
    color: "#e5bd55",
    fontSize: "25px",
    fontWeight: 900,
    margin: "5px 0",
  },
  diamondPrice: {
    color: "#00d9ff",
    fontSize: "19px",
    fontWeight: 800,
    margin: "8px 0",
  },
  separator: {
    height: "1px",
    background: "#26364a",
    margin: "22px 0",
  },
  subtitle: {
    fontSize: "17px",
    marginBottom: "12px",
  },
  description: {
    color: "#c1ccda",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  stock: {
    color: "#9aa9bd",
    marginTop: "20px",
  },
  sellerBox: {
    borderTop: "1px solid #26364a",
    marginTop: "25px",
    paddingTop: "20px",
  },
  sellerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#26364a",
    display: "grid",
    placeItems: "center",
  },
  whatsapp: {
    display: "block",
    textAlign: "center",
    background: "#16a34a",
    color: "#fff",
    padding: "15px",
    borderRadius: "10px",
    fontWeight: 900,
    textDecoration: "none",
    marginTop: "25px",
  },
  disabledButton: {
    width: "100%",
    background: "#374151",
    color: "#aaa",
    border: 0,
    padding: "15px",
    borderRadius: "10px",
    marginTop: "25px",
    fontWeight: 900,
  },
  muted: {
    color: "#9aa9bd",
    marginTop: "20px",
  },
  message: {
    textAlign: "center",
    marginTop: "80px",
  },
};
        
