
const categories = [
  { name: "Diamantes", icon: "💎", description: "Pacotes e quantidades personalizadas" },
  { name: "Pokémon", icon: "⚡", description: "Pokémon para sua equipe" },
  { name: "Itens", icon: "🎒", description: "Itens e recursos para jogos" },
  { name: "Contas", icon: "🎮", description: "Contas de diferentes jogos" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-700 bg-slate-950 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-xl font-black tracking-widest">
            <span className="mr-2 text-3xl text-amber-400">♛</span>
            CAM <span className="text-amber-400">STORE</span>
          </a>
          <a href="#vender" className="rounded-lg border border-amber-400 px-4 py-2 text-sm text-amber-300">
            Área do vendedor
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.3em] text-amber-300">
            Marketplace gamer
          </p>
          <h1 className="max-w-3xl text-5xl font-black md:text-6xl">
            Tudo para sua próxima <span className="text-amber-300">conquista</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Diamantes, Pokémon, itens e contas anunciados por vendedores independentes.
          </p>
          <a href="#categorias" className="mt-8 inline-block rounded-lg bg-amber-400 px-6 py-3 font-bold text-slate-950">
            Explorar categorias
          </a>
        </div>
      </section>

      <section id="categorias" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-7 text-3xl font-black">Categorias</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <article key={category.name} className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <div className="text-4xl">{category.icon}</div>
              <h3 className="mt-4 text-xl font-bold">{category.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black">Produtos em destaque</h2>
          <p className="mt-2 text-slate-400">
            Em breve, anúncios reais dos nossos vendedores.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Diamantes", "Pokémon", "Itens"].map((item, index) => (
              <article key={item} className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <div className="text-5xl">{["💎", "⚡", "🎒"][index]}</div>
                <h3 className="mt-4 font-bold">{item}</h3>
                <p className="mt-2 text-sm text-cyan-300">Consulte o vendedor</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="vender" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-black">Venda na CAM Store</h2>
        <p className="mt-2 text-slate-400">
          Em breve, você poderá solicitar seu cadastro como vendedor.
        </p>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-xs text-slate-500">
        © 2026 CAM Store — Marketplace independente.
      </footer>
    </main>
  );
                }
