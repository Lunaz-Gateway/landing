import { useRouter } from "@tanstack/react-router";
import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Amount,
	Badge,
	Button,
	Card,
	ConfirmDialog,
	CopyButton,
	Dialog,
	EmptyState,
	ErrorText,
	errMsg,
	Icon,
	Input,
	Mono,
	PageHeader,
	Select,
	Skeleton,
	Spinner,
	Table,
	Time,
	td,
	th,
	useAction,
	zec,
} from "#/components/dash-ui";
import {
	cancelWithdrawal,
	createWithdrawal,
	getWithdrawal,
	type Offramp,
	type Quote,
	quoteWithdrawal,
	simulateDeposit,
	submitKyc,
	type Withdrawal,
	type WithdrawalStatus,
} from "#/server/dash";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "muted";

const STATUS: Record<
	WithdrawalStatus,
	{ label: string; tone: Tone; event: string }
> = {
	awaiting_kyc: {
		label: "Needs verification",
		tone: "warning",
		event: "Withdrawal created",
	},
	awaiting_deposit: {
		label: "Awaiting deposit",
		tone: "info",
		event: "Verified, waiting for ZEC",
	},
	deposit_received: {
		label: "Deposit received",
		tone: "info",
		event: "Deposit received",
	},
	converting: { label: "Converting", tone: "info", event: "Converting ZEC" },
	payout_processing: {
		label: "Paying out",
		tone: "info",
		event: "Paying out to your bank",
	},
	completed: { label: "Completed", tone: "success", event: "Completed" },
	expired: { label: "Expired", tone: "muted", event: "Expired" },
	failed: { label: "Failed", tone: "danger", event: "Failed" },
	cancelled: { label: "Cancelled", tone: "muted", event: "Cancelled" },
};

const FINAL = new Set<WithdrawalStatus>([
	"completed",
	"expired",
	"failed",
	"cancelled",
]);
const PIPELINE: WithdrawalStatus[] = [
	"deposit_received",
	"converting",
	"payout_processing",
	"completed",
];
const BANKS = ["BCA", "Mandiri", "BRI", "BNI", "CIMB Niaga", "Permata"];
const STEPS = ["Amount", "Verify & bank", "Send ZEC", "Status"];
const TITLES = [
	"How much ZEC to withdraw",
	"Verify and add your bank",
	"Send ZEC from your wallet",
	"Track your payout",
];

// Keeps "BCA ••••1234" on one line
const bankText = (b: string) => b.replace(/ (?=•)/, "\u00a0");

const partnerName = (p: string) =>
	p === "transfi" ? "TransFi" : "Mock partner";

export function fiat(v: string | number, cur: string) {
	const n = Number(v);
	const dp = cur === "IDR" ? 0 : 2;
	try {
		return new Intl.NumberFormat(cur === "IDR" ? "id-ID" : "en-US", {
			style: "currency",
			currency: cur,
			minimumFractionDigits: dp,
			maximumFractionDigits: dp,
		}).format(n);
	} catch {
		return `${n.toFixed(dp)} ${cur}`;
	}
}

// "0.5" -> 50_000_000; null when not a valid ZEC amount
const toZat = (s: string) => {
	if (!/^\d*(\.\d{0,8})?$/.test(s.trim()) || !s.trim() || s.trim() === ".")
		return null;
	return Math.round(Number(s) * 1e8);
};

function useNow(on: boolean) {
	const [now, setNow] = useState(() => Date.now() / 1000);
	useEffect(() => {
		if (!on) return;
		setNow(Date.now() / 1000);
		const t = setInterval(() => setNow(Date.now() / 1000), 1000);
		return () => clearInterval(t);
	}, [on]);
	return now;
}

const mmss = (s: number) => {
	const v = Math.max(0, Math.floor(s));
	return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};

export function Countdown({ to, prefix }: { to: number; prefix: string }) {
	const now = useNow(true);
	const left = to - now;
	return (
		<span
			className={`tabular-nums ${left < 60 ? "text-[#ffc685]" : ""}`}
			suppressHydrationWarning
		>
			{left > 0 ? `${prefix} ${mmss(left)}` : "Expired"}
		</span>
	);
}

