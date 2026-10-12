import { useEffect, useRef, useState } from "react";

/*
  Diagram space is 160 x 100 viewBox units. HTML nodes sit at the same
  percentages so the SVG wires line up at every width (aspect is fixed).
*/
const pct = (x: number, y: number) => ({
	left: `${(x / 160) * 100}%`,
	top: `${y}%`,
});

const clients = [
	["Cashier tablet", 30],
	["Hosted checkout", 58],
	["Your app · API", 86],
] as const;
const tokens = [
	["ZEC", 58],
	["USDC", 74],
	["SOL", 90],
	["BTC", 106],
] as const;

const clientWire = (y: number, k: number) =>
	`M44 ${y} C52 ${y} 50 ${55 + k * 5} 58 ${55 + k * 5}`;
const tokenWire = (x: number, k: number) =>
	`M${x} 17 C${x} 27 ${71 + k * 6} 28 ${71 + k * 6} 38`;
const OUT = "M102 60 H118";

export function GatewayFlow() {
	return (
		<div className="relative aspect-[160/100] w-full">
			<svg
				viewBox="0 0 160 100"
				className="absolute inset-0 size-full overflow-visible"
				aria-hidden="true"
			>
				<g fill="none" stroke="rgba(246,242,233,0.18)" strokeWidth="0.4">
					{clients.map(([n, y], k) => (
						<path key={n} d={clientWire(y, k)} />
					))}
					{tokens.map(([n, x], k) => (
						<path key={n} d={tokenWire(x, k)} />
					))}
				</g>
				<path
					d={OUT}
					fill="none"
					stroke="#C8F169"
					strokeWidth="0.6"
					strokeDasharray="1.2 1.2"
					className="wire-flow"
				/>
				<g className="packets" fill="#F6F2E9">
					{clients.map(([n, y], k) => (
						<circle key={n} r="0.9" opacity="0">
							<animateMotion
								dur="2.6s"
								begin={`${0.4 + k * 0.85}s`}
								repeatCount="indefinite"
								path={clientWire(y, k)}
							/>
							<animate
								attributeName="opacity"
								values="0;1;1;0"
								dur="2.6s"
								begin={`${0.4 + k * 0.85}s`}
								repeatCount="indefinite"
							/>
						</circle>
					))}
					{tokens.map(([n, x], k) => (
						<circle key={n} r="0.9" opacity="0">
							<animateMotion
								dur="2.2s"
								begin={`${0.9 + k * 0.6}s`}
								repeatCount="indefinite"
								path={tokenWire(x, k)}
							/>
							<animate
								attributeName="opacity"
								values="0;1;1;0"
								dur="2.2s"
								begin={`${0.9 + k * 0.6}s`}
								repeatCount="indefinite"
							/>
						</circle>
					))}
					<circle r="1.3" fill="#C8F169" opacity="0">
						<animateMotion
							dur="1.3s"
							begin="1.4s"
							repeatCount="indefinite"
							path={OUT}
						/>
						<animate
							attributeName="opacity"
							values="0;1;1;0"
							dur="1.3s"
							begin="1.4s"
							repeatCount="indefinite"
						/>
					</circle>
				</g>
			</svg>

			{clients.map(([n, y], k) => (
				<div
					key={n}
					className="node-in absolute flex h-[14%] w-[27.5%] -translate-y-1/2 items-center rounded-md border border-white/12 bg-malam px-[3%] text-[clamp(9px,1.6vw,13px)] font-medium text-kertas/85"
					style={{ ...pct(0, y), animationDelay: `${k * 70}ms` }}
				>
					{n}
				</div>
			))}

			{tokens.map(([n, x], k) => (
				<div
					key={n}
					className="node-in absolute flex h-[12%] w-[9.5%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-malam font-mono text-[clamp(8px,1.35vw,12px)] text-kertas/80"
					style={{ ...pct(x, 11), animationDelay: `${200 + k * 60}ms` }}
				>
					{n}
				</div>
			))}
			<p
				className="absolute -translate-y-1/2 font-mono text-[clamp(7px,1.1vw,10px)] uppercase tracking-[0.14em] text-kertas/45"
				style={pct(0, 11)}
			>
				Pay with
			</p>
			<p
				className="absolute -translate-y-1/2 font-mono text-[clamp(7px,1.1vw,10px)] uppercase tracking-[0.14em] text-kertas/45"
				style={pct(118, 11)}
			>
				via NEAR Intents
			</p>

			<div
				className="node-in absolute flex h-[44%] w-[27.5%] flex-col items-center justify-center rounded-xl border border-white/20 bg-malam-2 text-center"
				style={{ ...pct(58, 38), animationDelay: "120ms" }}
			>
				<img
					src="/lunaz-symbol-on-dark.svg"
					alt=""
					width={40}
					height={40}
					className="size-[clamp(20px,3.6vw,40px)]"
				/>
				<p className="mt-[4%] text-[clamp(10px,1.7vw,15px)] font-bold">
					Lunaz gateway
				</p>
				<p className="font-mono text-[clamp(7px,1.15vw,11px)] text-kertas/55">
					viewing keys only
				</p>
			</div>

			<div
				className="node-in absolute flex h-[44%] w-[26%] flex-col justify-center rounded-xl border border-lunas/60 bg-malam px-[3%]"
				style={{ ...pct(118, 38), animationDelay: "240ms" }}
			>
				<p className="font-mono text-[clamp(7px,1.15vw,11px)] uppercase tracking-[0.12em] text-lunas">
					Shielded
				</p>
				<p className="mt-[3%] text-[clamp(10px,1.7vw,15px)] font-bold leading-tight">
					Merchant wallet
				</p>
				<p className="mt-[3%] font-mono text-[clamp(7px,1.15vw,11px)] text-kertas/55">
					spend key: yours
				</p>
			</div>
		</div>
	);
}

