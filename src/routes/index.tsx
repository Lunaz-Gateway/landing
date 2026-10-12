import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { HowItWorks } from "#/components/how-it-works";

export const Route = createFileRoute("/")({ component: Home });

// Placeholder until the repository is public
const GITHUB = "https://github.com";
const DEMO = import.meta.env.VITE_DEMO_URL ?? "http://localhost:3000";
const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-8";
const kicker =
	"font-mono text-sm uppercase tracking-[0.14em] sm:tracking-[0.2em]";
const t = (ms: number) => ({ "--t": `${ms}ms` }) as CSSProperties;

function useSeen<T extends Element>() {
	const ref = useRef<T>(null);
	const [seen, setSeen] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					setSeen(true);
					io.disconnect();
				}
			},
			{ threshold: 0.35 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return [ref, seen] as const;
}

function Home() {
	return (
		<>
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-kertas focus:px-3 focus:py-2 focus:text-malam"
			>
				Skip to content
			</a>
			<Nav />
			<main id="main">
				<Hero />
				<Villain />
				<HowItWorks />
				<WhyNow />
				<Security />
				<Developers />
				<Faq />
				<Closing />
			</main>
			<Footer />
		</>
	);
}

function DemoButton({ dark = false }: { dark?: boolean }) {
	return (
		<a
			href={DEMO}
			className={`press group inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 font-bold ${
				dark ? "bg-malam text-kertas" : "bg-lunas text-malam"
			}`}
		>
			Try the demo
			<svg
				viewBox="0 0 16 16"
				className="size-4 transition-transform duration-200 ease-out [@media(hover:hover)]:group-hover:translate-x-0.5"
				aria-hidden="true"
			>
				<path
					d="M3 8h10M9 4l4 4-4 4"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</a>
	);
}

function Nav() {
	const link = "text-kertas/70 transition-colors hover:text-kertas";
	return (
		<header className="sticky top-0 z-40 border-b border-white/8 bg-malam/85 backdrop-blur-md">
			<div className={`${wrap} flex h-16 items-center justify-between gap-4`}>
				<a href="/" aria-label="Lunaz home" className="shrink-0">
					<img
						src="/lunaz-horizontal-on-dark.svg"
						alt="Lunaz"
						width={118}
						height={32}
						className="h-8 w-auto"
					/>
				</a>
				<nav
					aria-label="Primary"
					className="flex items-center gap-6 text-sm font-medium"
				>
					<a className={`${link} hidden md:inline`} href="#how">
						How it works
					</a>
					<a className={`${link} hidden md:inline`} href="#security">
						Security
					</a>
					<a className={`${link} hidden md:inline`} href="#developers">
						Developers
					</a>
					<a className={`${link} hidden md:inline`} href={GITHUB}>
						GitHub
					</a>
					<a
						href={DEMO}
						className="press rounded-full bg-lunas px-4 py-2 font-bold text-malam"
					>
						Try the demo
					</a>
				</nav>
			</div>
		</header>
	);
}

function Hero() {
	return (
		<section className="overflow-hidden bg-malam">
			<div
				className={`${wrap} grid gap-16 pb-20 pt-14 sm:pt-20 lg:grid-cols-12 lg:gap-8 lg:pb-28`}
			>
				<div className="anim-hero-copy lg:col-span-7 lg:pt-10">
					<p className={`${kicker} text-lunas`}>
						Private payments on shielded Zcash
					</p>
					<h1 className="mt-6 text-[clamp(3.1rem,8.4vw,7.4rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
						Pay with
						<br />
						anything.
						<span className="mt-3 block text-lunas sm:pl-[0.9em]">
							Settled in private.
						</span>
					</h1>
					<p className="mt-9 max-w-[34rem] text-lg leading-relaxed text-kertas/75">
						When you pay cash, the cashier cannot see your savings. Lunaz brings
						that privacy back to digital payments: a non-custodial gateway for
						shielded Zcash, paid directly or from assets on other chains.
					</p>
					<div className="mt-10 flex flex-wrap items-center gap-6">
						<DemoButton />
						<a
							href="#how"
							className="font-bold text-kertas/80 underline decoration-kertas/30 underline-offset-[6px] transition-colors hover:text-kertas"
						>
							See how it works
						</a>
					</div>
				</div>
				<div className="lg:col-span-5">
					<Receipt />
				</div>
			</div>
		</section>
	);
}

