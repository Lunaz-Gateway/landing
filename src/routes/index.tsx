import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { GatewayFlow } from "#/components/gateway-flow";
import { HowItWorks } from "#/components/how-it-works";

export const Route = createFileRoute("/")({ component: Home });

// Placeholder until the repository is public
const GITHUB = "https://github.com";
const DEMO = import.meta.env.VITE_DEMO_URL ?? "http://localhost:3000";
const SHOPS = [
	"Dusk Coffee",
	"House of Batik",
	"The Little Bookshop",
	"Tiny Gadgets",
	"Grandma's Kitchen",
] as const;
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
			<main id="main" className="[&_h2]:text-balance">
				<Hero />
				<Villain />
				<HowItWorks />
				<Marketplaces />
				<Security />
				<WhyNow />
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
			Try Sunday Market
			<Arrow />
		</a>
	);
}

function Arrow() {
	return (
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
					className="flex items-center gap-4 text-sm font-medium sm:gap-6"
				>
					<a className={`${link} hidden md:inline`} href="#how">
						How it works
					</a>
					<a className={`${link} hidden lg:inline`} href="#security">
						Security
					</a>
					<a className={`${link} hidden md:inline`} href="#developers">
						Developers
					</a>
					<a
						href={DEMO}
						className="press whitespace-nowrap rounded-full bg-lunas px-4 py-2 font-bold text-malam"
					>
						<span className="sm:hidden">Demo</span>
						<span className="hidden sm:inline">Try Sunday Market</span>
					</a>
				</nav>
			</div>
		</header>
	);
}

const POWERED_BY = ["Zcash", "NEAR Intents", "Zebra", "lightwalletd"];

