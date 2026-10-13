import { useEffect, useRef } from "react";

/*
  Diagram space is 160 x H viewBox units. HTML nodes sit at the same
  percentages so the SVG wires line up at every width (aspect is fixed).
*/
const H = 140;
const pct = (x: number, y: number) => ({
	left: `${(x / 160) * 100}%`,
	top: `${(y / H) * 100}%`,
});

const clients = [
	["Marketplace", 52],
	["Online store", 82],
	["Your app · API", 112],
] as const;
const tokens = [
	["ZEC", 58],
	["USDC", 74],
	["SOL", 90],
	["BTC", 106],
] as const;

const clientWire = (y: number, k: number) =>
	`M44 ${y} C52 ${y} 50 ${70 + k * 12} 58 ${70 + k * 12}`;
const tokenWire = (x: number, k: number) =>
	`M${x} 22 C${x} 34 ${71 + k * 6} 38 ${71 + k * 6} 54`;
const OUT = "M102 82 H118";

export function GatewayFlow() {
	const svg = useRef<SVGSVGElement>(null);
	// SMIL keeps running off screen; pause it there
	useEffect(() => {
		const el = svg.current;
		if (!el) return;
		const io = new IntersectionObserver(([e]) =>
			e.isIntersecting ? el.unpauseAnimations() : el.pauseAnimations(),
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return (
		<div className="relative aspect-[160/140] w-full">
			<svg
				ref={svg}
				viewBox={`0 0 160 ${H}`}
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
					className="node-in absolute flex h-[10%] w-[27.5%] -translate-y-1/2 items-center rounded-md border border-white/12 bg-malam px-[3%] text-[clamp(9px,1.6vw,13px)] font-medium text-kertas/85"
					style={{ ...pct(0, y), animationDelay: `${k * 70}ms` }}
				>
					{n}
				</div>
			))}

			{tokens.map(([n, x], k) => (
				<div
					key={n}
					className="node-in absolute flex h-[9%] w-[9.5%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-malam font-mono text-[clamp(8px,1.35vw,12px)] text-kertas/80"
					style={{ ...pct(x, 16), animationDelay: `${200 + k * 60}ms` }}
				>
					{n}
				</div>
			))}
			<p
				className="absolute -translate-y-1/2 font-mono text-[clamp(7px,1.1vw,10px)] uppercase tracking-[0.14em] text-kertas/45"
				style={pct(0, 16)}
			>
				Pay with
			</p>
			<p
				className="absolute -translate-y-1/2 font-mono text-[clamp(7px,1.1vw,10px)] uppercase tracking-[0.14em] text-kertas/45"
				style={pct(118, 16)}
			>
				via NEAR Intents
			</p>

			<div
				className="node-in absolute flex h-[40%] w-[27.5%] flex-col items-center justify-center rounded-xl border border-white/20 bg-malam-2 text-center"
				style={{ ...pct(58, 54), animationDelay: "120ms" }}
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
				<p className="font-mono text-[clamp(7px,1.15vw,11px)] text-kertas/60">
					viewing keys only
				</p>
			</div>

			<div
				className="node-in absolute flex h-[40%] w-[26%] flex-col justify-center rounded-xl border border-lunas/60 bg-malam px-[3%]"
				style={{ ...pct(118, 54), animationDelay: "240ms" }}
			>
				<p className="font-mono text-[clamp(7px,1.15vw,11px)] uppercase tracking-[0.12em] text-lunas">
					Shielded
				</p>
				<p className="mt-[3%] text-[clamp(10px,1.7vw,15px)] font-bold leading-tight">
					Each seller's wallet
				</p>
				<p className="mt-[3%] font-mono text-[clamp(7px,1.15vw,11px)] text-kertas/60">
					spend key: theirs
				</p>
			</div>
		</div>
	);
}