export function WithdrawalPill({ status }: { status: WithdrawalStatus }) {
	const s = STATUS[status] ?? STATUS.awaiting_kyc;
	return (
		<Badge tone={s.tone} dot>
			{s.label}
		</Badge>
	);
}

/* ---------- Page ---------- */

export function Withdraw({
	offramp,
	withdrawals,
	openId,
	setOpenId,
}: {
	offramp: Offramp;
	withdrawals: Withdrawal[];
	openId?: string;
	setOpenId: (id?: string) => void;
}) {
	const open = withdrawals.find((w) => w.id === openId) ?? null;
	return (
		<>
			<PageHeader
				title="Withdraw to bank"
				description="Convert ZEC to local currency through a licensed off-ramp partner. Funds go from your wallet to the partner, never through Lunaz."
			/>
			{offramp.sandbox && (
				<div
					role="note"
					className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#ffb86b]/30 bg-[#ffb86b]/[0.08] px-4 py-3 text-sm text-[#ffd9ad]"
				>
					<Icon name="alert" className="mt-0.5 size-4 text-[#ffc685]" />
					<p>
						<span className="font-bold text-[#ffc685]">Sandbox:</span> no real
						money moves. Do not send ZEC to the sandbox deposit address.
					</p>
				</div>
			)}
			<div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
				<Summary offramp={offramp} />
				<Stepper
					offramp={offramp}
					resume={withdrawals.find((w) => !FINAL.has(w.status)) ?? null}
				/>
			</div>
			<History withdrawals={withdrawals} onOpen={setOpenId} />
			<WithdrawalDrawer w={open} onClose={() => setOpenId(undefined)} />
		</>
	);
}

function Summary({ offramp }: { offramp: Offramp }) {
	const usd =
		offramp.zec_usd !== null
			? (offramp.received_zat / 1e8) * offramp.zec_usd
			: null;
	return (
		<aside className="dash-card p-5 lg:order-2">
			<p className="text-xs font-medium text-kertas/60">
				Received through Lunaz
			</p>
			<p className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.02em] tabular-nums">
				{zec(offramp.received_zat)}{" "}
				<span className="text-base font-medium text-kertas/55">ZEC</span>
			</p>
			{usd !== null && (
				<p className="text-sm text-kertas/65 tabular-nums">
					≈ {fiat(usd, "USD")}
				</p>
			)}
			<p className="mt-3 text-xs text-kertas/60 text-pretty">
				Payments detected with your viewing key. Your wallet balance may differ.
			</p>
			<dl className="mt-4 space-y-2.5 border-t border-white/[0.08] pt-4 text-sm">
				<div className="flex items-center justify-between gap-3">
					<dt className="text-kertas/60">Partner</dt>
					<dd className="flex items-center gap-2 font-medium">
						{partnerName(offramp.provider)}
						{offramp.sandbox && <Badge tone="warning">Sandbox</Badge>}
					</dd>
				</div>
				<div className="flex items-center justify-between gap-3">
					<dt className="text-kertas/60">Payout</dt>
					<dd className="font-medium">{offramp.currencies.join(", ")}</dd>
				</div>
				<div className="flex items-center justify-between gap-3">
					<dt className="text-kertas/60">Minimum</dt>
					<dd>
						<Amount zat={offramp.min_zat} />
					</dd>
				</div>
			</dl>
		</aside>
	);
}

/* ---------- Stepper ---------- */

const stepOf = (w: Withdrawal | null) =>
	!w
		? 0
		: w.status === "awaiting_kyc"
			? 1
			: w.status === "awaiting_deposit"
				? 2
				: 3;