function Hero() {
	return (
		<section className="overflow-hidden bg-malam">
			<div
				className={`${wrap} grid items-center gap-12 pb-20 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-16`}
			>
				<div className="anim-hero-copy min-w-0 lg:col-span-6">
					<h1 className="text-[clamp(3.1rem,6.4vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
						Pay with
						<br />
						anything.
						<span className="mt-3 block text-lunas sm:pl-[0.9em]">
							Settled in private.
						</span>
					</h1>
					<p className="mt-8 max-w-[31rem] text-lg leading-relaxed text-kertas/80">
						A non-custodial payment gateway for shielded Zcash. Buyers pay in
						ZEC, or in USDC, SOL, ETH or BTC through NEAR Intents. Every
						merchant is paid straight to its own shielded wallet.
					</p>
					<div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
						<DemoButton />
						<a
							href="/dashboard"
							className="press rounded-full border border-white/20 px-6 py-3.5 font-bold text-kertas transition-colors hover:border-white/40"
						>
							Dashboard
						</a>
					</div>
				</div>
				<div className="min-w-0 lg:col-span-6">
					<div className="rounded-2xl border border-white/10 bg-[radial-gradient(rgba(246,242,233,0.07)_1px,transparent_1px)] bg-[size:14px_14px] p-4 sm:p-6">
						<GatewayFlow />
					</div>
				</div>
			</div>
			<div className="border-t border-white/10">
				<div
					className={`${wrap} flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:gap-10`}
				>
					<p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.25em] text-kertas/60">
						Powered by
					</p>
					<ul className="flex flex-wrap items-center gap-x-10 gap-y-3 text-lg font-bold tracking-tight text-kertas/70">
						{POWERED_BY.map((name) => (
							<li key={name}>{name}</li>
						))}
					</ul>
				</div>
			</div>
		</section>
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
							Crypto checkout is not.
						</h2>
						<p className="mt-6 max-w-2xl text-lg leading-relaxed text-malam/75">
							Pay from a transparent wallet and the shop can read your whole
							balance and history. The shop leaks too: anyone with a block
							explorer can read its revenue, its suppliers and its regular
							customers.
						</p>
					</div>
				</div>

				<div
					ref={ref}
					data-on={seen}
					className="mt-16 grid gap-5 lg:grid-cols-12"
				>
					<figure className="rounded-2xl border border-malam/15 bg-white p-5 sm:p-7 lg:col-span-7">
						<figcaption className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-malam/65">
							<span>Explorer · transparent chain</span>
							<span>Illustration</span>
						</figcaption>
						<p className="mt-4 rounded-lg border border-malam/15 px-4 py-2.5 font-mono text-sm">
							0x7a3f…c91e{" "}
							<span className="text-malam/60">· the buyer at checkout</span>
						</p>
						<div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
							<span className="text-sm text-malam/65">Balance</span>
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
									<span className="text-malam/60">{when}</span>
								</li>
							))}
						</ul>
						<p className="seq mt-5 text-sm" style={t(1000)}>
							Kedai Kopi revenue today:{" "}
							<span className={`${leak} font-mono`} style={t(1150)}>
								1,284.00 USDC
							</span>{" "}
							<span className="text-malam/65">
								and every customer behind it.
							</span>
						</p>
					</figure>

					<figure className="flex flex-col rounded-2xl bg-malam p-5 text-kertas sm:p-7 lg:col-span-5">
						<figcaption className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-kertas/60">
							<span>Explorer · Zcash</span>
							<span>Same lookup</span>
						</figcaption>
						<p className="mt-4 rounded-lg border border-white/15 px-4 py-2.5 font-mono text-sm">
							u1x9ph4w0k…{" "}
							<span className="text-kertas/60">· a Lunaz merchant</span>
						</p>
						<div className="flex flex-1 flex-col justify-center py-10">
							<p
								className="swap-before font-mono text-sm text-kertas/60"
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
								"Take crypto without opening your books. A competitor cannot read your sales from a block explorer.",
							],
							[
								"Buyers",
								"Pay with USDC, USDT, SOL, ETH or BTC. It lands as shielded ZEC, and you never have to buy ZEC first.",
							],
							[
								"Accountants",
								"Get a CSV of every invoice and payment, built from the viewing key, for bookkeeping and tax. Private to the world, open to the books.",
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

function Marketplaces() {
	const points = [
		[
			"Paid straight to the seller",
			"Each order is invoiced with that seller's key, so the ZEC lands in the seller's own shielded wallet. Buyers check out per shop.",
		],
		[
			"Keys per seller",
			"Every seller is its own merchant with its own viewing key, API keys and webhook. One seller's key cannot invoice for another.",
		],
		[
			"No custody, no payouts",
			"The platform never holds funds or spending keys. There is no pooled balance to guard and no payout run to reconcile.",
		],
		[
			"Books per seller",
			"Each seller exports its own accountant CSV from its viewing key: invoices, payments, USD rate at payment time.",
		],
	] as const;
	return (
		<section id="marketplaces" className="bg-kertas text-malam">
			<div className={`${wrap} grid gap-14 py-24 sm:py-32 lg:grid-cols-12`}>
				<div className="lg:col-span-7">
					<p className={`${kicker} text-malam/60`}>Built for marketplaces</p>
					<h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
						One gateway,
						<br />
						many merchants.
					</h2>
					<p className="mt-6 max-w-xl text-lg leading-relaxed text-malam/75">
						A marketplace or platform can onboard every seller as its own
						non-custodial merchant. A single online store calls the same API
						from its own checkout page. In a physical store, a point-of-sale app
						calls the same API.
					</p>
					<dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
						{points.map(([title, body]) => (
							<div key={title} className="border-t border-malam/20 pt-5">
								<dt className="text-xl font-bold tracking-tight">{title}</dt>
								<dd className="mt-2 leading-relaxed text-malam/75">{body}</dd>
							</div>
						))}
					</dl>
				</div>
				<div className="self-start lg:col-span-4 lg:col-start-9 lg:pt-4">
					<div className="drop-shadow-[0_2px_6px_rgb(28_31_61/0.10)]">
						<div className="bg-white px-6 pb-6 pt-7 font-mono text-sm">
							<p className="text-center text-[11px] tracking-[0.25em] text-malam/65">
								SUNDAY MARKET · DEMO
							</p>
							<ul className="mt-5 space-y-3">
								{SHOPS.map((shop) => (
									<li key={shop} className="flex items-baseline gap-2">
										<span className="shrink-0">{shop}</span>
										<span
											aria-hidden="true"
											className="min-w-4 flex-1 border-b border-dotted border-malam/40"
										/>
										<span className="shrink-0 text-malam/65">own wallet</span>
									</li>
								))}
							</ul>
							<div className="mt-5 flex items-baseline justify-between gap-3 border-t border-dashed border-malam/40 pt-4 font-semibold">
								<span>Held by the platform</span>
								<span className="tabular-nums">0.0000 ZEC</span>
							</div>
						</div>
						<div className="zigzag" style={{ background: "#fff" }} />
					</div>
					<a
						href={DEMO}
						className="group mt-6 inline-flex items-center gap-2 font-bold underline decoration-malam/30 underline-offset-[6px] hover:decoration-malam"
					>
						Shop at Sunday Market
						<Arrow />
					</a>
				</div>
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
		["Operated by", "Lunaz, fully managed"],
	] as const;
	return (
		<section id="security" className="bg-malam">
			<div className={`${wrap} grid gap-14 py-24 sm:py-32 lg:grid-cols-12`}>
				<div className="lg:col-span-6">
					<p className={`${kicker} text-lunas`}>Security model</p>
					<h2 className="mt-5 text-[2.6rem] font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
						A hacked server can look.
						<span className="block text-lunas">It cannot spend.</span>
					</h2>
					<p className="mt-8 max-w-lg text-lg leading-relaxed text-kertas/75">
						Lunaz splits seeing from spending. The gateway holds viewing keys
						only, and checkout pages hold no keys at all. Spending keys stay in
						each merchant's wallet. We run and monitor the gateway, so there is
						nothing for you to deploy.
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
Authorization: Bearer lz_...
{ "amount_zat": 25000000 }

201 Created
{
  "id": "inv_...",
  "address": "u1...",
  "zip321_uri": "zcash:u1...?amount=0.25",
  "status": "pending"
}

# invoice.paid, retried after 10 s, 60 s, 300 s
X-Lunaz-Signature: <hex HMAC-SHA256 of the body>`;
	const items = [
		[
			"Invoices and live status",
			"One call per order returns a fresh shielded address and a ZIP-321 URI. A WebSocket pushes pending, detected and paid.",
		],
		[
			"Signed webhooks",
			"invoice.paid and invoice.underpaid, plus swap refunds and failures. Failed deliveries retry, and every attempt is in the delivery log.",
		],
		[
			"Honest amounts",
			"Payments to one address add up. Overpayments are recorded; a short payment ends as underpaid instead of paid.",
		],
		[
			"Developer dashboard",
			"Register the viewing key, create API keys, test webhooks, search invoices and export the accountant CSV.",
		],
	] as const;
	return (
		<section id="developers" className="bg-malam">
			<div className={`${wrap} grid gap-12 py-24 sm:py-32 lg:grid-cols-12`}>
				<div className="lg:col-span-5">
					<p className={`${kicker} text-lunas`}>Developers</p>
					<h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
						Create an invoice. Get a webhook when it is paid.
					</h2>
					<dl className="mt-10 space-y-6">
						{items.map(([title, body]) => (
							<div key={title}>
								<dt className="text-lg font-bold">{title}</dt>
								<dd className="mt-1 leading-relaxed text-kertas/75">{body}</dd>
							</div>
						))}
					</dl>
					<a
						href="/dashboard"
						className="press mt-10 inline-flex rounded-full border border-white/20 px-6 py-3.5 font-bold transition-colors hover:border-white/40"
					>
						Open the dashboard
					</a>
				</div>
				<pre
					data-reveal
					className="self-start overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-6 font-mono text-[13px] leading-relaxed text-kertas sm:p-8 lg:col-span-6 lg:col-start-7 lg:mt-14"
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
			"Not entirely. A buyer who pays from another chain still makes a public deposit on that chain. Nothing public links that deposit to the shop or to what was bought.",
		],
		[
			"Does Lunaz hold my money?",
			"No. The server holds viewing keys only, never spending keys. Funds go to each merchant's own shielded wallet.",
		],
		[
			"Is cross-chain payment live?",
			"Yes, through NEAR Intents: USDC, USDT, SOL, ETH and BTC on their main chains. The invoice must be at least 0.001 ZEC, and a failed swap is refunded to the buyer's address.",
		],
		[
			"What if a buyer pays too much or too little?",
			"Payments to the same address add up, so a buyer can top up before the invoice expires. Any excess is recorded as overpaid; a short payment ends as underpaid. Lunaz cannot refund either, since it cannot spend. The merchant does.",
		],
		[
			"Which shielded pools does it watch?",
			"Orchard and Ironwood, in both the mempool and mined blocks. A payment shows as detected in seconds and turns LUNAS after one confirmation, about 75 seconds.",
		],
		[
			"Do I need to run any infrastructure?",
			"No. Lunaz is a managed service: we run the gateway, the chain watcher and the cross-chain swaps. You sign up, connect your wallet's viewing key and call the API.",
		],
	] as const;
	return (
		<section className="bg-kertas text-malam">
			<div className={`${wrap} grid gap-10 py-24 sm:py-32 lg:grid-cols-12`}>
				<div className="lg:col-span-4">
					<p className={`${kicker} text-malam/60`}>Honest answers</p>
					<h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
						What Lunaz does not hide.
					</h2>
				</div>
				<div className="divide-y divide-malam/15 border-y border-malam/15 lg:col-span-7 lg:col-start-6">
					{faqs.map(([q, a]) => (
						<details key={q} className="group">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-lg font-bold [&::-webkit-details-marker]:hidden">
								{q}
								<svg
									viewBox="0 0 16 16"
									className="size-4 shrink-0 transition-transform duration-200 ease-out group-open:rotate-45"
									aria-hidden="true"
								>
									<path
										d="M8 3v10M3 8h10"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
									/>
								</svg>
							</summary>
							<p className="-mt-2 max-w-xl pb-6 leading-relaxed text-malam/75">
								{a}
							</p>
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
						From the Indonesian "lunas", paid in full, plus z for Zcash. Built
						on Zcash shielded pools, NEAR Intents, Zebra and lightwalletd.
					</p>
				</div>
				<div className="flex gap-6 text-sm font-bold">
					<a className="text-lunas hover:underline" href={DEMO}>
						Sunday Market
					</a>
					<a className="text-lunas hover:underline" href={GITHUB}>
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}
