import {
	createFileRoute,
	getRouteApi,
	Link,
	useNavigate,
} from "@tanstack/react-router";
import { NameForm } from "#/components/dash-sections";
import {
	Badge,
	Button,
	Card,
	Icon,
	PageHeader,
	useAction,
} from "#/components/dash-ui";
import { signOutMagic } from "#/lib/magic";
import { getLimits, type Limit, type Limits, logout } from "#/server/dash";

const useAccount = () => getRouteApi("/dashboard/_app").useLoaderData();

export const Route = createFileRoute("/dashboard/_app/settings")({
	// Limits are informational: the page still renders when they fail to load
	loader: async () => ({ limits: await getLimits().catch(() => null) }),
	head: () => ({ meta: [{ title: "Settings · Lunaz Dashboard" }] }),
	component: Settings,
});

function Item({
	label,
	field,
	children,
}: {
	label: string;
	/** Row holds a form control: align the label with the control's text */
	field?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div className="grid gap-1.5 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
			<dt className={`text-sm text-kertas/60 ${field ? "sm:pt-2" : ""}`}>
				{label}
			</dt>
			<dd className="min-w-0 text-sm break-words">{children}</dd>
		</div>
	);
}

const usd = (n: number) =>
	`$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const LABEL: Record<Limit["id"], string> = {
	xc_invoice: "Cross-chain, per payment",
	xc_day: "Cross-chain, last 24 hours",
	xc_month: "Cross-chain, last 30 days",
	xc_first: "Cross-chain, first days",
	zec_day: "ZEC, last 24 hours",
	invoices_day: "Invoices created, last 24 hours",
};

const TIER = {
	new: {
		badge: "New account",
		tone: "neutral",
		text: "New accounts have limits on payment volume, mostly on cross-chain payments. They rise automatically as your account builds a history.",
	},
	established: {
		badge: "Established",
		tone: "info",
		text: "Your account has a payment history. Contact support if you need higher limits.",
	},
	verified: {
		badge: "Verified",
		tone: "success",
		text: "Payment volume on your account is not capped.",
	},
} as const;

function LimitRow({ l, firstDays }: { l: Limit; firstDays: number }) {
	const fmt =
		l.rail === "invoices" ? (n: number) => n.toLocaleString("en-US") : usd;
	const label =
		l.id === "xc_first" ? `Cross-chain, first ${firstDays} days` : LABEL[l.id];
	const share = l.used === null ? 0 : Math.min(1, l.used / l.cap);
	return (
		<Item label={label}>
			{l.window === "invoice" ? (
				<span className="tabular-nums">Up to {fmt(l.cap)}</span>
			) : (
				<div className="max-w-sm">
					<p className="flex flex-wrap justify-between gap-x-3 tabular-nums">
						<span>
							{l.used === null ? "—" : fmt(l.used)}{" "}
							<span className="text-kertas/55">of {fmt(l.cap)}</span>
						</span>
						{l.ends_at && (
							<span className="text-kertas/55">
								until{" "}
								{new Date(l.ends_at * 1000).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})}
							</span>
						)}
					</p>
					<div
						className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
						role="progressbar"
						aria-label={label}
						aria-valuemin={0}
						aria-valuemax={l.cap}
						aria-valuenow={l.used ?? undefined}
					>
						<div
							className={`h-full origin-left rounded-full ${share >= 1 ? "bg-[#ffb86b]" : "bg-lunas"}`}
							style={{ transform: `scaleX(${share})` }}
						/>
					</div>
				</div>
			)}
		</Item>
	);
}

function Step({
	done,
	children,
}: {
	done: boolean;
	children: React.ReactNode;
}) {
	return (
		<li className="flex items-start gap-2">
			<Icon
				name={done ? "check" : "arrow"}
				className={`mt-0.5 size-4 shrink-0 ${done ? "text-lunas" : "text-kertas/45"}`}
			/>
			<span className={done ? "text-kertas/55" : ""}>{children}</span>
		</li>
	);
}

function LimitsCard({ data }: { data: Limits }) {
	const t = TIER[data.tier];
	const n = data.next;
	return (
		<Card
			title="Account limits"
			description={t.text}
			actions={<Badge tone={t.tone}>{t.badge}</Badge>}
			flush
		>
			<dl className="divide-y divide-white/[0.06] border-t border-white/[0.07] px-4 sm:px-5">
				{data.limits.map((l) => (
					<LimitRow key={l.id} l={l} firstDays={data.first_days} />
				))}
				{n && (
					<Item label="Higher limits">
						<ul className="space-y-1.5">
							<Step done={n.age_days_left === 0}>
								Account is {data.first_days} days old
								{n.age_days_left > 0 &&
									` · ${n.age_days_left} ${n.age_days_left === 1 ? "day" : "days"} to go`}
							</Step>
							<Step done={n.paid_invoices_left === 0}>
								{n.paid_invoices_left > 0
									? `${n.paid_invoices_left} more paid ${n.paid_invoices_left === 1 ? "invoice" : "invoices"}`
									: "Enough paid invoices"}
							</Step>
							<Step done={!n.fee_outstanding}>
								{n.fee_outstanding ? (
									<>
										Pay your{" "}
										<Link
											to="/dashboard/fees"
											className="dash-focus rounded-sm underline underline-offset-2"
										>
											outstanding fees
										</Link>
									</>
								) : (
									"No outstanding fees"
								)}
							</Step>
						</ul>
					</Item>
				)}
			</dl>
		</Card>
	);
}

function Settings() {
	const account = useAccount();
	const { limits } = Route.useLoaderData();
	const navigate = useNavigate();
	const { run, busy } = useAction();
	return (
		<>
			<PageHeader title="Settings" description="Your Lunaz account." />
			<div className="space-y-6">
				<Card title="Account" flush>
					<dl className="divide-y divide-white/[0.06] border-t border-white/[0.07] px-4 sm:px-5">
						<Item label="Name" field>
							<NameForm key={account.name} initial={account.name} hideLabel />
						</Item>
						<Item label="Email">{account.email}</Item>
						<Item label="Network">
							<Badge tone={account.network === "main" ? "success" : "neutral"}>
								{account.network === "main" ? "Mainnet" : "Testnet"}
							</Badge>
						</Item>
						<Item label="Viewing key">
							{account.viewing_key_set ? (
								<span className="flex flex-wrap items-center gap-2">
									<Badge tone="success" dot>
										Connected (incoming only)
									</Badge>
									<span className="text-kertas/55">
										Set once at onboarding; it can't be changed here.
									</span>
								</span>
							) : (
								<span className="flex flex-wrap items-center gap-2">
									<Badge tone="warning" dot>
										Not connected
									</Badge>
									<a
										href="/dashboard"
										className="dash-focus rounded-sm underline underline-offset-2"
									>
										Connect your wallet
									</a>
								</span>
							)}
						</Item>
					</dl>
				</Card>
				{limits && <LimitsCard data={limits} />}
				<Card
					title="Session"
					description="Sign out of the dashboard on this device."
				>
					<Button
						icon="logout"
						pending={busy === "out"}
						onClick={() =>
							run("out", async () => {
								await signOutMagic();
								await logout();
								await navigate({ to: "/dashboard/login" });
							})
						}
					>
						Sign out
					</Button>
				</Card>
			</div>
		</>
	);
}
