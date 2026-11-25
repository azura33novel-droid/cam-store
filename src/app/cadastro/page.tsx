
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");
    setCarregando(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          display_name: nome,
          whatsapp: whatsapp,
        },
      },
    });

    setCarregando(false);

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem(
      "Cadastro realizado! Confira seu e-mail para confirmar a conta. Seu perfil ficará pendente até a aprovação da administração."
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080d18",
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "24px"
    }}>
      <form onSubmit={cadastrar} style={{
        width: "100%",
        maxWidth: "430px",
        background: "#111a2b",
        padding: "30px",
        borderRadius: "16px",
        border: "1px solid #b99445"
      }}>
        <h1 style={{ color: "#e7bd63", textAlign: "center" }}>
          CAM STORE
        </h1>

        <h2 style={{ textAlign: "center" }}>
          Cadastro de vendedor
        </h2>

        <p style={{ color: "#aab4c5", textAlign: "center" }}>
          Crie sua conta para começar a vender.
        </p>

        {[
          { label: "Nome", value: nome, setter: setNome, type: "text" },
          { label: "WhatsApp com DDD", value: whatsapp, setter: setWhatsapp, type: "tel" },
          { label: "E-mail", value: email, setter: setEmail, type: "email" },
          { label: "Senha (mínimo 8 caracteres)", value: senha, setter: setSenha, type: "password" }
        ].map((campo) => (
          <label key={campo.label} style={{
            display: "block",
            marginTop: "18px",
            color: "#e7bd63"
          }}>
            {campo.label}
            <input
              type={campo.type}
              value={campo.value}
              onChange={(e) => campo.setter(e.target.value)}
              required
              minLength={campo.type === "password" ? 8 : undefined}
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                marginTop: "7px",
                padding: "13px",
                borderRadius: "8px",
                border: "1px solid #35435a",
                background: "#080d18",
                color: "#fff"
              }}
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={carregando}
          style={{
            width: "100%",
            marginTop: "25px",
            padding: "14px",
            border: "none",
            borderRadius: "8px",
            background: "#d5aa50",
            color: "#101522",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          {carregando ? "Cadastrando..." : "Criar minha conta"}
        </button>

        {mensagem && (
          <p style={{
            marginTop: "18px",
            color: mensagem.includes("Cadastro realizado") ? "#45d69a" : "#ff7777",
            textAlign: "center"
          }}>
            {mensagem}
          </p>
        )}
      </form>
    </main>
  );
                                                 }
  