type Ev = { name: string; detail: string; lunas?: boolean };
const events = (inv: string): Ev[] => [
	{ name: "invoice.created", detail: `${inv} · new u1… address` },
	{ name: "swap.pending", detail: "USDC → ZEC · NEAR Intents" },
	{ name: "payment.detected", detail: "mempool · 0.2500 ZEC" },
	{ name: "invoice.paid", detail: "1 confirmation", lunas: true },
	{ name: "webhook.sent", detail: "200 OK · HMAC-SHA256" },
];
const STEP_MS = 1200;
const PAUSE_MS = 2500;

// Replays one invoice's events in order; the static first render is the full sequence
export function EventStream() {
	const [run, setRun] = useState({ n: 43, shown: 5 });
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let timer = 0;
		let cur = { n: 43, shown: 5 };
		const schedule = () => {
			const wait = cur.shown >= 5 ? PAUSE_MS : cur.shown === 0 ? 300 : STEP_MS;
			timer = window.setTimeout(() => {
				cur =
					cur.shown >= 5
						? { n: cur.n + 1, shown: 0 }
						: { ...cur, shown: cur.shown + 1 };
				setRun(cur);
				schedule();
			}, wait);
		};
		const io = new IntersectionObserver(([e]) => {
			clearTimeout(timer);
			if (e.isIntersecting) schedule();
		});
		if (ref.current) io.observe(ref.current);
		return () => {
			io.disconnect();
			clearTimeout(timer);
		};
	}, []);

	const inv = `inv_${String(run.n).padStart(4, "0")}`;
	const log = events(inv).slice(0, run.shown);

	return (
		<div
			ref={ref}
			className="rounded-xl border border-white/10 bg-black/20 font-mono text-[12px] sm:text-[13px]"
		>
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[11px] text-kertas/50">
				<span>events · wss://…/v1/invoices/{inv}</span>
				<span className="flex items-center gap-1.5 text-lunas">
					<span className="size-1.5 rounded-full bg-lunas" />
					live
				</span>
			</div>
			<ol
				className="h-[8.6rem] space-y-1 px-4 py-3 sm:h-[9.2rem]"
				aria-label="Example invoice events"
			>
				{log.map((e) => (
					<li
						key={`${inv}-${e.name}`}
						className="ev-in flex items-center gap-3 whitespace-nowrap"
					>
						<span className="text-kertas/35">›</span>
						<span className={e.lunas ? "text-lunas" : "text-kertas"}>
							{e.name}
						</span>
						<span className="truncate text-kertas/45">{e.detail}</span>
						{e.lunas && (
							<span className="ml-auto -rotate-3 rounded bg-lunas px-1.5 font-sans text-[11px] font-extrabold tracking-tight text-malam">
								LUNAS
							</span>
						)}
					</li>
				))}
			</ol>
		</div>
	);
}