/* The logo idea, acted out: a receipt prints, folds over its contents, gets stamped. */
function Receipt() {
	const row = "flex justify-between gap-3";
	return (
		<figure className="relative mx-auto w-full max-w-[21rem]">
			<div
				aria-hidden="true"
				className="relative z-10 -mx-5 h-5 rounded-full border border-white/10 bg-[#13152c] shadow-[inset_0_3px_6px_rgba(0,0,0,0.5)]"
			/>
			<div
				className="-mt-2.5"
				style={{ clipPath: "inset(0 -3rem -3rem -3rem)" }}
			>
				<div
					className="anim-print relative font-mono text-[13px] leading-relaxed text-malam"
					style={{ perspective: "1400px" }}
				>
					<div className="h-60 bg-kertas px-6 pb-5 pt-8">
						<p className="text-center text-sm font-semibold tracking-[0.25em]">
							KEDAI KOPI
						</p>
						<p className="mt-1 text-center text-[11px] text-malam/60">
							CASHIER 01 · INVOICE #0042
						</p>
						<div className="mt-5 border-t border-dashed border-malam/40 pt-3">
							<p className="text-[11px] text-malam/60">PAY TO (SHIELDED)</p>
							<p className="break-all">u1x9ph4w0kq7e3lzd52uv8…</p>
						</div>
						<div className="mt-4 space-y-0.5 text-malam/80">
							<p className={row}>
								<span>NETWORK</span>
								<span>Zcash · Orchard</span>
							</p>
							<p className={row}>
								<span>MEMO</span>
								<span>#0042</span>
							</p>
						</div>
					</div>
					<div className="receipt-flap anim-fold relative h-60">
						<div className="face absolute inset-0 bg-kertas px-6 pt-4">
							<div className="border-t border-dashed border-malam/40 pt-3">
								<p className={row}>
									<span>2× Kopi susu</span>
									<span>0.1200</span>
								</p>
								<p className={row}>
									<span>1× Roti bakar</span>
									<span>0.0800</span>
								</p>
								<p className={row}>
									<span>1× Air mineral</span>
									<span>0.0500</span>
								</p>
							</div>
							<p
								className={`${row} mt-3 border-t border-dashed border-malam/40 pt-3 text-base font-semibold`}
							>
								<span>TOTAL</span>
								<span>0.2500 ZEC</span>
							</p>
							<p className="mt-3 text-center text-[11px] text-malam/60">
								THANK YOU
							</p>
							<div className="zigzag absolute inset-x-0 -bottom-1.5" />
						</div>
						<div className="face face-back absolute inset-0 flex flex-col items-center bg-kertas pt-9">
							<div className="zigzag zigzag-up absolute inset-x-0 -top-1.5" />
							<img
								src="/lunaz-symbol.svg"
								alt=""
								width={56}
								height={56}
								className="size-14"
							/>
							<p className="mt-1 text-[11px] tracking-[0.2em] text-malam/70">
								PRIVATE BY DEFAULT
							</p>
						</div>
					</div>
					<div className="anim-stamp absolute left-1/2 top-[8.4rem] z-10 -ml-[6.5rem] w-[13rem] rotate-[-7deg] rounded-lg border-[3px] border-lunas bg-malam py-2 text-center font-sans text-5xl font-extrabold tracking-tight text-lunas shadow-[0_10px_24px_-8px_rgba(28,31,61,0.6)]">
						LUNAS
					</div>
				</div>
			</div>
			<figcaption className="anim-late -mt-[14.5rem] pr-2 text-right font-mono text-xs leading-relaxed text-kertas/50">
				Receipt #0042: paid in full.
				<br />
				The fold keeps what was bought to itself.
			</figcaption>
		</figure>
	);
}

