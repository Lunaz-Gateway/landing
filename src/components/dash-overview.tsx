import { Link, useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { type GeneratedWallet, generateWallet } from "#/lib/wallet-gen";
import {
	type Account,
	type ApiKey,
	type Invoice,
	setUfvk,
	testWebhook,
} from "#/server/dash";
import {
	Code,
	CreateKeyForm,
	curlFor,
	KeyRevealDialog,
	type NewKey,
	StatusPill,
} from "./dash-sections";
import {
	Amount,
	Button,
	button,
	Card,
	CopyButton,
	ErrorText,
	errMsg,
	Icon,
	type IconName,
	PageHeader,
	Spinner,
	Table,
	Textarea,
	Time,
	td,
	th,
	useAction,
	zec,
} from "./dash-ui";

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
				<Link to="/dashboard/webhooks" className={button("primary")}>
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

	const timeline = (
		<section className="dash-card p-5" aria-labelledby="gs-h">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2
						id="gs-h"
						ref={gsHead}
						tabIndex={-1}
						className="dash-focus rounded-sm text-[15px] font-bold"
					>
						Getting started
					</h2>
					<p className="mt-0.5 text-sm text-kertas/65 tabular-nums">
						{doneCount} of {REQUIRED} done
						{onboarded && !webhook.url && " · webhook optional"}
					</p>
				</div>
				{onboarded && (
					<Button
						size="sm"
						aria-expanded={showSteps}
						aria-controls="gs-steps"
						onClick={() => setShowSteps(!showSteps)}
					>
						{showSteps ? "Hide steps" : "Show steps"}
					</Button>
				)}
			</div>
			<div
				className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
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
									className={`absolute top-0 left-0 grid size-8 place-items-center rounded-full border text-sm font-medium tabular-nums ${
										s.done
											? "border-lunas bg-lunas text-malam"
											: isCurrent
												? "border-lunas text-lunas"
												: "border-white/15 text-kertas/40"
									}`}
								>
									{s.done ? <Icon name="check" /> : i + 1}
								</span>
								<div className={future ? "opacity-50" : undefined}>
									<h3
										ref={(el) => {
											heads.current[i] = el;
										}}
										tabIndex={-1}
										className="dash-focus rounded-sm pt-1 font-bold"
									>
										{s.title}
										{s.optional && (
											<span className="ml-2 text-xs font-normal text-kertas/55">
												Optional
											</span>
										)}
										<span className="sr-only">
											{s.done ? " (done)" : isCurrent ? " (current step)" : ""}
										</span>
									</h3>
									<p className="text-sm text-kertas/65">{s.desc}</p>
								</div>
								{isCurrent && s.body && <div className="mt-4">{s.body}</div>}
							</li>
						);
					})}
				</ol>
			)}
		</section>
	);

	if (!onboarded)
		return (
			<>
				<PageHeader
					title={`Welcome, ${account.name}`}
					description="A few steps and you're ready to take private payments."
				/>
				{timeline}
			</>
		);

	return (
		<>
			<PageHeader
				title="Overview"
				description={`Welcome back, ${account.name}.`}
			/>
			<div className="space-y-6">
				<Stats invoices={invoices} />
				<div className="grid gap-6 lg:grid-cols-3">
					<RecentInvoices invoices={invoices} />
					<QuickActions hasWebhook={!!webhook.url} />
				</div>
				{timeline}
			</div>
		</>
	);
}

