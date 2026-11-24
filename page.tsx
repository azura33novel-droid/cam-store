const categories = [
  { name: "Diamantes", detail: "Pacotes e quantidades personalizadas", icon: "💎" },
  { name: "Pokémon", detail: "Encontre Pokémon para sua equipe", icon: "⚡" },
  { name: "Itens", detail: "Itens e recursos para o jogo", icon: "🎒" },
  { name: "Contas", detail: "Contas de diferentes jogos", icon: "🎮" },
];
const samples = [
  { title: "Pacote de diamantes", category: "Diamantes", price: "Consulte o vendedor", tag: "Destaque", icon: "💎" },
  { title: "Pokémon especial", category: "Pokémon", price: "Preço a definir", tag: "Novo", icon: "⚡" },
  { title: "Item de jogo", category: "Itens", price: "Preço a definir", tag: "Oferta", icon: "🎒" },
];
export default function Home() {
  return <main className="min-h-screen">
    <header className="border-b border-[#263247] bg-[#0b1322]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-3"><span className="text-3xl text-[#e9bd58]">♛</span><span className="text-xl font-black tracking-[.18em]">CAM <span className="text-[#e9bd58]">STORE</span></span></a>
        <nav className="hidden gap-6 text-sm text-slate-300 md:flex"><a href="#categorias">Categorias</a><a href="#destaques">Destaques</a><a href="#como-funciona">Como funciona</a></nav>
        <a href="#vendedores" className="rounded-lg border border-[#d6aa48] px-4 py-2 text-sm font-bold text-[#f2cf79]">Área do vendedor</a>
      </div>
    </header>
    <section className="relative overflow-hidden border-b border-[#263247] bg-[radial-gradient(ellipse_at_top_right,_#173b5a_0%,_#101b30_42%,_#080d18_78%)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-[1.2fr_.8fr] md:items-center md:py-28">
        <div><p className="mb-4 text-xs font-bold uppercase tracking-[.35em] text-[#e9bd58]">Marketplace gamer</p><h1 className="max-w-2xl text-4xl font-black leading-tight md:text-6xl">Tudo para sua próxima <span className="text-[#e9bd58]">conquista</span>.</h1><p className="mt-5 max-w-xl text-lg text-slate-300">Diamantes, Pokémon, itens e contas anunciados por vendedores independentes.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#categorias" className="rounded-lg bg-[#d8ad50] px-6 py-3 text-center font-extrabold text-[#17120a]">Explorar produtos</a><a href="#vendedores" className="rounded-lg border border-slate-500 px-6 py-3 text-center font-bold">Quero vender</a></div>
        </div>
        <div className="rounded-2xl border border-[#b88b35]/50 bg-[#0b1322]/80 p-8 shadow-2xl"><div className="text-center text-7xl">♛</div><p className="mt-4 text-center text-2xl font-black tracking-[.2em]">CAM STORE</p><p className="mt-2 text-center text-sm text-slate-400">Seu próximo item está aqui.</p><div className="mt-7 grid grid-cols-2 gap-3">{["Compra direta com vendedor","Contato via WhatsApp","Anúncios por categoria","Perfis de vendedores"].map(x=><div key={x} className="rounded-lg border border-[#263247] bg-[#101b30] p-3 text-center text-xs text-slate-300">✓ {x}</div>)}</div></div>
      </div>
    </section>
    <section id="categorias" className="mx-auto max-w-7xl px-5 py-14"><div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#e9bd58]">Encontre o que procura</p><h2 className="mt-2 text-3xl font-black">Categorias</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map(c=><a href="#destaques" key={c.name} className="rounded-xl border border-[#263247] bg-[#101827] p-6 transition hover:border-[#d6aa48]"><div className="text-4xl">{c.icon}</div><h3 className="mt-4 text-xl font-extrabold">{c.name}</h3><p className="mt-2 text-sm text-slate-400">{c.detail}</p></a>)}</div></section>
    <section id="destaques" className="border-y border-[#263247] bg-[#0b1322]"><div className="mx-auto max-w-7xl px-5 py-14"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#e9bd58]">Vitrine da loja</p><h2 className="mt-2 text-3xl font-black">Produtos em destaque</h2><p className="mt-2 text-sm text-slate-400">Prévia visual — os anúncios reais serão carregados do banco de dados.</p><div className="mt-7 grid gap-4 md:grid-cols-3">{samples.map(p=><article key={p.title} className="overflow-hidden rounded-xl border border-[#263247] bg-[#101827]"><div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#172b43,#101827)] text-6xl">{p.icon}</div><div className="p-5"><div className="flex justify-between text-xs"><span className="text-slate-400">{p.category}</span><span className="rounded-full bg-[#263247] px-2 py-1 text-[#f2cf79]">{p.tag}</span></div><h3 className="mt-3 font-bold">{p.title}</h3><p className="mt-2 text-sm font-bold text-cyan-300">{p.price}</p><button className="mt-5 w-full rounded-lg bg-[#167b4b] px-4 py-2.5 text-sm font-bold text-white" disabled>Contato com vendedor (em implantação)</button></div></article>)}</div></div></section>
    <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-14"><h2 className="text-3xl font-black">Como funciona</h2><div className="mt-7 grid gap-5 md:grid-cols-3">{[["01","Escolha um anúncio","Pesquise por categoria, preço ou vendedor."],["02","Fale pelo WhatsApp","Cada anúncio direciona ao vendedor responsável."],["03","Combine diretamente","Pagamento e entrega são acertados com o vendedor."]].map(x=><div key={x[0]} className="rounded-xl border border-[#263247] p-5"><span className="text-2xl font-black text-[#e9bd58]">{x[0]}</span><h3 className="mt-3 font-bold">{x[1]}</h3><p className="mt-2 text-sm text-slate-400">{x[2]}</p></div>)}</div></section>
    <section id="vendedores" className="mx-auto max-w-7xl px-5 pb-16"><div className="rounded-2xl border border-[#b88b35]/40 bg-[#101827] p-7 md:flex md:items-center md:justify-between"><div><h2 className="text-2xl font-black">Venda na CAM Store</h2><p className="mt-2 text-sm text-slate-400">Cadastre-se para solicitar acesso como vendedor. Aprovação feita pela administração.</p></div><span className="mt-5 inline-block rounded-lg border border-[#d6aa48] px-5 py-3 text-sm font-bold text-[#f2cf79] md:mt-0">Cadastro em implantação</span></div></section>
    <footer className="border-t border-[#263247] px-5 py-7 text-center text-xs text-slate-500">© {new Date().getFullYear()} CAM Store. Marketplace independente. Compras e entregas combinadas diretamente com cada vendedor.</footer>
  </main>;
}
