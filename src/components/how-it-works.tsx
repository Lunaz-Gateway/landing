import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";

const t = (ms: number) => ({ "--t": `${ms}ms` }) as CSSProperties;

const steps = [
	{
		title: "Invoice",
		body: "A buyer places an order and the shop's backend creates an invoice with its API key. Lunaz derives a fresh shielded address for it from that merchant's viewing key. No two invoices share an address, so nothing on chain links them to each other or to the shop.",
	},
	{
		title: "Pay",
		body: "A ZEC buyer scans the ZIP-321 QR with their wallet. A buyer holding USDC, USDT, SOL, ETH or BTC gets a one-time deposit address from NEAR Intents, which swaps the funds and delivers shielded ZEC straight to the invoice address.",
		note: "Cross-chain needs an invoice of at least 0.001 ZEC. The deposit on the origin chain is public; nothing links it to the shop.",
	},
	{
		title: "Detected",
		body: "The watcher trial-decrypts Orchard and Ironwood actions in the mempool with the merchant's viewing key and matches the payment to its invoice. Checkout moves from Waiting to Detected in seconds, before the block lands.",
	},
	{
		title: "LUNAS",
		body: "After one block confirmation, about 75 seconds, the invoice turns LUNAS: paid in full. The shop's backend gets a signed webhook. A short payment is marked underpaid, never paid.",
	},
	{
		title: "Settled",
		body: "The funds sit in the merchant's own shielded wallet. The server only holds a viewing key: it can see payments, but it can never move them.",
	},
] as const;

export function HowItWorks() {
	const [active, setActive] = useState(0);
	const [reached, setReached] = useState(-1);
	const refs = useRef<(HTMLLIElement | null)[]>([]);

	useEffect(() => {
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					const i = Number((e.target as HTMLElement).dataset.i);
					setActive(i);
					setReached((r) => Math.max(r, i));
				}
			},
			{ rootMargin: "-45% 0px -45% 0px" },
		);
		for (const el of refs.current) if (el) io.observe(el);
		return () => io.disconnect();
	}, []);

	return (
		<section id="how" className="relative bg-malam">
			<div className="mx-auto w-full max-w-7xl px-5 pt-24 sm:px-8 sm:pt-32">
				<div className="grid gap-6 lg:grid-cols-12">
					<p className="font-mono text-sm uppercase tracking-[0.2em] text-lunas lg:col-span-3">
						How it works
					</p>
					<h2 className="text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:col-span-9">
						One payment, start to finish.
						<span className="block text-kertas/50">
							Five stages, nothing public.
						</span>
					</h2>
				</div>

				<div className="mt-16 grid gap-10 pb-24 sm:pb-32 lg:mt-8 lg:grid-cols-12">
					<ol className="lg:col-span-5">
						{steps.map((s, i) => (
							<li
								key={s.title}
								ref={(el) => {
									refs.current[i] = el;
								}}
								data-i={i}
								className="flex flex-col justify-center border-t border-white/10 py-10 lg:min-h-[min(78vh,44rem)] lg:border-0 lg:py-0"
							>
								<div className="step-copy" data-on={active === i}>
									<p className="font-mono text-sm text-lunas tabular-nums">
										{String(i + 1).padStart(2, "0")} / 05
									</p>
									<h3 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
										{s.title}
									</h3>
									<p className="mt-4 max-w-md text-lg leading-relaxed text-kertas/75">
										{s.body}
									</p>
									{"note" in s && (
										<p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-kertas/60">
											{s.note}
										</p>
									)}
								</div>
								<div className="stage-inline mt-8">
									<Screen>
										<Visual i={i} on={reached >= i} />
									</Screen>
								</div>
							</li>
						))}
					</ol>

					<div className="stage-sticky lg:col-span-7">
						<div className="sticky top-[calc(50vh-15.5rem)] flex gap-6">
							<Progress active={active} />
							<Screen className="relative h-[31rem] flex-1">
								{steps.map((s, i) => (
									<div
										key={s.title}
										className="stage-panel absolute inset-6 sm:inset-8"
										data-on={active === i}
										aria-hidden={active !== i}
									>
										<Visual i={i} on={active === i} />
									</div>
								))}
							</Screen>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function Progress({ active }: { active: number }) {
	return (
		<div
			className="relative w-0.5 self-stretch rounded-full bg-white/10"
			aria-hidden="true"
		>
			<div
				className="progress-fill absolute inset-x-0 top-0 h-full origin-top bg-lunas"
				style={{ transform: `scaleY(${(active + 1) / steps.length})` }}
			/>
		</div>
	);
}

function Screen({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`overflow-hidden rounded-[1.75rem] border border-white/12 bg-malam-2 p-6 sm:p-8 ${className}`}
		>
			{children}
		</div>
	);
}

