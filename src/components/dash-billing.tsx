import { isRedirect, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
	type AccountPlan,
	type Checkout,
	checkout,
	type Invoice,
	listBilling,
	type Plan,
	type PlanId,
	type Subscription,
	simulatePaid,
} from "#/server/dash";
import { planLabel } from "./dash-sections";
import {
	Badge,
	Button,
	button,
	Card,
	CopyButton,
	Dialog,
	EmptyState,
	Icon,
	Mono,
	PageHeader,
	Spinner,
	Table,
	td,
	th,
	toast,
	useAction,
	zec,
} from "./dash-ui";
import { Countdown, fiat } from "./dash-withdraw";

export type Paid = "pro" | "platform";
const RANK: Record<PlanId, number> = {
	free: 0,
	pro: 1,
	platform: 2,
	enterprise: 3,
};
const FOR: Record<PlanId, string> = {
	free: "Try it out, or run a small shop.",
	pro: "Growing online stores.",
	platform: "Marketplaces with many sellers.",
	enterprise: "SLA, compliance and custom volume.",
};
const SALES = `mailto:${import.meta.env.VITE_SALES_EMAIL ?? "sales@lunaz.example"}`;
const INCLUDED =
	"shielded invoices, cross-chain payments, signed webhooks, accountant CSV, withdraw to bank.";
const PERIODS = [1, 3, 12] as const;

export const day = (s: number) =>
	new Date(s * 1000).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
const usd = (n: number) => fiat(n, "USD").replace(/\.00$/, "");
const nextPlan = (p: PlanId): Paid => (p === "free" ? "pro" : "platform");

/* ---------- Usage meter ---------- */

export function Meter({
	label,
	used,
	limit,
	hint,
	compact,
}: {
	label: string;
	used: number;
	limit: number | null;
	hint?: string;
	compact?: boolean;
}) {
	const pct = limit ? used / limit : 0;
	const tone =
		pct >= 1 ? "bg-[#ff8a7a]" : pct >= 0.8 ? "bg-[#ffb86b]" : "bg-lunas";
	return (
		<div>
			<div className="flex items-baseline justify-between gap-3">
				<span className={compact ? "text-sm" : "text-sm text-kertas/70"}>
					{label}
				</span>
				<span className="text-sm tabular-nums">
					<span className="font-bold">{used.toLocaleString("en-US")}</span>
					<span className="text-kertas/55">
						{" / "}
						{limit === null ? "Unlimited" : limit.toLocaleString("en-US")}
					</span>
				</span>
			</div>
			{/* biome-ignore lint/a11y/useSemanticElements: native <meter> can't take the threshold colours consistently */}
			<div
				role="meter"
				aria-label={label}
				aria-valuemin={0}
				aria-valuemax={limit ?? used}
				aria-valuenow={used}
				aria-valuetext={
					limit === null ? `${used}, unlimited` : `${used} of ${limit}`
				}
				className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
			>
				{limit !== null && (
					<div
						className={`progress-fill h-full origin-left rounded-full ${tone}`}
						style={{ transform: `scaleX(${Math.min(1, pct)})` }}
					/>
				)}
			</div>
			{hint && <p className="mt-1.5 text-xs text-kertas/55">{hint}</p>}
		</div>
	);
}

const resets = (p: AccountPlan) => {
	const d = new Date(p.period_start_of_month * 1000);
	return day(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / 1000);
};

/** Compact usage strip for the overview */
export function UsageStrip({ plan }: { plan: AccountPlan }) {
	return (
		<section
			aria-label="Plan usage"
			className="dash-card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4"
		>
			<div className="flex items-center gap-2">
				<span className="text-sm text-kertas/65">Plan</span>
				<Badge tone={plan.plan === "free" ? "neutral" : "success"}>
					{plan.plan_name}
				</Badge>
			</div>
			<div className="w-full sm:w-auto sm:min-w-48 sm:flex-1">
				<Meter
					compact
					label="Invoices this month"
					used={plan.usage.invoices_this_month}
					limit={plan.limits.invoices_per_month}
				/>
			</div>
			{plan.plan === "free" ? (
				<Link
					to="/dashboard/billing"
					search={{ upgrade: true }}
					className={button("primary", "sm")}
				>
					Upgrade
				</Link>
			) : (
				<Link
					to="/dashboard/billing"
					className={`${button("ghost", "sm")} -ml-2.5 sm:ml-0`}
				>
					Plan & billing
					<Icon name="arrow" className="size-3.5" />
				</Link>
			)}
		</section>
	);
}

