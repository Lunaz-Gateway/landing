import { type ReactNode, useEffect, useState } from "react";

export const errMsg = (e: unknown) =>
	e instanceof Error ? e.message : "Something went wrong";

export const btn =
	"press inline-flex items-center justify-center rounded-full bg-lunas px-5 py-2.5 text-sm font-bold text-malam focus-visible:outline-lunas disabled:opacity-50";
export const btn2 =
	"press inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-kertas hover:border-white/40 focus-visible:outline-lunas disabled:opacity-50";
export const input =
	"w-full rounded-lg border border-white/15 bg-malam px-3 py-2.5 text-sm text-kertas placeholder:text-kertas/40 focus-visible:outline-lunas";
export const card = "rounded-xl border border-white/10 bg-malam-2 p-5 sm:p-6";

export function Field({
	label,
	id,
	...props
}: {
	label: string;
	id: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<div>
			<label htmlFor={id} className="mb-1.5 block text-sm font-medium">
				{label}
			</label>
			<input id={id} name={id} className={input} {...props} />
		</div>
	);
}

export function ErrorText({ error }: { error: string }) {
	return (
		<p
			role="alert"
			className={error ? "text-sm text-[#ff9b8a]" : "sr-only"}
			aria-live="assertive"
		>
			{error}
		</p>
	);
}

export function PasswordField({
	label,
	hint,
	...props
}: {
	label: string;
	hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
	const [show, setShow] = useState(false);
	return (
		<div>
			<label htmlFor="password" className="mb-1.5 block text-sm font-medium">
				{label}
			</label>
			<div className="relative">
				<input
					id="password"
					name="password"
					type={show ? "text" : "password"}
					aria-describedby={hint ? "password-hint" : undefined}
					className={`${input} pr-16`}
					{...props}
				/>
				<button
					type="button"
					onClick={() => setShow(!show)}
					aria-pressed={show}
					className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-xs font-medium text-kertas/70 hover:text-kertas focus-visible:outline-lunas"
				>
					{show ? "Hide" : "Show"}
				</button>
			</div>
			{hint && (
				<p id="password-hint" className="mt-1.5 text-xs text-kertas/60">
					{hint}
				</p>
			)}
		</div>
	);
}

const points = [
	[
		"Non-custodial",
		"Viewing keys only. Lunaz can see payments, never spend them.",
	],
	["Private by default", "A fresh shielded address for every invoice."],
	[
		"Signed webhooks",
		"HMAC-SHA256 on every delivery, verified with your secret.",
	],
];

const REQ = `POST /v1/invoices
Authorization: Bearer lz_...

{ "amount_zat": 10000 }`;
const HOOK = `X-Lunaz-Signature: 8e13de7b...

{
  "type": "invoice.paid",
  "status": "paid",
  "received_zat": 10000
}`;

export function AuthCard({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle: string;
	children: ReactNode;
}) {
	useEffect(() => {
		document.getElementById("email")?.focus();
	}, []);
	return (
		<div className="grid min-h-screen bg-malam lg:grid-cols-2">
			<main className="flex flex-col px-5 py-8 sm:px-12">
				<div className="flex items-center justify-between">
					<a href="/" aria-label="Lunaz home">
						<img
							src="/lunaz-horizontal-on-dark.svg"
							alt="Lunaz"
							width={118}
							height={32}
							className="h-8 w-auto"
						/>
					</a>
					<a href="/" className="text-sm text-kertas/70 hover:text-kertas">
						Back to site
					</a>
				</div>
				<div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
					<h1 className="text-2xl font-extrabold">{title}</h1>
					<p className="mb-7 mt-1.5 text-sm text-kertas/70">{subtitle}</p>
					{children}
				</div>
			</main>
			<aside
				aria-hidden="true"
				className="relative hidden flex-col justify-center gap-8 overflow-hidden border-l border-white/10 bg-malam-2 p-12 lg:flex"
				style={{
					backgroundImage:
						"radial-gradient(rgb(246 242 233 / 0.12) 1px, transparent 1px)",
					backgroundSize: "22px 22px",
				}}
			>
				<div className="max-w-md space-y-3">
					{[REQ, HOOK].map((c) => (
						<pre
							key={c}
							className="overflow-hidden rounded-xl border border-white/10 bg-malam p-4 font-mono text-xs leading-relaxed text-kertas/90 shadow-xl"
						>
							{c}
						</pre>
					))}
				</div>
				<ul className="max-w-md space-y-4">
					{points.map(([h, b]) => (
						<li key={h} className="text-sm">
							<span className="font-bold text-lunas">{h}</span>
							<span className="text-kertas/70"> — {b}</span>
						</li>
					))}
				</ul>
			</aside>
		</div>
	);
}