const visuals: ((p: { on: boolean }) => ReactNode)[] = [
	InvoiceV,
	PayV,
	DetectV,
	LunasV,
	SettleV,
];

function Visual({ i, on }: { i: number; on: boolean }) {
	const V = visuals[i];
	return (
		<div data-on={on} className="h-full">
			<V on={on} />
		</div>
	);
}

const label =
	"font-mono text-[11px] uppercase tracking-[0.18em] text-kertas/60";
const ADDR = "u1x9ph4w0kq7e3lzd52uv8cmt6rjy0ns4fa9gk2hw7pe3vq5m8c";

function InvoiceV({ on }: { on: boolean }) {
	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex items-baseline justify-between">
				<span className={label}>Invoice #0043</span>
				<span className="font-mono text-2xl font-medium tabular-nums">
					0.2500 ZEC
				</span>
			</div>
			<div className="seq rounded-xl border border-white/10 p-4" style={t(0)}>
				<p className={label}>Viewing key</p>
				<p className="mt-2 font-mono text-sm text-kertas/70">
					uview1qp8…{" "}
					<span className="rounded bg-kertas/15 px-8 text-transparent">
						hidden
					</span>
				</p>
			</div>
			<p className="seq -my-1 pl-4 font-mono text-xs text-lunas" style={t(150)}>
				↓ derive new address
			</p>
			<div
				className="seq rounded-xl border border-lunas/50 bg-malam p-4"
				style={t(250)}
			>
				<p className={label}>Pay to</p>
				<p className="mt-2 break-all font-mono text-[15px] leading-relaxed text-lunas">
					<Scramble text={ADDR} on={on} />
				</p>
			</div>
			<ul className="space-y-1.5 font-mono text-xs text-kertas/55">
				<li className="seq-fade" style={t(900)}>
					#0042 u1m3tz8vr…k0q2 · used once
				</li>
				<li className="seq-fade" style={t(980)}>
					#0041 u1c7wa4lp…9xhd · used once
				</li>
			</ul>
		</div>
	);
}

const CHARS = "abcdefghjkmnpqrstuvwxyz0234567890";