/* ---------- Page ---------- */

export function Billing({
	plan,
	plans,
	history,
	upgrade,
	setUpgrade,
}: {
	plan: AccountPlan;
	plans: Plan[];
	history: Subscription[];
	upgrade?: Paid | true;
	setUpgrade: (p?: Paid) => void;
}) {
	const open = !!upgrade && plan.billing_configured;
	const choice: Paid =
		upgrade === "pro" || upgrade === "platform"
			? upgrade
			: plan.plan === "platform"
				? "platform"
				: nextPlan(plan.plan);
	// A fresh flow each time the dialog opens
	const [session, setSession] = useState(0);
	const wasOpen = useRef(open);
	useEffect(() => {
		if (open && !wasOpen.current) setSession((n) => n + 1);
		wasOpen.current = open;
	}, [open]);

	return (
		<>
			<PageHeader
				title="Plan & billing"
				description="Every plan has every feature; plans differ by volume. You pay in ZEC through Lunaz itself, with no auto-renewal."
			/>
			<div className="space-y-6">
				<CurrentPlan plan={plan} onUpgrade={setUpgrade} />
				<Pricing plans={plans} current={plan} onChoose={setUpgrade} />
				<History history={history} />
			</div>
			<Dialog
				open={open}
				onClose={() => setUpgrade()}
				title="Upgrade your plan"
				description="Paid in ZEC. Your plan starts as soon as the payment confirms."
				initialFocus="input:checked"
			>
				<UpgradeFlow
					key={session}
					plans={plans}
					initial={choice}
					sandbox={plan.sandbox_billing}
					onClose={() => setUpgrade()}
				/>
			</Dialog>
		</>
	);
}

function CurrentPlan({
	plan,
	onUpgrade,
}: {
	plan: AccountPlan;
	onUpgrade: (p?: Paid) => void;
}) {
	const paid = plan.plan === "pro" || plan.plan === "platform";
	const daysLeft = plan.expires_at
		? Math.ceil((plan.expires_at - Date.now() / 1000) / 86400)
		: null;
	const soon = daysLeft !== null && daysLeft <= 7;
	return (
		<section className="dash-card p-5" aria-labelledby="cur-h">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 id="cur-h" className="text-sm text-kertas/65">
						Current plan
					</h2>
					<p className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.02em]">
						{plan.plan_name}
					</p>
					<p
						className={`mt-1 text-sm ${soon ? "text-[#ffc685]" : "text-kertas/65"}`}
						suppressHydrationWarning
					>
						{plan.expires_at
							? soon
								? `Ends ${day(plan.expires_at)}. Pay again to keep ${plan.plan_name}.`
								: `Active until ${day(plan.expires_at)}`
							: plan.plan === "free"
								? "Free forever"
								: "Custom agreement"}
					</p>
				</div>
				{plan.plan !== "enterprise" && (
					<div className="flex flex-wrap gap-2">
						{paid && (
							<Button
								disabled={!plan.billing_configured}
								onClick={() => onUpgrade(plan.plan as Paid)}
							>
								Renew
							</Button>
						)}
						{plan.plan !== "platform" && (
							<Button
								variant="primary"
								disabled={!plan.billing_configured}
								onClick={() => onUpgrade(nextPlan(plan.plan))}
							>
								Upgrade
							</Button>
						)}
					</div>
				)}
			</div>
			{!plan.billing_configured && (
				<p className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-kertas/70">
					<Icon name="alert" className="mt-0.5 size-4" />
					Upgrades aren't available on this Lunaz server yet. Your current plan
					keeps working.
				</p>
			)}
			<div className="mt-6 grid gap-x-8 gap-y-5 border-t border-white/[0.08] pt-5 sm:grid-cols-2">
				<Meter
					label="Invoices this month"
					used={plan.usage.invoices_this_month}
					limit={plan.limits.invoices_per_month}
					hint={`Resets ${resets(plan)}`}
				/>
				<Meter
					label="Active API keys"
					used={plan.usage.api_keys_active}
					limit={plan.limits.api_keys}
					hint="Revoked keys don't count."
				/>
			</div>
		</section>
	);
}