function Villain() {
	const [ref, seen] = useSeen<HTMLDivElement>();
	const leak = "seq-wipe bg-malam px-1 text-kertas";
	const tx = [
		["−4.50", "Kedai Kopi", "today"],
		["−312.00", "Apotek", "yesterday"],
		["+2,000.00", "Exchange", "3 days ago"],
		["−45.90", "Online store", "5 days ago"],
	] as const;
	return (
		<section className="bg-kertas text-malam">
			<div className={`${wrap} py-24 sm:py-32`}>
				<div className="grid gap-8 lg:grid-cols-12">
					<p className={`${kicker} text-malam/55 lg:col-span-3`}>The problem</p>
					<div className="lg:col-span-9">
						<h2 className="text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
							Cash is private.
							<br />
							Crypto at the counter is not.
						</h2>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-malam/75">
							Pay from a transparent wallet and the cashier can read your whole
							balance and history. In a shop, that address meets its owner's
							face. The store leaks too: competitors read its revenue, suppliers
							and regulars from a block explorer.
						</p>
					</div>
				</div>

				<div
					ref={ref}
					data-on={seen}
					className="mt-16 grid gap-5 lg:grid-cols-12"
				>
					<figure className="rounded-2xl border border-malam/15 bg-white p-5 sm:p-7 lg:col-span-7">
						<figcaption className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-malam/55">
							<span>Explorer · transparent chain</span>
							<span>Illustration</span>
						</figcaption>
						<p className="mt-4 rounded-lg border border-malam/15 px-4 py-2.5 font-mono text-sm">
							0x7a3f…c91e{" "}
							<span className="text-malam/45">· the buyer at the counter</span>
						</p>
						<div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
							<span className="text-sm text-malam/60">Balance</span>
							<span className="font-mono text-3xl font-medium tabular-nums">
								<span className={leak} style={t(200)}>
									18,420.55 USDC
								</span>
							</span>
						</div>
						<ul className="mt-5 divide-y divide-malam/10 border-y border-malam/10 font-mono text-[13px]">
							{tx.map(([amt, who, when], k) => (
								<li
									key={who}
									className="seq grid grid-cols-[6.5rem_1fr_auto] gap-3 py-2.5"
									style={t(450 + k * 90)}
								>
									<span className="tabular-nums">{amt}</span>
									<span>{who}</span>
									<span className="text-malam/45">{when}</span>
								</li>
							))}
						</ul>
						<p className="seq mt-5 text-sm" style={t(1000)}>
							Kedai Kopi revenue today:{" "}
							<span className={`${leak} font-mono`} style={t(1150)}>
								1,284.00 USDC
							</span>{" "}
							<span className="text-malam/55">
								and every customer behind it.
							</span>
						</p>
					</figure>

					<figure className="flex flex-col rounded-2xl bg-malam p-5 text-kertas sm:p-7 lg:col-span-5">
						<figcaption className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-kertas/55">
							<span>Explorer · Zcash</span>
							<span>Same lookup</span>
						</figcaption>
						<p className="mt-4 rounded-lg border border-white/15 px-4 py-2.5 font-mono text-sm">
							u1x9ph4w0k…{" "}
							<span className="text-kertas/45">· a Lunaz store</span>
						</p>
						<div className="flex flex-1 flex-col justify-center py-10">
							<p
								className="swap-before font-mono text-sm text-kertas/50"
								style={t(2000)}
							>
								Searching…
							</p>
							<p
								className="seq mt-2 text-4xl font-bold tracking-tight text-lunas sm:text-5xl"
								style={t(2100)}
							>
								No public records.
							</p>
							<p className="seq mt-4 text-kertas/70" style={t(2250)}>
								Shielded. Sender, amount and store stay encrypted. The receipt
								exists; only the merchant can read it.
							</p>
						</div>
					</figure>
				</div>

				<dl className="mt-24 border-t border-malam/20">
					{(
						[
							[
								"Merchants",
								"Take crypto without opening your books. A competitor cannot read your till from a block explorer.",
							],
							[
								"Buyers",
								"Pay with USDC, SOL, BTC and more. It lands as shielded ZEC without you buying ZEC first.",
							],
							[
								"Accountants",
								"Get a viewing key and the full records for bookkeeping and tax. Private to the world, open to the books.",
							],
						] as const
					).map(([who, what]) => (
						<div
							key={who}
							data-reveal
							className="grid gap-2 border-b border-malam/20 py-7 sm:grid-cols-12 sm:gap-8"
						>
							<dt className="text-2xl font-bold tracking-tight sm:col-span-4 sm:text-3xl">
								{who}
							</dt>
							<dd className="max-w-xl text-lg leading-relaxed text-malam/75 sm:col-span-8">
								{what}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}

function WhyNow() {
	const items = [
		[
			"The stablecoin wave",
			"Stablecoin payments are going mainstream, almost all of them on transparent chains. Every one leaks a little more merchant data.",
		],
		[
			"The rails just arrived",
			"NEAR Intents now swaps from other chains straight into shielded ZEC. Until recently the destination had to be a transparent address.",
		],
		[
			"New people in the shielded pool",
			"Every USDC or SOL payment becomes a fresh shielded transaction, from someone who may never have held ZEC.",
		],
	] as const;
	return (
		<section className="bg-kertas text-malam">
			<div className={`${wrap} grid gap-12 py-24 sm:py-32 lg:grid-cols-12`}>
				<div className="lg:col-span-4">
					<div className="lg:sticky lg:top-28">
						<p className={`${kicker} text-malam/55`}>Why now</p>
						<h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
							Private by default. Transparent by choice.
						</h2>
					</div>
				</div>
				<ol className="lg:col-span-7 lg:col-start-6">
					{items.map(([title, body], i) => (
						<li
							key={title}
							data-reveal
							className="grid grid-cols-[3.5rem_1fr] gap-x-4 border-t border-malam/20 py-10 first:border-t-0 first:pt-0 sm:grid-cols-[5rem_1fr]"
						>
							<span className="font-mono text-sm tabular-nums text-malam/50">
								0{i + 1}
							</span>
							<div>
								<h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
									{title}
								</h3>
								<p className="mt-3 text-lg leading-relaxed text-malam/75">
									{body}
								</p>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}

function Security() {
	const ledger = [
		["Server holds", "viewing key"],
		["Server never holds", "spending key"],
		["Funds land in", "the merchant's own wallet"],
		["Custody", "none"],
		["Hosting", "yours, if you want it"],
	] as const;
	return (
		<section id="security" className="bg-malam">
			<div className={`${wrap} grid gap-14 py-24 sm:py-36 lg:grid-cols-12`}>
				<div className="lg:col-span-6">
					<p className={`${kicker} text-lunas`}>Security model</p>
					<h2 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
						A hacked server can look.
						<span className="block text-lunas">It cannot spend.</span>
					</h2>
					<p className="mt-8 max-w-lg text-lg leading-relaxed text-kertas/75">
						Lunaz splits seeing from spending. The gateway and the cashier
						tablet hold viewing keys only. Spending keys stay in the merchant's
						wallet. Run it yourself, in the spirit of BTCPay Server.
					</p>
				</div>
				<div className="lg:col-span-5 lg:col-start-8 lg:pt-16">
					<div className="bg-kertas px-6 pb-6 pt-7 font-mono text-sm text-malam">
						<p className="text-center text-[11px] tracking-[0.25em] text-malam/60">
							KEY CUSTODY
						</p>
						<dl className="mt-5 space-y-3">
							{ledger.map(([k, v]) => (
								<div key={k} className="flex items-baseline gap-2">
									<dt className="shrink-0">{k}</dt>
									<span
										aria-hidden="true"
										className="min-w-4 flex-1 border-b border-dotted border-malam/40"
									/>
									<dd className="text-right font-semibold">{v}</dd>
								</div>
							))}
						</dl>
					</div>
					<div className="zigzag" />
				</div>
			</div>
		</section>
	);
}

function Developers() {
	const code = `POST /v1/invoices
{ "amount_zat": 25000000 }

201 Created
{
  "id": "inv_...",
  "address": "u1...",
  "zip321_uri": "zcash:u1...?amount=0.25",
  "status": "pending"
}

# Webhook on LUNAS, signed with HMAC-SHA256
X-Lunaz-Signature: <hex digest>`;
	return (
		<section id="developers" className="bg-kertas text-malam">
			<div className={`${wrap} grid gap-12 py-24 sm:py-28 lg:grid-cols-12`}>
				<div className="lg:col-span-5">
					<p className={`${kicker} text-malam/55`}>One gateway</p>
					<h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
						The counter, the web, and an API.
					</h2>
					<dl className="mt-10 space-y-6">
						<div>
							<dt className="text-xl font-bold">Cashier tablet</dt>
							<dd className="mt-1 text-malam/75">
								Type an amount, show the QR, wait for LUNAS.
							</dd>
						</div>
						<div>
							<dt className="text-xl font-bold">Hosted checkout</dt>
							<dd className="mt-1 text-malam/75">
								A page for online stores with the address, the QR and live
								status.
							</dd>
						</div>
						<div>
							<dt className="text-xl font-bold">Gateway API</dt>
							<dd className="mt-1 text-malam/75">
								Per-merchant API keys, signed webhooks when an invoice turns
								LUNAS, and a WebSocket for live status.
							</dd>
						</div>
					</dl>
				</div>
				<pre
					data-reveal
					className="self-start overflow-x-auto rounded-2xl bg-malam p-6 font-mono text-[13px] leading-relaxed text-kertas sm:p-8 lg:col-span-6 lg:col-start-7"
				>
					<code>{code}</code>
				</pre>
			</div>
		</section>
	);
}

function Faq() {
	const faqs = [
		[
			"Is the buyer fully anonymous?",
			"Not entirely. A buyer who pays from another chain still makes a public swap on that chain. Nothing public links that swap to your store or to what was bought.",
		],
		[
			"Does Lunaz hold my money?",
			"No. The server holds viewing keys only, never spending keys. Funds go to your own shielded wallet.",
		],
		[
			"Is cross-chain payment live?",
			"Direct shielded ZEC payments are the core path. The NEAR Intents cross-chain path is in progress.",
		],
		[
			"Can I run it myself?",
			"Yes. Lunaz is built to be self-hosted, in the spirit of BTCPay Server.",
		],
	] as const;
	return (
		<section className="bg-malam">
			<div className={`${wrap} grid gap-10 py-24 sm:py-28 lg:grid-cols-12`}>
				<div className="lg:col-span-4">
					<p className={`${kicker} text-lunas`}>Honest answers</p>
					<h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em]">
						What Lunaz does not hide.
					</h2>
				</div>
				<div className="divide-y divide-white/12 border-y border-white/12 lg:col-span-7 lg:col-start-6">
					{faqs.map(([q, a]) => (
						<details key={q} className="group py-6">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
								{q}
								<span
									aria-hidden="true"
									className="font-mono text-xl text-lunas transition-transform duration-200 group-open:rotate-45"
								>
									+
								</span>
							</summary>
							<p className="mt-3 max-w-xl text-kertas/70">{a}</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}

function Closing() {
	return (
		<section className="bg-lunas text-malam">
			<div className={`${wrap} py-24 sm:py-32`}>
				<h2 className="text-[clamp(2.8rem,8vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
					No open balances.
					<br />
					No public revenue.
					<span className="mt-[0.18em] block">
						Just{" "}
						<span className="inline-block -rotate-3 rounded-xl bg-malam px-[0.15em] pb-[0.06em] text-lunas">
							LUNAS.
						</span>
					</span>
				</h2>
				<div className="mt-12 flex flex-wrap items-center gap-6">
					<DemoButton dark />
					<a
						href={GITHUB}
						className="font-bold underline decoration-malam/30 underline-offset-[6px]"
					>
						View on GitHub
					</a>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="bg-malam">
			<div
				className={`${wrap} flex flex-col gap-8 py-14 sm:flex-row sm:items-end sm:justify-between`}
			>
				<div>
					<img
						src="/lunaz-horizontal-on-dark.svg"
						alt="Lunaz"
						width={118}
						height={32}
						className="h-8 w-auto"
					/>
					<p className="mt-5 max-w-md text-sm leading-relaxed text-kertas/60">
						From the Indonesian "lunas", paid in full, plus z for Zcash. A
						Zecathon project, built on Zcash shielded pools, NEAR Intents, Zebra
						and lightwalletd.
					</p>
				</div>
				<div className="flex gap-6 text-sm font-bold">
					<a className="text-lunas hover:underline" href={DEMO}>
						Demo
					</a>
					<a className="text-lunas hover:underline" href={GITHUB}>
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}