function Scramble({ text, on }: { text: string; on: boolean }) {
	const [out, setOut] = useState(text);
	useEffect(() => {
		if (!on || matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setOut(text);
			return;
		}
		const start = performance.now() + 350;
		let raf = 0;
		const tick = (now: number) => {
			const settled = Math.max(0, Math.floor((now - start) / 18));
			setOut(
				text
					.split("")
					.map((c, k) =>
						k < 2 || k < settled
							? c
							: CHARS[(Math.random() * CHARS.length) | 0],
					)
					.join(""),
			);
			if (settled < text.length) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [on, text]);
	return (
		<>
			<span aria-hidden="true">{out}</span>
			<span className="sr-only">{text}</span>
		</>
	);
}

// Deterministic decorative QR-like pattern (not a scannable code)
const QR = (() => {
	const n = 25;
	let seed = 7;
	const rnd = () => {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	};
	const finder = (x: number, y: number) =>
		[
			[0, 0],
			[n - 7, 0],
			[0, n - 7],
		].some(
			([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7,
		);
	let d = "";
	for (let y = 0; y < n; y++)
		for (let x = 0; x < n; x++)
			if (!finder(x, y) && rnd() > 0.52) d += `M${x} ${y}h1v1h-1z`;
	for (const [fx, fy] of [
		[0, 0],
		[n - 7, 0],
		[0, n - 7],
	])
		d += `M${fx} ${fy}h7v7h-7zM${fx + 1} ${fy + 1}v5h5v-5zM${fx + 2} ${fy + 2}h3v3h-3z`;
	return { n, d };
})();

function PayV() {
	return (
		<div className="grid h-full gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
			<div className="relative mx-auto w-44 rounded-xl bg-kertas p-3 sm:w-48">
				<svg
					viewBox={`0 0 ${QR.n} ${QR.n}`}
					className="seq-qr block w-full"
					style={t(100)}
					role="img"
					aria-label="ZIP-321 payment QR"
				>
					<path d={QR.d} fill="#1C1F3D" fillRule="evenodd" />
				</svg>
				<div
					className="seq-scan pointer-events-none absolute inset-x-2 top-3 h-0.5 rounded bg-malam/60 opacity-0"
					style={{ ...t(100), "--h": "11rem" } as CSSProperties}
				/>
			</div>
			<div className="space-y-5">
				<div>
					<p className={label}>ZIP-321</p>
					<p className="mt-1 break-all font-mono text-sm text-kertas/80">
						zcash:u1x9ph4w0k…?amount=0.25
					</p>
				</div>
				<div className="seq border-t border-white/10 pt-5" style={t(1000)}>
					<p className={label}>Or from another chain · NEAR Intents</p>
					<div className="relative mt-4 h-10">
						<div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
						<div
							className="seq-travel absolute inset-y-0 left-0 right-16"
							style={{ ...t(1300), "--d": "100%" } as CSSProperties}
						>
							<span className="swap-stack absolute left-0 top-1 rounded-full bg-kertas px-3 py-1 font-mono text-xs font-semibold text-malam">
								<span className="swap-before" style={t(1950)}>
									USDC
								</span>
								<span className="swap-after" style={t(1950)}>
									ZEC
								</span>
							</span>
						</div>
					</div>
					<div className="mt-1 flex justify-between font-mono text-[11px] text-kertas/50">
						<span>USDC · SOL</span>
						<span>swap</span>
						<span className="text-lunas">shielded ZEC</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function DetectV() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between">
				<span className={label}>Invoice #0043</span>
				<span className="relative inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs">
					<span className="grid size-2">
						<span
							className="swap-before size-2 rounded-full bg-kertas/40 [grid-area:1/1]"
							style={t(1100)}
						/>
						<span
							className="swap-after relative block size-2 rounded-full bg-lunas text-lunas [grid-area:1/1]"
							style={t(1100)}
						>
							<span className="ring" style={t(1100)} />
						</span>
					</span>
					<span className="swap-stack">
						<span className="swap-before" style={t(1100)}>
							Waiting
						</span>
						<span className="swap-after text-lunas" style={t(1100)}>
							Detected
						</span>
					</span>
				</span>
			</div>
			<p className="mt-8 font-mono text-5xl font-medium tabular-nums tracking-tight">
				0.2500 <span className="text-kertas/50">ZEC</span>
			</p>
			<Mempool />
			<ul className="mt-auto space-y-2 pt-6 font-mono text-[13px] text-kertas/70">
				<li className="seq" style={t(150)}>
					<span className="text-kertas/35">watcher › </span>scanning mempool
				</li>
				<li className="seq" style={t(1000)}>
					<span className="text-kertas/35">watcher › </span>shielded tx matches
					invoice #0043
				</li>
				<li className="seq" style={t(1500)}>
					<span className="text-kertas/35">watcher › </span>waiting for 1 block
					confirmation
				</li>
			</ul>
		</div>
	);
}

const POOL = Array.from({ length: 36 }, (_, k) => k);

// The matching transaction lights up among unrelated mempool traffic
function Mempool() {
	return (
		<div className="mt-8">
			<p className={label}>Mempool</p>
			<div className="mt-3 grid grid-cols-12 gap-1.5">
				{POOL.map((k) =>
					k === 22 ? (
						<span
							key={k}
							className="relative h-4 rounded-sm text-lunas"
							aria-hidden="true"
						>
							<span
								className="swap-before absolute inset-0 rounded-sm bg-kertas/12"
								style={t(1000)}
							/>
							<span
								className="swap-after absolute inset-0 rounded-sm bg-lunas"
								style={t(1000)}
							/>
						</span>
					) : (
						<span
							key={k}
							className="seq-fade h-4 rounded-sm bg-kertas/12"
							style={t((k * 37) % 700)}
							aria-hidden="true"
						/>
					),
				)}
			</div>
		</div>
	);
}

function LunasV() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between font-mono text-xs text-kertas/60">
				<span>Confirmations</span>
				<span className="swap-stack tabular-nums">
					<span className="swap-before" style={t(1000)}>
						0 / 1
					</span>
					<span className="swap-after text-lunas" style={t(1000)}>
						1 / 1
					</span>
				</span>
			</div>
			<div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
				<div className="seq-grow h-full origin-left bg-lunas" style={t(100)} />
			</div>
			<div className="flex flex-1 items-center justify-center py-8 sm:py-10">
				<p
					className="seq-stamp text-7xl font-extrabold tracking-tight text-lunas sm:text-8xl"
					style={{ ...t(1100), transform: "rotate(-7deg)" }}
				>
					LUNAS
				</p>
			</div>
			<p className="text-center font-mono text-xs text-kertas/55">
				Invoice #0043 · 0.2500 ZEC · paid in full
			</p>
		</div>
	);
}

function Check() {
	return (
		<svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
			<path
				d="M3 8.5l3 3 7-7"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
function Cross() {
	return (
		<svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
			<path
				d="M4 4l8 8M12 4l-8 8"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
function Eye() {
	return (
		<svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
			<path
				d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
			/>
			<circle cx="12" cy="12" r="3" fill="currentColor" />
		</svg>
	);
}
function Key() {
	return (
		<svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
			<circle
				cx="8"
				cy="12"
				r="4"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
			/>
			<path
				d="M12 12h9M18 12v3M21 12v2"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function SettleV() {
	return (
		<div className="grid h-full gap-4">
			<div className="seq rounded-xl border border-white/12 p-4" style={t(0)}>
				<p className={label}>Lunaz server</p>
				<ul className="mt-3 space-y-2 text-sm">
					<li className="flex items-center gap-3">
						<Eye />
						<span className="flex-1">Viewing key: can see payments</span>
						<span className="text-lunas">
							<Check />
						</span>
					</li>
					<li className="flex items-center gap-3 text-kertas/45">
						<Key />
						<span className="flex-1 line-through decoration-kertas/40">
							Spending key
						</span>
						<Cross />
					</li>
				</ul>
			</div>
			<svg
				viewBox="0 0 200 40"
				className="mx-auto h-8 w-40 text-lunas"
				aria-hidden="true"
			>
				<path
					d="M100 2 V38 M92 30 L100 38 L108 30"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeDasharray="60"
					className="seq-draw"
					style={{ ...t(400), "--len": 60 } as CSSProperties}
				/>
			</svg>
			<div
				className="seq rounded-xl border border-lunas/50 bg-malam p-4"
				style={t(900)}
			>
				<p className={label}>Merchant wallet · your keys</p>
				<div className="mt-3 flex items-center gap-3 text-sm">
					<Key />
					<span className="flex-1">Spending key stays here</span>
					<span className="text-lunas">
						<Check />
					</span>
				</div>
				<p className="mt-4 font-mono text-2xl tabular-nums text-lunas">
					+0.2500 ZEC <span className="text-sm text-kertas/55">shielded</span>
				</p>
			</div>
			<p className="seq-fade text-sm text-kertas/60" style={t(1300)}>
				If the server is breached, funds cannot move.
			</p>
		</div>
	);
}