const limitText = (n: number | null, what: string) =>
	n === null ? `Unlimited ${what}` : `${n.toLocaleString("en-US")} ${what}`;

function Pricing({
	plans,
	current,
	onChoose,
}: {
	plans: Plan[];
	current: AccountPlan;
	onChoose: (p: Paid) => void;
}) {
	return (
		<section aria-labelledby="plans-h">
			<h2 id="plans-h" className="mb-3 text-[15px] font-bold">
				Plans
			</h2>
			<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{plans.map((p) => {
					const isCurrent = p.id === current.plan;
					const higher = RANK[p.id] > RANK[current.plan];
					return (
						<li
							key={p.id}
							className={`dash-card flex flex-col p-5 ${isCurrent ? "border-lunas/50" : ""}`}
						>
							<div className="flex min-h-[22px] flex-wrap items-center justify-between gap-2">
								<h3 className="font-bold">{p.name}</h3>
								{isCurrent ? (
									<Badge tone="success">Current plan</Badge>
								) : (
									p.id === "pro" && <Badge tone="info">Recommended</Badge>
								)}
							</div>
							<p className="mt-1 text-sm text-pretty text-kertas/65">
								{FOR[p.id]}
							</p>
							<p className="mt-4 tabular-nums">
								<span className="text-[28px] font-bold tracking-[-0.02em]">
									{p.price_usd === null ? "Custom" : usd(p.price_usd)}
								</span>
								{p.price_usd !== null && (
									<span className="text-sm text-kertas/60"> / month</span>
								)}
							</p>
							<p className="text-xs text-kertas/55">
								{p.price_usd === null
									? "Talk to us"
									: p.price_usd === 0
										? "No payment needed"
										: "Paid in ZEC"}
							</p>
							<ul className="mt-4 mb-5 space-y-1.5 text-sm">
								{[
									limitText(p.invoices_per_month, "invoices / month"),
									limitText(p.api_keys, "API keys"),
								].map((l) => (
									<li key={l} className="flex items-center gap-2">
										<Icon name="check" className="size-3.5 text-lunas" />
										<span className="tabular-nums">{l}</span>
									</li>
								))}
							</ul>
							<div className="mt-auto">
								{p.id === "enterprise" ? (
									<a href={SALES} className={`${button()} w-full`}>
										Contact us
									</a>
								) : p.id === "free" ? (
									<p className="flex h-9 items-center text-sm text-kertas/55">
										{isCurrent ? "You're on this plan" : "Always available"}
									</p>
								) : (
									<Button
										variant={higher ? "primary" : "secondary"}
										className="w-full"
										disabled={!current.billing_configured}
										onClick={() => onChoose(p.id as Paid)}
									>
										{isCurrent
											? "Renew"
											: higher
												? `Upgrade to ${p.name}`
												: `Switch to ${p.name}`}
									</Button>
								)}
							</div>
						</li>
					);
				})}
			</ul>
			<p className="mt-4 text-sm text-kertas/65">
				<span className="font-medium text-kertas">All plans include:</span>{" "}
				{INCLUDED}
			</p>
		</section>
	);
}

/* ---------- Upgrade flow ---------- */

const radio =
	"flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-malam p-3.5 hover:border-white/30 has-[:checked]:border-lunas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lunas has-[:focus-visible]:outline-offset-2";

