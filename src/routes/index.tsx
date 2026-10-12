import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

// Placeholder until the repository is public
const GITHUB = "https://github.com";
const wrap = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const eyebrow = "text-sm font-bold uppercase tracking-widest";
const h2 = "mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl";

const steps = [
	[
		"Invoice",
		"The merchant creates an invoice. Lunaz derives a unique shielded address for it from the merchant viewing key.",
	],
	[
		"Pay",
		"ZEC buyers scan a ZIP-321 QR code. Buyers on other chains get a one-time deposit address through NEAR Intents 1Click.",
	],
	[
		"Swap",
		"Solvers swap the buyer asset and deliver shielded ZEC straight to the invoice address.",
	],
	[
		"Detect",
		"A watcher sees the payment in the mempool, then confirms it on chain.",
	],
	[
		"LUNAS",
		"The cashier screen flips to LUNAS. The merchant spends from their own wallet.",
	],
] as const;

const pillars = [
	[
		"Merchants",
		"Revenue, suppliers and customers stay hidden. A competitor cannot read your till from a block explorer.",
	],
	[
		"Buyers",
		"Pay with USDC, SOL, BTC and more. It lands as shielded ZEC without the buyer touching Zcash.",
	],
	[
		"Accountants",
		"Hand over a viewing key and get full records and CSV export. Private to the world, open to your books.",
	],
] as const;

const faqs = [
	[
		"Is the buyer fully anonymous?",
		"Not entirely. A buyer who pays from another chain still makes a public swap on that origin chain. Nothing links that swap to your store or to what was bought.",
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
				<Problem />
				<WhyNow />
				<How />
				<Clients />
				<Security />
				<Developers />
				<Faq />
				<CtaBand />
			</main>
			<Footer />
		</>
	);
}

function Nav() {
	const link = "rounded px-1 text-kertas/80 hover:text-lunas";
	return (
		<header className="sticky top-0 z-40 border-b border-white/10 bg-malam/90 backdrop-blur">
			<div className={`${wrap} flex h-16 items-center justify-between gap-4`}>
				<a href="/" aria-label="Lunaz home">
					<img
						src="/lunaz-horizontal-on-dark.svg"
						alt="Lunaz"
						width={132}
						height={32}
						className="h-8 w-auto"
					/>
				</a>
				<nav
					aria-label="Primary"
					className="flex items-center gap-5 text-sm font-medium sm:gap-7"
				>
					<a className={`${link} hidden sm:inline`} href="#how">
						How it works
					</a>
					<a className={`${link} hidden sm:inline`} href="#security">
						Security
					</a>
					<a className={`${link} hidden sm:inline`} href="#developers">
						Developers
					</a>
					<a
						className="rounded-full bg-lunas px-4 py-2 font-bold text-malam hover:brightness-95"
						href={GITHUB}
					>
						GitHub
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
				className={`${wrap} grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]`}
			>
				<div>
					<p className={`${eyebrow} text-lunas`}>
						Private payments, built on Zcash
					</p>
					<h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
						Pay with anything.
						<br />
						<span className="text-lunas">Settled in private.</span>
					</h1>
					<p className="mt-6 max-w-xl text-lg leading-relaxed text-kertas/75">
						Lunaz is a private, non-custodial payment gateway for shielded
						Zcash. Take payment directly, or from assets on other chains through
						NEAR Intents.
					</p>
					<p className="mt-5 text-xl font-bold leading-snug sm:text-2xl">
						No open balances.
						<br />
						No public revenue.
						<br />
						<span className="text-lunas">Just LUNAS.</span>
					</p>
					<div className="mt-9 flex flex-wrap items-center gap-5">
						<a
							className="rounded-full bg-lunas px-7 py-3.5 font-bold text-malam hover:brightness-95"
							href="#how"
						>
							See how it works
						</a>
						<a className="font-bold hover:text-lunas" href="#developers">
							For developers
						</a>
					</div>
				</div>
				<CashierMock />
			</div>
		</section>
	);
}