function Stats({ invoices }: { invoices: Invoice[] }) {
	const paid = invoices.filter((i) => i.status === "paid").length;
	const pending = invoices.filter(
		(i) => i.status === "pending" || i.status === "detected",
	).length;
	const underpaid = invoices.filter((i) => i.status === "underpaid").length;
	const received = invoices.reduce((t, i) => t + i.received_zat, 0);
	const stats: {
		label: string;
		value: ReactNode;
		hint: string;
		warn?: boolean;
	}[] = [
		{
			label: "Invoices paid",
			value: paid,
			hint: `of ${invoices.length} invoices`,
		},
		{
			label: "Received",
			value: (
				<>
					{zec(received)}{" "}
					<span className="text-base font-medium text-kertas/50">ZEC</span>
				</>
			),
			hint: "Across all statuses",
		},
		{ label: "Awaiting payment", value: pending, hint: "Pending or detected" },
		...(underpaid > 0
			? [
					{
						label: "Underpaid",
						value: underpaid,
						hint: "Need follow-up",
						warn: true,
					},
				]
			: []),
	];
	return (
		<section aria-label="Invoice stats">
			<dl
				className={`grid grid-cols-2 gap-3 sm:gap-4 ${stats.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
			>
				{stats.map((s, i) => (
					<div
						key={s.label}
						className={`dash-card p-4 sm:p-5 ${stats.length === 3 && i === 2 ? "col-span-2 lg:col-span-1" : ""}`}
					>
						<dt className="flex items-center gap-1.5 text-sm text-kertas/65">
							{s.warn && (
								<span className="size-1.5 rounded-full bg-[#ffb86b]" />
							)}
							{s.label}
						</dt>
						<dd className="mt-2 text-2xl font-bold tracking-[-0.02em] tabular-nums sm:text-[28px]">
							{s.value}
						</dd>
						<dd className="mt-1 text-xs text-kertas/50">{s.hint}</dd>
					</div>
				))}
			</dl>
			{invoices.length >= 200 && (
				<p className="mt-2 text-xs text-kertas/55">
					Based on your 200 most recent invoices.
				</p>
			)}
		</section>
	);
}

function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
	return (
		<Card
			title="Recent invoices"
			className="lg:col-span-2"
			flush
			actions={
				<Link to="/dashboard/invoices" className={button("ghost", "sm")}>
					View all
					<Icon name="arrow" className="size-3.5" />
				</Link>
			}
		>
			<Table
				caption="Recent invoices"
				head={
					<>
						<th className={th}>Invoice</th>
						<th className={th}>Status</th>
						<th className={`${th} text-right`}>Amount</th>
						<th className={`${th} text-right`}>Created</th>
					</>
				}
			>
				{invoices.slice(0, 5).map((i) => (
					<tr key={i.id}>
						<td className={td} data-label="Invoice">
							<Link
								to="/dashboard/invoices"
								search={{ id: i.id }}
								className="dash-focus rounded-sm font-mono text-[13px] underline decoration-white/20 underline-offset-2 hover:decoration-kertas"
							>
								{i.id.slice(0, 8)}
							</Link>
						</td>
						<td className={td} data-label="Status">
							<StatusPill status={i.status} />
						</td>
						<td className={`${td} text-right`} data-label="Amount" data-end>
							<Amount zat={i.amount_zat} />
						</td>
						<td className={`${td} text-right`} data-label="Created" data-end>
							<Time s={i.created_at} />
						</td>
					</tr>
				))}
			</Table>
		</Card>
	);
}

function QuickActions({ hasWebhook }: { hasWebhook: boolean }) {
	const { run, busy } = useAction();
	const item =
		"dash-focus flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.05] disabled:opacity-50";
	const ic = (n: IconName) => (
		<span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-kertas/75">
			<Icon name={n} />
		</span>
	);
	return (
		<Card title="Quick actions" flush>
			<div className="space-y-0.5 px-2 pb-3">
				<Link to="/dashboard/keys" className={item}>
					{ic("key")}
					<span className="flex-1">Create an API key</span>
				</Link>
				<Link
					to="/dashboard/invoices"
					search={{ export: true }}
					className={item}
				>
					{ic("download")}
					<span className="flex-1">Export CSV for your accountant</span>
				</Link>
				{hasWebhook ? (
					<button
						type="button"
						className={item}
						disabled={busy === "test"}
						onClick={() =>
							run(
								"test",
								() => testWebhook(),
								(r) =>
									r.status >= 200 && r.status < 300
										? `Test delivered (${r.status})`
										: `Your endpoint answered ${r.status}`,
							)
						}
					>
						{ic("send")}
						<span className="flex-1">Send a test webhook</span>
						{busy === "test" && <Spinner />}
					</button>
				) : (
					<Link to="/dashboard/webhooks" className={item}>
						{ic("hook")}
						<span className="flex-1">Set up a webhook</span>
					</Link>
				)}
				<a href="/#developers" className={item}>
					{ic("docs")}
					<span className="flex-1">Read the API docs</span>
				</a>
			</div>
		</Card>
	);
}

function KeyStep() {
	const router = useRouter();
	const [created, setCreated] = useState<NewKey | null>(null);
	// Reload only after dismissal, so the one-time key stays on screen
	return (
		<>
			<CreateKeyForm onCreated={setCreated} />
			<KeyRevealDialog
				created={created}
				onDone={() => {
					setCreated(null);
					router.invalidate();
				}}
			/>
		</>
	);
}

function InvoiceStep({ prefix }: { prefix?: string }) {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const cmd = curlFor(prefix ? `${prefix}...` : undefined);
	return (
		<div className="space-y-3">
			<p className="text-sm text-kertas/75">
				Set <code className="font-mono">$LUNAZ</code> to the API URL and replace
				the key with your full API key.
			</p>
			<Code copy="Copy command">{cmd}</Code>
			<Button
				pending={busy}
				onClick={async () => {
					setBusy(true);
					await router.invalidate();
					setBusy(false);
				}}
			>
				I've created one
			</Button>
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
			<div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#1f2246] p-4">
				<button
					type="button"
					className={button("primary")}
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
						<button type="button" className={button()} onClick={onUseOwn}>
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
			<div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#1f2246] p-4">
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
						className={button("primary")}
						disabled={busy}
						onClick={() => save(wallet.ufvk, () => setWallet(null))}
					>
						{busy ? "Saving…" : "Save viewing key"}
					</button>
					<button
						type="button"
						className={button()}
						onClick={() => setConfirming(false)}
					>
						Back
					</button>
				</div>
			</div>
		);

	return (
		<div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#1f2246] p-4">
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
							className={button()}
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
						className={button()}
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
				className={button("primary")}
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
			className="space-y-3 rounded-xl border border-white/[0.08] bg-[#1f2246] p-4"
			onSubmit={(e) => {
				e.preventDefault();
				save(String(new FormData(e.currentTarget).get("ufvk")));
			}}
		>
			<Textarea
				id="ufvk"
				label="Unified Full Viewing Key"
				rows={4}
				required
				spellCheck={false}
				placeholder={network === "main" ? "uview1…" : "uviewtest1…"}
				className="[&_textarea]:font-mono [&_textarea]:break-all"
				hint="This can only be set once. Check that it is the right wallet before you save."
			/>
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
			<Button type="submit" variant="primary" pending={busy}>
				Save viewing key
			</Button>
		</form>
	);
}