function UpgradeFlow({
	plans,
	initial,
	sandbox,
	onClose,
}: {
	plans: Plan[];
	initial: Paid;
	sandbox: boolean;
	onClose: () => void;
}) {
	const [plan, setPlan] = useState<Paid>(initial);
	const [months, setMonths] = useState<(typeof PERIODS)[number]>(1);
	const [co, setCo] = useState<Checkout | null>(null);
	const [error, setError] = useState("");
	const { run, busy } = useAction();
	const options = plans.filter(
		(p): p is Plan & { id: Paid } => p.id === "pro" || p.id === "platform",
	);
	const price = options.find((p) => p.id === plan)?.price_usd ?? 0;

	async function start() {
		setError("");
		try {
			const r = await checkout({ data: { plan, months } });
			setCo(r);
		} catch (e) {
			if (isRedirect(e)) throw e;
			const m = e instanceof Error ? e.message : "";
			setError(
				/not configured/i.test(m)
					? "Billing isn't set up on this Lunaz server yet. Your current plan keeps working."
					: /price|reach/i.test(m) || !m
						? "We couldn't get a ZEC price right now. Try again in a moment."
						: `${m[0].toUpperCase()}${m.slice(1)}.`,
			);
		}
	}

	if (co) return <PayStep co={co} sandbox={sandbox} onClose={onClose} />;

	return (
		<form
			className="space-y-5"
			onSubmit={(e) => {
				e.preventDefault();
				run("checkout", start);
			}}
		>
			<fieldset>
				<legend className="mb-2 text-sm font-medium">Plan</legend>
				<div className="grid gap-2">
					{options.map((p) => (
						<label key={p.id} className={radio}>
							<input
								type="radio"
								name="plan"
								checked={plan === p.id}
								onChange={() => setPlan(p.id)}
								className="mt-1 size-4 shrink-0 accent-[#c8f169]"
							/>
							<span className="min-w-0 flex-1">
								<span className="flex justify-between gap-3 font-bold">
									{p.name}
									<span className="font-medium tabular-nums">
										{usd(p.price_usd ?? 0)}
										<span className="text-kertas/55"> / mo</span>
									</span>
								</span>
								<span className="mt-0.5 block text-sm text-kertas/65">
									{limitText(p.invoices_per_month, "invoices / month")} ·{" "}
									{limitText(p.api_keys, "API keys")}
								</span>
							</span>
						</label>
					))}
				</div>
			</fieldset>
			<fieldset>
				<legend className="mb-2 text-sm font-medium">Period</legend>
				<div className="grid grid-cols-3 gap-2">
					{PERIODS.map((m) => (
						<label key={m} className={`${radio} flex-col gap-1 text-center`}>
							<input
								type="radio"
								name="months"
								checked={months === m}
								onChange={() => setMonths(m)}
								className="sr-only"
							/>
							<span className="w-full text-sm font-bold">
								{m === 1 ? "1 month" : `${m} months`}
							</span>
							<span className="w-full text-xs text-kertas/60 tabular-nums">
								{usd(price * m)}
							</span>
						</label>
					))}
				</div>
			</fieldset>
			<div className="flex items-end justify-between gap-3 border-t border-white/[0.08] pt-4">
				<div>
					<p className="text-xs text-kertas/60">Total</p>
					<p className="text-xl font-bold tabular-nums">
						{usd(price * months)}
					</p>
					<p className="text-xs text-kertas/55">
						Paid in ZEC at today's rate. Starts immediately.
					</p>
				</div>
				<Button type="submit" variant="primary" pending={busy === "checkout"}>
					Continue
				</Button>
			</div>
			<div role="alert" className="empty:hidden">
				{error && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ff8a7a]/25 bg-[#ff8a7a]/[0.08] px-3 py-2 text-sm text-[#ffb3a8]">
						<p className="flex items-start gap-2">
							<Icon name="alert" className="mt-0.5 size-4" />
							{error}
						</p>
						{!/set up/.test(error) && (
							<Button
								size="sm"
								icon="refresh"
								pending={busy === "retry"}
								onClick={() => run("retry", start)}
							>
								Retry
							</Button>
						)}
					</div>
				)}
			</div>
		</form>
	);
}