function CashierMock() {
	return (
		<div
			role="img"
			aria-label="Mock of the Lunaz cashier screen showing an invoice marked LUNAS"
			className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/15 bg-white/5 p-3 shadow-2xl shadow-black/40"
		>
			<div className="rounded-[1.5rem] border border-white/10 bg-malam px-6 pb-10 pt-6">
				<div className="flex items-center justify-between text-xs text-kertas/60">
					<span className="font-medium">Invoice #0042</span>
					<span className="flex items-center gap-2">
						<span className="pulse-dot size-2 rounded-full bg-lunas" />
						Confirmed
					</span>
				</div>
				<div className="mt-8 text-center">
					<p className="text-sm text-kertas/60">Amount</p>
					<p className="mt-1 text-4xl font-bold tabular-nums">0.2500 ZEC</p>
				</div>
				<div className="stamp mt-10 text-center text-6xl font-extrabold tracking-tight text-lunas sm:text-7xl">
					LUNAS
				</div>
				<p className="mt-8 text-center text-xs text-kertas/50">
					Shielded. Nobody else sees this sale.
				</p>
			</div>
		</div>
	);
}

function Problem() {
	return (
		<section className="bg-kertas text-malam">
			<div className={`${wrap} py-20 sm:py-28`}>
				<p className={`${eyebrow} text-malam/60`}>The problem</p>
				<h2 className={`${h2} max-w-3xl`}>
					Cash is private. Crypto at the counter is not.
				</h2>
				<div className="mt-10 grid gap-8 text-lg leading-relaxed sm:grid-cols-2">
					<p>
						When you pay cash, the cashier cannot see your savings. When you pay
						with crypto from a transparent wallet, they can see everything: your
						whole balance and history. In a shop, that wallet address meets its
						owner's face, a risky mix while crypto holders are targeted for
						extortion.
					</p>
					<p>
						The merchant is exposed too. On a transparent chain, competitors can
						read daily revenue, suppliers and regulars from a block explorer.
						Lunaz brings cash-like privacy back to digital payments.
					</p>
				</div>
				<ul className="mt-14 grid gap-5 md:grid-cols-3">
					{pillars.map(([t, d]) => (
						<li key={t} className="rounded-2xl border border-malam/15 p-6">
							<h3 className="text-xl font-bold">For {t.toLowerCase()}</h3>
							<p className="mt-3 text-malam/75">{d}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

function WhyNow() {
	const items = [
		[
			"The stablecoin wave",
			"Stablecoin payments are going mainstream, almost all on transparent chains. Merchant data leaks grow with them.",
		],
		[
			"Infrastructure is ready",
			"NEAR Intents recently added swaps straight to shielded ZEC. Before, the destination had to be a transparent address.",
		],
		[
			"New shielded users",
			"Every USDC or SOL payment becomes a fresh shielded transaction, bringing people who never held ZEC into the shielded pool.",
		],
	] as const;
	return (
		<section className="bg-malam">
			<div className={`${wrap} py-20 sm:py-28`}>
				<p className={`${eyebrow} text-lunas`}>Why now</p>
				<h2 className={`${h2} max-w-3xl`}>
					Private by default. Transparent by choice.
				</h2>
				<p className="mt-5 max-w-2xl text-lg text-kertas/75">
					Privacy is the default. Share a viewing key with your accountant or
					tax office when you choose to.
				</p>
				<ul className="mt-12 grid gap-5 md:grid-cols-3">
					{items.map(([t, d]) => (
						<li key={t} className="rounded-2xl border border-white/15 p-6">
							<h3 className="text-xl font-bold text-lunas">{t}</h3>
							<p className="mt-3 text-kertas/70">{d}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

function How() {
	return (
		<section id="how" className="bg-malam">
			<div className={`${wrap} py-20 sm:py-28`}>
				<p className={`${eyebrow} text-lunas`}>How it works</p>
				<h2 className={`${h2} max-w-3xl`}>
					From invoice to LUNAS in five steps.
				</h2>
				<ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-5">
					{steps.map(([t, d], i) => (
						<li key={t} className="bg-malam p-6">
							<span className="text-5xl font-extrabold text-lunas/90 tabular-nums">
								{i + 1}
							</span>
							<h3 className="mt-4 text-lg font-bold">{t}</h3>
							<p className="mt-2 text-sm leading-relaxed text-kertas/70">{d}</p>
						</li>
					))}
				</ol>
				<p className="mt-6 text-sm text-kertas/60">
					The cross-chain path through NEAR Intents is still in progress. Direct
					shielded ZEC payments come first.
				</p>
			</div>
		</section>
	);
}

function Clients() {
	const card = "rounded-3xl p-8 sm:p-10";
	return (
		<section className="bg-kertas text-malam">
			<div className={`${wrap} py-20 sm:py-28`}>
				<p className={`${eyebrow} text-malam/60`}>One gateway, two clients</p>
				<h2 className={`${h2} max-w-3xl`}>In the shop or on the web.</h2>
				<div className="mt-12 grid gap-6 md:grid-cols-2">
					<article className={`${card} bg-malam text-kertas`}>
						<h3 className="text-2xl font-bold text-lunas">Cashier tablet</h3>
						<p className="mt-3 text-kertas/75">
							Type an amount, show the QR, wait for LUNAS. Built for the
							counter, with a screen your staff can read at a glance.
						</p>
					</article>
					<article className={`${card} border border-malam/20`}>
						<h3 className="text-2xl font-bold">Hosted checkout</h3>
						<p className="mt-3 text-malam/75">
							Send online buyers to a hosted page that shows the address, the QR
							and live status. Nothing to build on your side.
						</p>
					</article>
				</div>
			</div>
		</section>
	);
}

function Security() {
	const points = [
		[
			"Viewing keys only",
			"The server never holds spending keys. If it is breached, funds cannot move.",
		],
		[
			"Non-custodial",
			"Payments settle into the merchant wallet. Lunaz never touches your money.",
		],
		["Self-hostable", "Run it on your own infrastructure, like BTCPay Server."],
		[
			"Private by default",
			"Transparent by choice. Share a viewing key only with people you trust.",
		],
	] as const;
	return (
		<section id="security" className="bg-malam">
			<div className={`${wrap} py-20 sm:py-28`}>
				<p className={`${eyebrow} text-lunas`}>Security model</p>
				<h2 className={`${h2} max-w-3xl`}>
					A hacked server cannot move your funds.
				</h2>
				<dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
					{points.map(([t, d]) => (
						<div key={t} className="border-t border-lunas/60 pt-5">
							<dt className="text-xl font-bold">{t}</dt>
							<dd className="mt-2 text-kertas/70">{d}</dd>
						</div>
					))}
				</dl>
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
			<div className={`${wrap} grid gap-12 py-20 sm:py-28 lg:grid-cols-2`}>
				<div>
					<p className={`${eyebrow} text-malam/60`}>Developers</p>
					<h2 className={h2}>One API key. One webhook.</h2>
					<ul className="mt-8 space-y-3 text-lg">
						<li>Per-merchant API keys.</li>
						<li>Signed webhooks (HMAC-SHA256) when an invoice turns LUNAS.</li>
						<li>WebSocket for live invoice status.</li>
					</ul>
				</div>
				<pre className="overflow-x-auto rounded-2xl bg-malam p-6 font-mono text-sm leading-relaxed text-kertas">
					<code>{code}</code>
				</pre>
			</div>
		</section>
	);
}

function Faq() {
	return (
		<section className="bg-malam">
			<div className={`${wrap} py-20 sm:py-28`}>
				<p className={`${eyebrow} text-lunas`}>Honest answers</p>
				<h2 className={`${h2} max-w-3xl`}>What Lunaz does not hide.</h2>
				<div className="mt-10 max-w-3xl divide-y divide-white/15 border-y border-white/15">
					{faqs.map(([q, a]) => (
						<details key={q} className="group py-5">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
								{q}
								<span
									aria-hidden
									className="text-lunas transition-transform group-open:rotate-45"
								>
									+
								</span>
							</summary>
							<p className="mt-3 text-kertas/70">{a}</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}

function CtaBand() {
	return (
		<section className="bg-lunas text-malam">
			<div
				className={`${wrap} flex flex-col gap-6 py-16 sm:flex-row sm:items-center sm:justify-between`}
			>
				<h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
					Accept payments. Keep the books private.
				</h2>
				<a
					className="w-fit rounded-full bg-malam px-7 py-3.5 font-bold text-kertas hover:brightness-125"
					href={GITHUB}
				>
					View on GitHub
				</a>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="border-t border-white/10 bg-malam">
			<div
				className={`${wrap} flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between`}
			>
				<div>
					<img
						src="/lunaz-horizontal-on-dark.svg"
						alt="Lunaz"
						width={132}
						height={32}
						className="h-8 w-auto"
					/>
					<p className="mt-4 max-w-md text-sm text-kertas/60">
						From the Indonesian "lunas", paid in full, plus z for Zcash. A
						Zecathon project, built on Zcash (Orchard shielded pools), NEAR
						Intents, Zebra and lightwalletd.
					</p>
				</div>
				<a
					className="text-sm font-bold text-lunas hover:underline"
					href={GITHUB}
				>
					GitHub
				</a>
			</div>
		</footer>
	);
}
