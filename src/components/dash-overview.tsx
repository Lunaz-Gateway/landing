import { Link, useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { type GeneratedWallet, generateWallet } from "#/lib/wallet-gen";
import {
	type Account,
	type ApiKey,
	type Invoice,
	setUfvk,
} from "#/server/dash";
import {
	CopyButton,
	CreateKeyForm,
	curlFor,
	type NewKey,
	NewKeyPanel,
	zec,
} from "./dash-sections";
import { btn, btn2, card, ErrorText, errMsg, input } from "./dash-ui";

type Props = {
	account: Account;
	keys: ApiKey[];
	invoices: Invoice[];
	webhook: { url: string | null };
};

type Step = {
	title: string;
	desc: string;
	done: boolean;
	optional?: boolean;
	body?: ReactNode;
};

const REQUIRED = 4;

export function Overview({ account, keys, invoices, webhook }: Props) {
	const active = keys.filter((k) => !k.revoked_at);
	const steps: Step[] = [
		{
			title: "Create your account",
			desc: `Signed in as ${account.email}.`,
			done: true,
		},
		{
			title: "Connect your wallet",
			desc: "Give Lunaz a viewing key so it can see incoming payments, never spend them.",
			done: account.ufvk_set,
			body: <WalletStep network={account.network} />,
		},
		{
			title: "Create an API key",
			desc: "Your server uses it to create invoices.",
			done: active.length > 0,
			body: <KeyStep />,
		},
		{
			title: "Create your first invoice",
			desc: "Call the API from your server or terminal.",
			done: invoices.length > 0,
			body: <InvoiceStep prefix={active[0]?.prefix} />,
		},
		{
			title: "Add a webhook",
			desc: "Get a signed request the moment an invoice is paid.",
			done: !!webhook.url,
			optional: true,
			body: (
				<Link to="/dashboard/webhooks" className={btn}>
					Set up a webhook
				</Link>
			),
		},
	];
	const current = steps.findIndex((s) => !s.done);
	const doneCount = steps.slice(0, REQUIRED).filter((s) => s.done).length;
	const onboarded = account.ufvk_set && active.length > 0;
	const [showSteps, setShowSteps] = useState(false);
	const expanded = !onboarded || showSteps;

	// Move focus to the new current step after it changes, not on first render
	const heads = useRef<(HTMLHeadingElement | null)[]>([]);
	const prev = useRef(current);
	const gsHead = useRef<HTMLHeadingElement>(null);
	useEffect(() => {
		if (prev.current !== current)
			(heads.current[current] ?? gsHead.current)?.focus();
		prev.current = current;
	}, [current]);

	return (
		<div className="space-y-6">
			{onboarded && <Stats invoices={invoices} />}
			<section className={card} aria-labelledby="gs-h">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 id="gs-h" ref={gsHead} tabIndex={-1} className="font-bold">
							Getting started
						</h2>
						<p className="text-sm text-kertas/70">
							{doneCount} of {REQUIRED} done
						</p>
					</div>
					{onboarded && (
						<button
							type="button"
							className={btn2}
							aria-expanded={showSteps}
							aria-controls="gs-steps"
							onClick={() => setShowSteps(!showSteps)}
						>
							{showSteps ? "Hide steps" : "Show steps"}
						</button>
					)}
				</div>
				<div
					className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
					role="progressbar"
					aria-label="Getting started progress"
					aria-valuemin={0}
					aria-valuemax={REQUIRED}
					aria-valuenow={doneCount}
				>
					<div
						className="progress-fill h-full origin-left rounded-full bg-lunas"
						style={{ transform: `scaleX(${doneCount / REQUIRED})` }}
					/>
				</div>
				{expanded && (
					<ol id="gs-steps" className="mt-6">
						{steps.map((s, i) => {
							const isCurrent = i === current;
							const future = current >= 0 && i > current;
							return (
								<li
									key={s.title}
									aria-current={isCurrent ? "step" : undefined}
									className="relative pb-6 pl-12 last:pb-0"
								>
									{i < steps.length - 1 && (
										<span
											aria-hidden="true"
											className={`absolute top-9 bottom-1 left-[15px] w-px ${s.done ? "bg-lunas/50" : "bg-white/10"}`}
										/>
									)}
									<span
										aria-hidden="true"
										className={`absolute top-0 left-0 grid size-8 place-items-center rounded-full border font-mono text-sm ${
											s.done
												? "border-lunas bg-lunas text-malam"
												: isCurrent
													? "border-lunas text-lunas"
													: "border-white/15 text-kertas/40"
										}`}
									>
										{s.done ? (
											<svg
												viewBox="0 0 16 16"
												aria-hidden="true"
												className="size-4"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.2"
											>
												<path d="M3.5 8.5l3 3 6-7" />
											</svg>
										) : (
											i + 1
										)}
									</span>
									<div className={future ? "opacity-50" : undefined}>
										<h3
											ref={(el) => {
												heads.current[i] = el;
											}}
											tabIndex={-1}
											className="pt-1 font-bold focus-visible:outline-lunas"
										>
											{s.title}
											{s.optional && (
												<span className="ml-2 font-normal text-xs text-kertas/60">
													Optional
												</span>
											)}
											<span className="sr-only">
												{s.done
													? " (done)"
													: isCurrent
														? " (current step)"
														: ""}
											</span>
										</h3>
										<p className="text-sm text-kertas/70">{s.desc}</p>
									</div>
									{isCurrent && s.body && <div className="mt-4">{s.body}</div>}
								</li>
							);
						})}
					</ol>
				)}
			</section>
		</div>
	);
}

function Stats({ invoices }: { invoices: Invoice[] }) {
	const paid = invoices.filter((i) => i.status === "paid");
	const pending = invoices.filter(
		(i) => i.status === "pending" || i.status === "detected",
	).length;
	const underpaid = invoices.filter((i) => i.status === "underpaid").length;
	const received = invoices.reduce((t, i) => t + i.received_zat, 0);
	const stats = [
		["Invoices paid", String(paid.length)],
		["Pending", String(pending)],
		...(underpaid > 0 ? [["Underpaid", String(underpaid)]] : []),
		["Total received", `${zec(received)} ZEC`],
	];
	return (
		<section aria-label="Invoice stats">
			<dl className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
				{stats.map(([k, v]) => (
					<div
						key={k}
						className={`${card} last:odd:col-span-2 sm:last:col-span-1`}
					>
						<dt className="text-sm text-kertas/70">{k}</dt>
						<dd className="mt-1 font-mono text-2xl font-semibold">{v}</dd>
					</div>
				))}
			</dl>
			<p className="mt-2 text-xs text-kertas/60">
				From your 50 most recent invoices.{" "}
				<Link to="/dashboard/invoices" className="underline">
					View invoices
				</Link>
			</p>
		</section>
	);
}

function KeyStep() {
	const router = useRouter();
	const [created, setCreated] = useState<NewKey | null>(null);
	// Reload only after dismissal, so the one-time key stays on screen
	return created ? (
		<NewKeyPanel
			created={created}
			onDone={() => {
				setCreated(null);
				router.invalidate();
			}}
		/>
	) : (
		<CreateKeyForm onCreated={setCreated} />
	);
}

function InvoiceStep({ prefix }: { prefix?: string }) {
	const router = useRouter();
	const cmd = curlFor(prefix ? `${prefix}...` : undefined);
	return (
		<div className="space-y-3">
			<p className="text-sm text-kertas/80">
				Set <code className="font-mono">$LUNAZ</code> to the API URL and replace
				the key with your full API key.
			</p>
			<pre className="overflow-x-auto rounded-lg border border-white/10 bg-malam p-3 font-mono text-xs leading-relaxed">
				{cmd}
			</pre>
			<div className="flex flex-wrap gap-2">
				<CopyButton text={cmd} label="Copy command" />
				<button
					type="button"
					className={btn2}
					onClick={() => router.invalidate()}
				>
					I've created one
				</button>
			</div>
		</div>
	);
}

const radioCard =
	"flex cursor-pointer gap-3 rounded-xl border border-white/15 bg-malam p-4 hover:border-white/30 has-[:checked]:border-lunas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lunas has-[:focus-visible]:outline-offset-2";

function WalletStep({ network }: { network: Account["network"] }) {
	const [mode, setMode] = useState<"gen" | "own" | null>(null);
	const options = [
		[
			"gen",
			"Generate a new wallet",
			"Lunaz creates a new wallet in your browser. You get a 24-word recovery phrase to import into ZODL; only the viewing key is sent to Lunaz.",
		],
		[
			"own",
			"Use my own viewing key",
			"Paste the Unified Full Viewing Key of a wallet you already have.",
		],
	] as const;
	return (
		<div className="space-y-4">
			<fieldset>
				<legend className="mb-2 text-sm font-medium">
					How do you want to connect?
				</legend>
				<div className="grid gap-3 sm:grid-cols-2">
					{options.map(([v, t, d]) => (
						<label key={v} className={radioCard}>
							<input
								type="radio"
								name="wallet-mode"
								value={v}
								checked={mode === v}
								onChange={() => setMode(v)}
								className="mt-1 size-4 shrink-0 accent-[#c8f169]"
							/>
							<span>
								<span className="block font-bold">{t}</span>
								<span className="mt-1 block text-sm text-kertas/70">{d}</span>
							</span>
						</label>
					))}
				</div>
			</fieldset>
			{mode === "gen" && <GenerateWallet onUseOwn={() => setMode("own")} />}
			{mode === "own" && <OwnKey network={network} />}
		</div>
	);
}

function useSaveUfvk() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const save = async (ufvk: string, after?: () => void) => {
		setBusy(true);
		setError("");
		try {
			await setUfvk({ data: { ufvk } });
			after?.();
			await router.invalidate();
		} catch (e) {
			setError(errMsg(e));
			setBusy(false);
		}
	};
	return { error, busy, save };
}