function Stepper({
	offramp,
	resume,
}: {
	offramp: Offramp;
	resume: Withdrawal | null;
}) {
	const router = useRouter();
	const [w, setW] = useState<Withdrawal | null>(resume);
	const step = stepOf(w);
	const headRef = useRef<HTMLHeadingElement>(null);
	const shownStep = useRef(step);

	// Move focus to the new step so keyboard and screen reader users follow along
	useEffect(() => {
		if (shownStep.current === step) return;
		shownStep.current = step;
		headRef.current?.focus({ preventScroll: true });
		headRef.current?.scrollIntoView({ block: "nearest" });
	}, [step]);

	const update = setW;
	// Refresh history and summary whenever the status moves
	const status = w?.status;
	const seen = useRef(status);
	useEffect(() => {
		if (status && status !== seen.current) router.invalidate();
		seen.current = status;
	}, [status, router]);

	// Poll while the partner is working; awaiting_kyc only changes through our own submit
	const id = w?.id;
	const polling = !!w && !FINAL.has(w.status) && w.status !== "awaiting_kyc";
	useEffect(() => {
		if (!id || !polling) return;
		const t = setInterval(() => {
			getWithdrawal({ data: { id } }).then(update, () => {});
		}, 2000);
		return () => clearInterval(t);
	}, [id, polling]);

	return (
		<Card className="lg:order-1" flush>
			<div className="border-b border-white/[0.08] px-5 pt-5 pb-4">
				<h2 className="text-[15px] font-bold">New withdrawal</h2>
				<ol
					className="mt-3 flex items-center gap-1.5 text-xs"
					aria-label="Steps"
				>
					{STEPS.map((s, i) => (
						<li
							key={s}
							aria-current={i === step ? "step" : undefined}
							className="flex min-w-0 items-center gap-1.5"
						>
							{i > 0 && (
								<span
									aria-hidden="true"
									className={`h-px w-3 sm:w-5 ${i <= step ? "bg-lunas/50" : "bg-white/15"}`}
								/>
							)}
							<span
								className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums ${
									i < step
										? "bg-lunas/20 text-lunas"
										: i === step
											? "bg-lunas text-malam"
											: "bg-white/[0.07] text-kertas/55"
								}`}
							>
								{i < step ? <Icon name="check" className="size-3" /> : i + 1}
							</span>
							<span
								className={`truncate ${i === step ? "font-medium text-kertas" : "hidden text-kertas/55 sm:inline"}`}
							>
								{s}
								{i < step && <span className="sr-only"> (done)</span>}
							</span>
						</li>
					))}
				</ol>
			</div>
			<div aria-live="polite" className="sr-only">
				{w && `Withdrawal status: ${STATUS[w.status]?.label}`}
			</div>
			<div className="p-5">
				<h3
					ref={headRef}
					tabIndex={-1}
					className="mb-4 text-sm font-bold outline-none"
				>
					{TITLES[step]}
				</h3>
				{step === 0 && <AmountStep offramp={offramp} onCreated={update} />}
				{step === 1 && w && (
					<KycStep w={w} sandbox={offramp.sandbox} onDone={update} />
				)}
				{step === 2 && w && (
					<DepositStep w={w} sandbox={offramp.sandbox} onUpdate={update} />
				)}
				{step === 3 && w && <StatusStep w={w} onReset={() => setW(null)} />}
			</div>
		</Card>
	);
}

function AmountStep({
	offramp,
	onCreated,
}: {
	offramp: Offramp;
	onCreated: (w: Withdrawal) => void;
}) {
	const { run, busy } = useAction();
	const [amount, setAmount] = useState("");
	const [currency, setCurrency] = useState(
		offramp.currencies.includes("IDR")
			? "IDR"
			: (offramp.currencies[0] ?? "IDR"),
	);
	const [quote, setQuote] = useState<Quote | null>(null);
	const [qErr, setQErr] = useState("");
	const [loading, setLoading] = useState(false);
	const [refresh, setRefresh] = useState(0);
	const now = useNow(!!quote);

	const zat = toZat(amount);
	const error = !amount.trim()
		? ""
		: zat === null
			? "Enter an amount in ZEC, up to 8 decimals"
			: zat < offramp.min_zat
				? `Minimum is ${zec(offramp.min_zat)} ZEC`
				: "";
	const valid = zat !== null && !error;

	// biome-ignore lint/correctness/useExhaustiveDependencies: refresh re-quotes on expiry
	useEffect(() => {
		setQuote(null);
		setQErr("");
		if (!valid) return;
		let live = true;
		let retry: ReturnType<typeof setTimeout> | undefined;
		setLoading(true);
		const t = setTimeout(() => {
			quoteWithdrawal({ data: { amount_zat: zat, currency } })
				.then(
					(q) => live && setQuote(q),
					(e) => {
						if (!live) return;
						// The price feed warms up after a restart; retry instead of failing
						if (/price/i.test(errMsg(e))) {
							setQErr("Fetching the ZEC price…");
							retry = setTimeout(() => setRefresh((r) => r + 1), 3000);
						} else setQErr(errMsg(e));
					},
				)
				.finally(() => live && setLoading(false));
		}, 400);
		return () => {
			live = false;
			clearTimeout(t);
			clearTimeout(retry);
		};
	}, [zat, currency, valid, refresh]);

	const left = quote ? quote.expires_at - now : 0;
	useEffect(() => {
		if (quote && left <= 0) setRefresh((r) => r + 1);
	}, [quote, left]);

	const usd =
		zat && offramp.zec_usd !== null ? (zat / 1e8) * offramp.zec_usd : null;

	return (
		<form
			className="space-y-5"
			onSubmit={(e) => {
				e.preventDefault();
				if (!valid || !quote || !zat) return;
				run("create", () =>
					createWithdrawal({ data: { amount_zat: zat, currency } }),
				).then((w) => w && onCreated(w));
			}}
		>
			<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
				<Input
					id="wd-amount"
					label="Amount in ZEC"
					inputMode="decimal"
					autoComplete="off"
					placeholder="0.00"
					value={amount}
					onChange={(e) => setAmount(e.target.value.replace(",", "."))}
					error={error}
					hint={
						usd !== null
							? `≈ ${fiat(usd, "USD")} · minimum ${zec(offramp.min_zat)} ZEC`
							: `Minimum ${zec(offramp.min_zat)} ZEC`
					}
				/>
				<Select
					id="wd-currency"
					label="Receive in"
					value={currency}
					onChange={(e) => setCurrency(e.target.value)}
				>
					{offramp.currencies.map((c) => (
						<option key={c}>{c}</option>
					))}
				</Select>
			</div>

			<section
				aria-label="Quote"
				aria-busy={loading || undefined}
				className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
			>
				{!valid ? (
					<p className="text-sm text-kertas/55">
						Enter an amount to see a live quote from{" "}
						{partnerName(offramp.provider)}.
					</p>
				) : qErr.startsWith("Fetching") ? (
					<p className="flex items-center gap-2 text-sm text-kertas/65">
						<Spinner className="size-3.5" />
						{qErr}
					</p>
				) : qErr ? (
					<ErrorText error={qErr} />
				) : !quote ? (
					<div className="space-y-2.5" aria-hidden="true">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-4 w-36" />
						<Skeleton className="mt-4 h-7 w-56" />
					</div>
				) : (
					<>
						<dl className="space-y-2 text-sm">
							<QRow label="Rate">
								1 ZEC = {fiat(quote.rate, quote.currency)}
							</QRow>
							<QRow label="Partner fee">
								{fiat(quote.fee_fiat, quote.currency)}
							</QRow>
							<QRow label="Network fee">
								<Amount zat={quote.network_fee_zat} />
							</QRow>
						</dl>
						<div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-white/[0.08] pt-3">
							<div>
								<p className="text-xs text-kertas/60">You receive</p>
								<p className="text-2xl font-bold tracking-[-0.02em] tabular-nums">
									≈ {fiat(quote.fiat_amount, quote.currency)}
								</p>
							</div>
							<p className="flex items-center gap-1.5 text-xs text-kertas/60">
								{loading && <Spinner className="size-3" />}
								<Countdown to={quote.expires_at} prefix="Quote refreshes in" />
							</p>
						</div>
					</>
				)}
			</section>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-xs text-kertas/60">
					Next, verify with {partnerName(offramp.provider)} and add your bank.
				</p>
				<Button
					type="submit"
					variant="primary"
					disabled={!quote}
					pending={busy === "create"}
				>
					Continue
					<Icon name="arrow" />
				</Button>
			</div>
		</form>
	);
}

function QRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<dt className="text-kertas/60">{label}</dt>
			<dd className="text-right tabular-nums">{children}</dd>
		</div>
	);
}

// The partner's hosted widget, drawn on paper so it reads as a separate surface
const pField =
	"mt-1 block h-10 w-full rounded-md border border-malam/20 bg-white px-3 text-sm text-malam placeholder:text-malam/40 focus-visible:border-malam focus-visible:outline-none aria-[invalid=true]:border-[#c4382a]";

function KycStep({
	w,
	sandbox,
	onDone,
}: {
	w: Withdrawal;
	sandbox: boolean;
	onDone: (w: Withdrawal) => void;
}) {
	const { run, busy } = useAction();
	const [bank, setBank] = useState(BANKS[0]);
	const [holder, setHolder] = useState("");
	const [account, setAccount] = useState("");
	const [verified, setVerified] = useState(false);
	const [tried, setTried] = useState(false);
	const digits = account.replace(/\D/g, "");
	const errs = {
		holder: holder.trim() ? "" : "Enter the account holder name",
		account:
			digits.length >= 6 && digits.length <= 20
				? ""
				: "Enter a 6 to 20 digit account number",
		verified: verified ? "" : "Complete identity verification first",
	};
	const ok = !errs.holder && !errs.account && !errs.verified;

	function submit(e: FormEvent) {
		e.preventDefault();
		setTried(true);
		if (!ok) return;
		run(
			"kyc",
			() =>
				submitKyc({
					data: { id: w.id, bank_name: bank, account_last4: digits.slice(-4) },
				}),
			"Bank account added",
		).then((r) => r && onDone(r));
	}

	const err = (k: keyof typeof errs) =>
		tried && errs[k] ? (
			<p id={`kyc-${k}-err`} className="mt-1 text-xs text-[#b0301f]">
				{errs[k]}
			</p>
		) : null;

	return (
		<div className="space-y-4">
			<p className="text-sm text-kertas/65">
				{partnerName(w.provider)} verifies your identity and pays out to your
				bank. This step happens on their side.
			</p>
			<form
				onSubmit={submit}
				noValidate
				className="overflow-hidden rounded-xl bg-kertas text-malam shadow-[0_0_0_1px_rgb(255_255_255/0.1)]"
			>
				<div className="flex items-center justify-between gap-3 border-b border-malam/10 px-4 py-2.5 text-xs">
					<span className="font-bold">
						Powered by {partnerName(w.provider)}
						{sandbox && (
							<span className="font-medium text-malam/60"> · sandbox</span>
						)}
					</span>
					<span className="flex items-center gap-1 text-malam/60">
						<svg
							viewBox="0 0 24 24"
							className="size-3.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z" />
						</svg>
						Secure
					</span>
				</div>
				<div className="space-y-4 p-4">
					<label
						className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
							verified
								? "border-malam/30 bg-malam/[0.06]"
								: tried
									? "border-[#c4382a]/60"
									: "border-malam/20 hover:border-malam/40"
						}`}
					>
						<input
							type="checkbox"
							checked={verified}
							onChange={(e) => setVerified(e.target.checked)}
							aria-invalid={(tried && !verified) || undefined}
							aria-describedby={
								tried && !verified ? "kyc-verified-err" : undefined
							}
							className="size-4 accent-malam"
						/>
						<span className="flex-1">
							<span className="font-medium">Identity verified</span>
							<span className="text-malam/60"> (sandbox)</span>
						</span>
					</label>
					{err("verified")}
					<div>
						<label htmlFor="kyc-bank" className="text-sm font-medium">
							Bank
						</label>
						<select
							id="kyc-bank"
							value={bank}
							onChange={(e) => setBank(e.target.value)}
							className={pField}
						>
							{BANKS.map((b) => (
								<option key={b}>{b}</option>
							))}
						</select>
					</div>
					<div>
						<label htmlFor="kyc-holder" className="text-sm font-medium">
							Account holder name
						</label>
						<input
							id="kyc-holder"
							autoComplete="name"
							value={holder}
							onChange={(e) => setHolder(e.target.value)}
							aria-invalid={(tried && !!errs.holder) || undefined}
							aria-describedby={
								tried && errs.holder ? "kyc-holder-err" : undefined
							}
							className={pField}
						/>
						{err("holder")}
					</div>
					<div>
						<label htmlFor="kyc-account" className="text-sm font-medium">
							Account number
						</label>
						<input
							id="kyc-account"
							inputMode="numeric"
							autoComplete="off"
							value={account}
							onChange={(e) => setAccount(e.target.value)}
							aria-invalid={(tried && !!errs.account) || undefined}
							aria-describedby={
								tried && errs.account ? "kyc-account-err" : "kyc-account-hint"
							}
							className={`${pField} font-mono tracking-wide`}
						/>
						{err("account") ?? (
							<p id="kyc-account-hint" className="mt-1 text-xs text-malam/65">
								Lunaz only keeps the bank name and last 4 digits.
							</p>
						)}
					</div>
					<button
						type="submit"
						disabled={busy === "kyc"}
						aria-busy={busy === "kyc" || undefined}
						className="press inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-malam text-sm font-bold text-kertas transition-colors hover:bg-[#2b2f5c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-malam disabled:opacity-60"
					>
						{busy === "kyc" && <Spinner />}
						Verify and continue
					</button>
				</div>
			</form>
			<CancelButton w={w} onDone={onDone} />
		</div>
	);
}

function CancelButton({
	w,
	onDone,
}: {
	w: Withdrawal;
	onDone: (w: Withdrawal) => void;
}) {
	const [open, setOpen] = useState(false);
	const { run } = useAction();
	return (
		<>
			<Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
				Cancel withdrawal
			</Button>
			<ConfirmDialog
				open={open}
				onClose={() => setOpen(false)}
				title="Cancel this withdrawal?"
				confirmLabel="Cancel withdrawal"
				onConfirm={() =>
					run(
						"cancel",
						() => cancelWithdrawal({ data: { id: w.id } }),
						"Withdrawal cancelled",
					).then((r) => r && onDone(r))
				}
			>
				Don't send ZEC to this deposit address after cancelling. Anything sent
				later may not be converted.
			</ConfirmDialog>
		</>
	);
}

function DepositStep({
	w,
	sandbox,
	onUpdate,
}: {
	w: Withdrawal;
	sandbox: boolean;
	onUpdate: (w: Withdrawal) => void;
}) {
	const { run, busy } = useAction();
	const amount = zec(w.amount_zat);
	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-xs text-kertas/60">Send exactly</p>
					<p className="text-[28px] leading-tight font-bold tracking-[-0.02em] tabular-nums">
						{amount}{" "}
						<span className="text-base font-medium text-kertas/55">ZEC</span>
					</p>
					<p className="text-sm text-kertas/65 tabular-nums">
						You receive ≈ {fiat(w.fiat_amount, w.fiat_currency)}
						{w.bank_label && ` at ${bankText(w.bank_label)}`}
					</p>
				</div>
				<CopyButton text={amount} label="Copy amount" size="sm" />
			</div>

			<div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
				<div>
					<p className="mb-1 text-xs text-kertas/60">
						Partner deposit address (transparent)
					</p>
					<p className="font-mono text-[13px] break-all">{w.deposit_address}</p>
					<div className="mt-2">
						<CopyButton
							text={w.deposit_address}
							label="Copy address"
							size="sm"
						/>
					</div>
				</div>
				<div className="border-t border-white/[0.08] pt-3">
					<p className="mb-1 text-xs text-kertas/60">
						Payment URI for wallets like ZODL
					</p>
					<Mono value={w.deposit_uri} full label="Copy payment URI" />
				</div>
			</div>

			<div
				role="note"
				className="flex items-start gap-2.5 rounded-xl border border-[#ffb86b]/30 bg-[#ffb86b]/[0.07] px-4 py-3 text-sm text-[#ffd9ad]"
			>
				<Icon name="alert" className="mt-0.5 size-4 text-[#ffc685]" />
				<p className="text-pretty">
					This deposit address is transparent. Sending to it moves ZEC out of
					the shielded pool and links this withdrawal to your partner account.
				</p>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="flex items-center gap-2 text-sm text-kertas/65">
					<Spinner className="size-3.5" />
					<span>
						Waiting for your deposit ·{" "}
						<Countdown to={w.expires_at} prefix="expires in" />
					</span>
				</p>
				<div className="flex flex-wrap gap-2">
					<CancelButton w={w} onDone={onUpdate} />
					{sandbox && (
						<Button
							variant="primary"
							icon="send"
							pending={busy === "sim"}
							onClick={() =>
								run("sim", () => simulateDeposit({ data: { id: w.id } })).then(
									(r) => r && onUpdate(r),
								)
							}
						>
							Simulate deposit
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

function StatusStep({ w, onReset }: { w: Withdrawal; onReset: () => void }) {
	const done = w.status === "completed";
	const final = FINAL.has(w.status);
	return (
		<div className="space-y-5">
			<div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
				<div className="flex items-start justify-between gap-3">
					<p className="text-xs text-kertas/60">
						{done ? "Paid out" : final ? "Withdrawal" : "On its way"}
					</p>
					<WithdrawalPill status={w.status} />
				</div>
				<p className="mt-1 text-2xl font-bold tracking-[-0.02em] tabular-nums text-balance">
					{done
						? `${fiat(w.fiat_amount, w.fiat_currency)} sent to ${w.bank_label ? bankText(w.bank_label) : "your bank"}`
						: final
							? `${STATUS[w.status].label}: ${zec(w.amount_zat)} ZEC`
							: `≈ ${fiat(w.fiat_amount, w.fiat_currency)}`}
				</p>
				<p className="mt-1 text-sm text-kertas/65">
					<Amount zat={w.amount_zat} /> · rate {fiat(w.rate, w.fiat_currency)}
				</p>
			</div>
			<Timeline w={w} />
			{final && (
				<Button
					variant={done ? "secondary" : "primary"}
					icon="plus"
					onClick={onReset}
				>
					New withdrawal
				</Button>
			)}
		</div>
	);
}

function Timeline({ w }: { w: Withdrawal }) {
	const seen = new Set(w.events.map((e) => e.status));
	const final = FINAL.has(w.status);
	const ahead = final
		? []
		: PIPELINE.filter((s) => !seen.has(s) && s !== w.status);
	const items = [
		...w.events.map((e, i) => ({
			key: `${e.status}-${e.created_at}-${i}`,
			label: STATUS[e.status]?.event ?? e.status,
			note: e.note,
			at: e.created_at,
			state:
				e.status === "failed"
					? "bad"
					: e.status === "cancelled" || e.status === "expired"
						? "off"
						: i === w.events.length - 1 && !final
							? "now"
							: "done",
		})),
		...ahead.map((s) => ({
			key: s,
			label: STATUS[s].event,
			note: null,
			at: 0,
			state: "todo",
		})),
	];
	return (
		<ol aria-label="Timeline" className="relative">
			{items.map((it, i) => (
				<li key={it.key} className="relative flex gap-3 pb-4 last:pb-0">
					{i < items.length - 1 && (
						<span
							aria-hidden="true"
							className={`absolute top-4 bottom-0 left-[7px] w-px ${items[i + 1].state === "todo" || items[i + 1].state === "off" ? "bg-white/10" : "bg-lunas/35"}`}
						/>
					)}
					<span
						aria-hidden="true"
						className="relative mt-1 grid size-[15px] place-items-center"
					>
						{it.state === "now" && (
							<span className="absolute inset-0 rounded-full bg-lunas/40 motion-safe:animate-ping" />
						)}
						<span
							className={`relative size-[9px] rounded-full ${
								it.state === "done"
									? "bg-lunas"
									: it.state === "now"
										? "bg-lunas ring-4 ring-lunas/20"
										: it.state === "bad"
											? "bg-[#ff8a7a]"
											: it.state === "off"
												? "bg-kertas/40"
												: "border border-white/25"
							}`}
						/>
					</span>
					<div className="min-w-0 flex-1 text-sm">
						<p
							className={it.state === "todo" ? "text-kertas/50" : "font-medium"}
						>
							{it.label}
							{it.state === "now" && (
								<span className="sr-only"> (current)</span>
							)}
						</p>
						{it.note && (
							<p className="text-xs text-kertas/60 first-letter:uppercase">
								{it.note.replace(/^kyc\b/i, "KYC")}
							</p>
						)}
						{it.at > 0 && (
							<p className="text-xs text-kertas/55">
								<Time s={it.at} absoluteOnly />
							</p>
						)}
					</div>
				</li>
			))}
		</ol>
	);
}

/* ---------- History ---------- */

function History({
	withdrawals,
	onOpen,
}: {
	withdrawals: Withdrawal[];
	onOpen: (id: string) => void;
}) {
	return (
		<Card title="History" flush className="mt-6 overflow-hidden">
			{withdrawals.length === 0 ? (
				<EmptyState icon="bank" title="No withdrawals yet">
					Withdrawals you start here show up with their payout status.
				</EmptyState>
			) : (
				<div className="border-t border-white/[0.08]">
					<Table
						caption="Withdrawals"
						head={
							<>
								<th className={th}>Date</th>
								<th className={th}>Status</th>
								<th className={`${th} text-right`}>Amount</th>
								<th className={`${th} text-right`}>Payout</th>
								<th className={th}>Bank</th>
							</>
						}
					>
						{withdrawals.map((w) => (
							<tr
								key={w.id}
								data-href
								onClick={(e) => {
									if (!(e.target as HTMLElement).closest("button,a"))
										onOpen(w.id);
								}}
							>
								<td className={td}>
									<button
										type="button"
										className="dash-focus rounded-sm underline decoration-white/20 underline-offset-2 hover:decoration-kertas"
										onClick={() => onOpen(w.id)}
										aria-label={`Open withdrawal from ${new Date(w.created_at * 1000).toDateString()}`}
									>
										<Time s={w.created_at} />
									</button>
								</td>
								<td className={td} data-sm-end>
									<WithdrawalPill status={w.status} />
								</td>
								<td className={`${td} text-right`} data-label="Amount" data-end>
									<Amount zat={w.amount_zat} />
								</td>
								<td
									className={`${td} text-right tabular-nums`}
									data-label="Payout"
									data-end
								>
									{fiat(w.fiat_amount, w.fiat_currency)}
								</td>
								<td className={td} data-label="Bank">
									{w.bank_label ?? <span className="text-kertas/55">—</span>}
								</td>
							</tr>
						))}
					</Table>
				</div>
			)}
		</Card>
	);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 text-sm">
			<dt className="text-kertas/55">{label}</dt>
			<dd className="min-w-0">{children}</dd>
		</div>
	);
}

function WithdrawalDrawer({
	w,
	onClose,
}: {
	w: Withdrawal | null;
	onClose: () => void;
}) {
	const [shown, setShown] = useState(w);
	useEffect(() => {
		if (w) setShown(w);
	}, [w]);
	const x = w ?? shown;
	return (
		<Dialog
			open={!!w}
			onClose={onClose}
			variant="sheet"
			initialFocus="self"
			title="Withdrawal"
			description={
				x && <Mono value={x.id} head={8} tail={4} label="Copy withdrawal ID" />
			}
		>
			{x && (
				<div className="space-y-6">
					<div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-xs text-kertas/55">
									{x.status === "completed" ? "Paid out" : "Quoted payout"}
								</p>
								<p className="mt-0.5 text-2xl font-bold tracking-[-0.02em] tabular-nums">
									{fiat(x.fiat_amount, x.fiat_currency)}
								</p>
							</div>
							<WithdrawalPill status={x.status} />
						</div>
						<p className="mt-2 text-sm text-kertas/65">
							<Amount zat={x.amount_zat} /> to {partnerName(x.provider)}
							{x.bank_label && `, payout to ${bankText(x.bank_label)}`}
						</p>
					</div>
					<section>
						<h3 className="mb-1 text-xs font-medium tracking-wide text-kertas/55 uppercase">
							Details
						</h3>
						<dl className="divide-y divide-white/[0.06]">
							<Row label="Rate">1 ZEC = {fiat(x.rate, x.fiat_currency)}</Row>
							<Row label="Partner fee">{fiat(x.fee_fiat, x.fiat_currency)}</Row>
							<Row label="Network fee">
								<Amount zat={x.network_fee_zat} />
							</Row>
							<Row label="Bank">
								{x.bank_label ?? (
									<span className="text-kertas/55">Not added</span>
								)}
							</Row>
							<Row label="Deposit address">
								<Mono value={x.deposit_address} label="Copy deposit address" />
							</Row>
							{x.provider_ref && (
								<Row label="Partner ref">
									<Mono value={x.provider_ref} label="Copy partner reference" />
								</Row>
							)}
						</dl>
					</section>
					<section>
						<h3 className="mb-3 text-xs font-medium tracking-wide text-kertas/55 uppercase">
							Timeline
						</h3>
						<Timeline w={x} />
					</section>
				</div>
			)}
		</Dialog>
	);
}