const STEPS: { key: Invoice["status"]; label: string }[] = [
	{ key: "pending", label: "Waiting" },
	{ key: "detected", label: "Detected" },
	{ key: "paid", label: "Paid" },
];

function PayStep({
	co,
	sandbox,
	onClose,
}: {
	co: Checkout;
	sandbox: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const { run, busy } = useAction();
	const [sub, setSub] = useState<Subscription | null>(null);
	const done = sub?.status === "paid";
	const status = done ? "paid" : (sub?.invoice_status ?? co.invoice.status);
	const dead =
		!done && (sub?.status === "expired" || sub?.status === "cancelled");

	// ponytail: polls every 3 s instead of the invoice WebSocket; the browser never talks to core-service
	useEffect(() => {
		if (done || dead) return;
		let live = true;
		const poll = () =>
			listBilling()
				.then((l) => {
					const s = l.find((x) => x.id === co.subscription_id);
					if (live && s) setSub(s);
				})
				.catch(() => {});
		const t = setInterval(poll, 3000);
		return () => {
			live = false;
			clearInterval(t);
		};
	}, [co.subscription_id, done, dead]);

	useEffect(() => {
		if (!done) return;
		router.invalidate();
		toast(`Payment confirmed. You're on ${planLabel(co.plan)}.`);
	}, [done, router, co.plan]);

	const name = planLabel(co.plan);
	if (done)
		return (
			<div className="flex flex-col items-center py-4 text-center">
				<span className="lunas-stamp" aria-hidden="true">
					Lunas
				</span>
				<p className="mt-6 text-lg font-bold">
					You're on {name}
					{sub?.period_end && (
						<span suppressHydrationWarning> until {day(sub.period_end)}</span>
					)}
				</p>
				<p className="mt-1 text-sm text-kertas/65">
					Payment confirmed. Your new limits apply now.
				</p>
				<Button variant="primary" className="mt-6" onClick={onClose}>
					Done
				</Button>
			</div>
		);

	const amount = zec(co.amount_zat);
	const idx = STEPS.findIndex((s) => s.key === status);
	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-xs text-kertas/60">
						Send exactly · {name},{" "}
						{co.months === 1 ? "1 month" : `${co.months} months`}
					</p>
					<p className="text-[28px] leading-tight font-bold tracking-[-0.02em] tabular-nums">
						{amount}{" "}
						<span className="text-base font-medium text-kertas/55">ZEC</span>
					</p>
					<p className="text-sm text-kertas/65 tabular-nums">
						{usd(co.price_usd)} at 1 ZEC = {fiat(co.zec_usd, "USD")}
					</p>
				</div>
				<CopyButton text={amount} label="Copy amount" size="sm" />
			</div>

			<div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
				<div>
					<p className="mb-1 text-xs text-kertas/60">Shielded address</p>
					<Mono
						value={co.invoice.address}
						head={14}
						tail={10}
						label="Copy address"
					/>
				</div>
				<div className="border-t border-white/[0.08] pt-3">
					<p className="mb-1 text-xs text-kertas/60">Payment URI (ZIP 321)</p>
					<Mono
						value={co.invoice.zip321_uri}
						head={24}
						tail={12}
						label="Copy payment URI"
					/>
				</div>
				{co.invoice.zip321_uri.startsWith("zcash:") && (
					<a
						href={co.invoice.zip321_uri}
						className={`${button("primary")} w-full`}
					>
						Open in wallet
						<Icon name="external" className="size-3.5" />
					</a>
				)}
			</div>

			{dead ? (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
					<p className="text-kertas/75">
						This payment request expired. No ZEC was taken.
					</p>
					<Button size="sm" onClick={onClose}>
						Close
					</Button>
				</div>
			) : (
				<>
					<ol
						className="flex items-center gap-2 text-xs"
						aria-label="Payment status"
					>
						{STEPS.map((s, i) => (
							<li
								key={s.key}
								aria-current={i === idx ? "step" : undefined}
								className={`flex flex-1 items-center gap-2 ${i <= idx ? "text-kertas" : "text-kertas/45"}`}
							>
								<span
									className={`h-1 flex-1 rounded-full ${i < idx ? "bg-lunas" : i === idx ? "bg-lunas/60" : "bg-white/10"}`}
								/>
								{s.label}
							</li>
						))}
					</ol>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p
							className="flex items-center gap-2 text-sm text-kertas/65"
							aria-live="polite"
						>
							<Spinner className="size-3.5" />
							<span>
								{status === "detected"
									? "Payment seen, confirming"
									: "Waiting for payment"}{" "}
								· <Countdown to={co.invoice.expires_at} prefix="expires in" />
							</span>
						</p>
						{sandbox && (
							<Button
								icon="send"
								pending={busy === "sim"}
								onClick={() =>
									run(
										"sim",
										() => simulatePaid({ data: { id: co.subscription_id } }),
										"Sandbox payment sent",
									).then(() =>
										listBilling()
											.then((l) =>
												setSub(
													l.find((x) => x.id === co.subscription_id) ?? null,
												),
											)
											.catch(() => {}),
									)
								}
							>
								Simulate payment
							</Button>
						)}
					</div>
				</>
			)}
		</div>
	);
}