function GenerateWallet({ onUseOwn }: { onUseOwn: () => void }) {
	// The mnemonic lives only in this state; it is never sent or logged
	const [wallet, setWallet] = useState<GeneratedWallet | null>(null);
	const [genError, setGenError] = useState("");
	const [busyGen, setBusyGen] = useState(false);
	const [revealed, setRevealed] = useState(false);
	const [written, setWritten] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const { error, busy, save } = useSaveUfvk();
	const soon = genError === "Coming soon";
	const head = useRef<HTMLHeadingElement>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: focus on phase change
	useEffect(() => head.current?.focus(), [wallet, confirming]);

	if (!wallet)
		return (
			<div className="space-y-3 rounded-xl border border-white/10 bg-malam p-4">
				<button
					type="button"
					className={btn}
					disabled={busyGen}
					onClick={async () => {
						setBusyGen(true);
						setGenError("");
						try {
							setWallet(await generateWallet());
						} catch (e) {
							setGenError(errMsg(e));
						}
						setBusyGen(false);
					}}
				>
					{busyGen ? "Generating…" : "Generate wallet"}
				</button>
				{soon ? (
					<div className="flex flex-wrap items-center gap-3">
						<output className="text-sm text-kertas/80">
							Generating in the browser is coming soon — use your own viewing
							key for now.
						</output>
						<button type="button" className={btn2} onClick={onUseOwn}>
							Use my own viewing key
						</button>
					</div>
				) : (
					<ErrorText error={genError} />
				)}
			</div>
		);

	const words = wallet.mnemonic.split(/\s+/);
	if (confirming)
		return (
			<div className="space-y-3 rounded-xl border border-white/10 bg-malam p-4">
				<h4 ref={head} tabIndex={-1} className="font-bold">
					Save the viewing key
				</h4>
				<p className="text-sm text-kertas/80">
					Only this viewing key is sent to Lunaz. It can only be set once.
				</p>
				<dl className="space-y-2 text-sm">
					<div>
						<dt className="text-kertas/60">Receiving address</dt>
						<dd className="break-all font-mono text-xs">{wallet.address}</dd>
					</div>
					<div>
						<dt className="text-kertas/60">Viewing key</dt>
						<dd className="break-all font-mono text-xs">
							{wallet.ufvk.slice(0, 24)}…{wallet.ufvk.slice(-12)}
						</dd>
					</div>
				</dl>
				<ErrorText error={error} />
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						className={btn}
						disabled={busy}
						onClick={() => save(wallet.ufvk, () => setWallet(null))}
					>
						{busy ? "Saving…" : "Save viewing key"}
					</button>
					<button
						type="button"
						className={btn2}
						onClick={() => setConfirming(false)}
					>
						Back
					</button>
				</div>
			</div>
		);

	return (
		<div className="space-y-3 rounded-xl border border-white/10 bg-malam p-4">
			<h4 ref={head} tabIndex={-1} className="font-bold">
				Your recovery phrase
			</h4>
			<p className="text-sm text-kertas/80">
				Write these 24 words down in order and keep them offline. Anyone with
				them can spend your funds. Lunaz never sees them.
			</p>
			<div className="relative">
				<ol
					className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${revealed ? "" : "select-none blur-sm"}`}
					aria-hidden={!revealed}
				>
					{words.map((w, i) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: words can repeat
							key={i}
							className="rounded-lg border border-white/10 bg-malam-2 px-2 py-1.5 font-mono text-sm"
						>
							<span className="mr-1.5 text-kertas/40">{i + 1}</span>
							{w}
						</li>
					))}
				</ol>
				{!revealed && (
					<div className="absolute inset-0 grid place-items-center">
						<button
							type="button"
							className={btn2}
							onClick={() => setRevealed(true)}
						>
							Reveal phrase
						</button>
					</div>
				)}
			</div>
			<div className="flex flex-wrap gap-2">
				{revealed && (
					<button
						type="button"
						className={btn2}
						onClick={() => setRevealed(false)}
					>
						Hide
					</button>
				)}
				<CopyButton text={wallet.mnemonic} label="Copy phrase" />
			</div>
			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={written}
					onChange={(e) => setWritten(e.target.checked)}
					className="size-4 accent-[#c8f169]"
				/>
				I've written down my recovery phrase
			</label>
			<button
				type="button"
				className={btn}
				disabled={!written}
				onClick={() => setConfirming(true)}
			>
				Continue
			</button>
		</div>
	);
}

function OwnKey({ network }: { network: Account["network"] }) {
	const { error, busy, save } = useSaveUfvk();
	return (
		<form
			className="space-y-3 rounded-xl border border-white/10 bg-malam p-4"
			onSubmit={(e) => {
				e.preventDefault();
				save(String(new FormData(e.currentTarget).get("ufvk")));
			}}
		>
			<label htmlFor="ufvk" className="block text-sm font-medium">
				Unified Full Viewing Key
			</label>
			<textarea
				id="ufvk"
				name="ufvk"
				rows={4}
				required
				spellCheck={false}
				aria-describedby="ufvk-note"
				aria-invalid={!!error || undefined}
				placeholder={network === "main" ? "uview1…" : "uviewtest1…"}
				className={`${input} break-all font-mono`}
			/>
			<p id="ufvk-note" className="text-sm text-kertas/70">
				This can only be set once. Check that it is the right wallet before you
				save.
			</p>
			<details className="text-sm text-kertas/80">
				<summary className="cursor-pointer font-medium text-kertas">
					Where do I find it?
				</summary>
				<p className="mt-2">
					In ZODL, open the account settings and export the viewing key. With
					zcash-devtool, run{" "}
					<code className="font-mono">wallet list-accounts</code>; it prints the
					UFVK for each account. It starts with{" "}
					<code className="font-mono">
						{network === "main" ? "uview1" : "uviewtest1"}
					</code>
					.
				</p>
			</details>
			<ErrorText error={error} />
			<button type="submit" className={btn} disabled={busy}>
				{busy ? "Saving…" : "Save viewing key"}
			</button>
		</form>
	);
}