/* ---------- History ---------- */

const SUB: Record<
	Subscription["status"],
	{
		label: string;
		tone: "success" | "warning" | "neutral" | "muted";
		note?: string;
	}
> = {
	paid: { label: "Paid", tone: "success" },
	late_paid: {
		label: "Paid late",
		tone: "warning",
		note: "The payment arrived after the invoice expired. Contact support to apply it.",
	},
	pending: { label: "Pending", tone: "neutral" },
	expired: { label: "Expired", tone: "muted" },
	cancelled: { label: "Cancelled", tone: "muted" },
};

function History({ history }: { history: Subscription[] }) {
	return (
		<Card title="Billing history" flush>
			{history.length === 0 ? (
				<EmptyState icon="invoice" title="No payments yet">
					Plan payments show up here, with the ZEC amount and the rate you paid
					at.
				</EmptyState>
			) : (
				<Table
					caption="Billing history"
					head={
						<>
							<th className={th}>Date</th>
							<th className={th}>Plan</th>
							<th className={th}>Period</th>
							<th className={`${th} text-right`}>Amount</th>
							<th className={th}>Status</th>
							<th className={th}>Invoice</th>
						</>
					}
				>
					{history.map((s) => (
						<tr key={s.id}>
							<td className={td} data-label="Date" suppressHydrationWarning>
								{day(s.created_at)}
							</td>
							<td className={`${td} font-medium`} data-label="Plan">
								{planLabel(s.plan)}
							</td>
							<td className={td} data-label="Period" suppressHydrationWarning>
								{s.months === 1 ? "1 month" : `${s.months} months`}
								{s.period_start && s.period_end && (
									<span className="block text-xs text-kertas/55">
										{day(s.period_start)} – {day(s.period_end)}
									</span>
								)}
							</td>
							<td
								className={`${td} text-right tabular-nums`}
								data-label="Amount"
								data-end
							>
								{zec(s.amount_zat)} <span className="text-kertas/55">ZEC</span>
								<span className="block text-xs text-kertas/55">
									≈ {usd(s.price_usd)}
								</span>
							</td>
							<td className={td} data-label="Status">
								<Badge tone={SUB[s.status]?.tone ?? "neutral"} dot>
									{SUB[s.status]?.label ?? s.status}
								</Badge>
								{SUB[s.status]?.note && (
									<span className="mt-1 block max-w-[16rem] text-xs text-kertas/60">
										{SUB[s.status]?.note}
									</span>
								)}
							</td>
							<td className={td} data-label="Invoice">
								<Mono
									value={s.invoice_id}
									head={8}
									tail={4}
									label="Copy invoice ID"
								/>
							</td>
						</tr>
					))}
				</Table>
			)}
		</Card>
	);
}
