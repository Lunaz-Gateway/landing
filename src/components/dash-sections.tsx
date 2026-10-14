import { Link, useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	type Account,
	type ApiKey,
	createKey,
	exportCsv,
	getInvoice,
	type Invoice,
	type InvoiceDetail,
	retryFailedWebhookEvents,
	retryWebhookEvent,
	revealWebhookSecret,
	revokeKey,
	rotateSecret,
	saveWebhook,
	setName,
	testWebhook,
	type WebhookEvent,
} from "#/server/dash";
import {
	Amount,
	Badge,
	Button,
	Card,
	ConfirmDialog,
	CopyButton,
	copyText,
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
	Table,
	Time,
	td,
	th,
	useAction,
	zec,
} from "./dash-ui";

/* ---------- Shared ---------- */

export const curlFor = (key = "lz_...") => `curl -X POST $LUNAZ/v1/invoices \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount_zat":10000}'`;

export function Code({
	children,
	copy,
	lang,
}: {
	children: string;
	copy?: string;
	lang?: string;
}) {
	return (
		<div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#171a36]">
			<div className="flex items-center justify-between border-b border-white/[0.06] py-1 pr-2 pl-4">
				<span className="text-xs text-kertas/60">{lang}</span>
				<CopyButton
					text={children}
					label={copy ?? "Copy code"}
					toastMsg="Copied"
					iconOnly
				/>
			</div>
			<pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-kertas/90">
				{children}
			</pre>
		</div>
	);
}

const STATUS: Record<
	Invoice["status"],
	{
		label: string;
		tone: "success" | "warning" | "info" | "neutral" | "muted";
		desc: string;
	}
> = {
	paid: { label: "Paid", tone: "success", desc: "Payment confirmed." },
	detected: {
		label: "Detected",
		tone: "info",
		desc: "Payment seen, waiting for confirmation.",
	},
	pending: { label: "Pending", tone: "neutral", desc: "Waiting for payment." },
	underpaid: {
		label: "Underpaid",
		tone: "warning",
		desc: "Received less than the invoice amount.",
	},
	expired: {
		label: "Expired",
		tone: "muted",
		desc: "Expired without full payment.",
	},
};

export function StatusPill({ status }: { status: Invoice["status"] }) {
	const s = STATUS[status] ?? STATUS.pending;
	return (
		<Badge tone={s.tone} dot>
			{s.label}
		</Badge>
	);
}

export function TableSkeleton({
	rows = 6,
	cols = 5,
}: {
	rows?: number;
	cols?: number;
}) {
	return (
		<div className="dash-card overflow-hidden" aria-hidden="true">
			<div className="flex h-10 items-center gap-8 border-b border-white/[0.08] px-4">
				{Array.from({ length: cols }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					<Skeleton key={i} className="h-3 w-16" />
				))}
			</div>
			{Array.from({ length: rows }, (_, r) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					key={r}
					className="flex h-[53px] items-center gap-8 border-t border-white/[0.06] px-4 first:border-t-0"
				>
					{Array.from({ length: cols }, (_, i) => (
						<Skeleton
							// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
							key={i}
							className={`h-3.5 ${i === 0 ? "w-28" : "w-20"}`}
						/>
					))}
				</div>
			))}
		</div>
	);
}

export function PageSkeleton({
	title,
	children,
}: {
	title: string;
	children?: ReactNode;
}) {
	return (
		<div aria-busy="true">
			<output className="sr-only">Loading {title}…</output>
			<PageHeader
				title={title}
				description={<Skeleton className="mt-1.5 h-3.5 w-64 max-w-full" />}
			/>
			<div className="space-y-6">{children ?? <TableSkeleton />}</div>
		</div>
	);
}

/* ---------- API keys ---------- */

export type NewKey = { name: string; key: string };

export function CreateKeyForm({
	onCreated,
}: {
	onCreated: (k: NewKey) => void;
}) {
	const [name, setName] = useState("");
	const { run, busy } = useAction();
	return (
		<form
			className="flex max-w-xl flex-wrap items-end gap-3"
			onSubmit={async (e) => {
				e.preventDefault();
				const k = await run("create", () => createKey({ data: { name } }));
				if (!k) return;
				setName("");
				onCreated({ name: k.name, key: k.key });
			}}
		>
			<Input
				id="key-name"
				label="Key name"
				className="min-w-48 flex-1"
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="e.g. production"
				hint="Only for you, to tell keys apart."
				maxLength={64}
				required
			/>
			<Button
				type="submit"
				variant="primary"
				icon="plus"
				pending={busy === "create"}
				className="sm:mb-[22px]"
			>
				Create key
			</Button>
		</form>
	);
}

export function KeyRevealDialog({
	created,
	onDone,
}: {
	created: NewKey | null;
	onDone: () => void;
}) {
	return (
		<Dialog
			open={!!created}
			onClose={onDone}
			title="Save your API key"
			description={
				<>
					This is the only time the full key for{" "}
					<span className="font-medium text-kertas">{created?.name}</span> is
					shown. Store it as a secret on your server or with the marketplace you
					sell on.
				</>
			}
			initialFocus="[data-copy] button"
			footer={
				<Button variant="primary" onClick={onDone}>
					I've saved it
				</Button>
			}
		>
			{created && (
				<div className="space-y-3">
					<code className="block rounded-lg border border-lunas/30 bg-[#171a36] p-3 font-mono text-sm break-all text-lunas">
						{created.key}
					</code>
					<div data-copy>
						<CopyButton
							text={created.key}
							label="Copy key"
							toastMsg="API key copied"
						/>
					</div>
				</div>
			)}
		</Dialog>
	);
}

export function ApiKeys({ keys }: { keys: ApiKey[] }) {
	const router = useRouter();
	const { run } = useAction();
	const [created, setCreated] = useState<NewKey | null>(null);
	const [revoking, setRevoking] = useState<ApiKey | null>(null);
	const sorted = [...keys].sort(
		(a, b) =>
			Number(!!a.revoked_at) - Number(!!b.revoked_at) ||
			b.created_at - a.created_at,
	);
	return (
		<>
			<PageHeader
				title="API keys"
				description="Your backend, or the marketplace you sell on, uses these keys to create invoices. Keep them secret."
			/>
			<div className="space-y-6">
				<Card
					title="Create an API key"
					description="The full key is shown once, right after you create it."
				>
					<CreateKeyForm
						onCreated={(k) => {
							setCreated(k);
							router.invalidate();
						}}
					/>
				</Card>

				<Card title="Your keys" flush>
					{sorted.length === 0 ? (
						<EmptyState icon="key" title="No API keys yet">
							Create a key above to start making invoices.
						</EmptyState>
					) : (
						<Table
							caption="API keys"
							head={
								<>
									<th className={th}>Name</th>
									<th className={th}>Key</th>
									<th className={th}>Created</th>
									<th className={th}>Last used</th>
									<th className={th}>Status</th>
									<th className={th}>
										<span className="sr-only">Actions</span>
									</th>
								</>
							}
						>
							{sorted.map((k) => (
								<tr
									key={k.id}
									className={`sm:h-14 ${k.revoked_at ? "opacity-60" : ""}`}
								>
									<td className={`${td} font-medium`} data-label="Name">
										{k.name}
									</td>
									<td
										className={`${td} font-mono text-[13px]`}
										data-label="Key"
									>
										{k.prefix}…
									</td>
									<td className={td} data-label="Created">
										<Time s={k.created_at} />
									</td>
									<td className={td} data-label="Last used">
										<Time s={k.last_used_at} empty="Never" />
									</td>
									<td className={td} data-label="Status">
										{k.revoked_at ? (
											<Badge tone="muted">Revoked</Badge>
										) : (
											<Badge tone="success" dot>
												Active
											</Badge>
										)}
									</td>
									<td
										className={`${td} self-end text-right`}
										data-end
										data-sm-end
										data-sm-hide={k.revoked_at ? true : undefined}
									>
										{!k.revoked_at && (
											<Button
												variant="danger-soft"
												size="sm"
												aria-label={`Revoke ${k.name}`}
												onClick={() => setRevoking(k)}
											>
												Revoke
											</Button>
										)}
									</td>
								</tr>
							))}
						</Table>
					)}
				</Card>
			</div>

			<KeyRevealDialog created={created} onDone={() => setCreated(null)} />
			<ConfirmDialog
				open={!!revoking}
				onClose={() => setRevoking(null)}
				title={`Revoke "${revoking?.name}"?`}
				confirmLabel="Revoke key"
				onConfirm={() =>
					run(
						"revoke",
						async () => {
							if (revoking) await revokeKey({ data: { id: revoking.id } });
							await router.invalidate();
						},
						`Key "${revoking?.name}" revoked`,
					)
				}
			>
				Requests using{" "}
				<span className="font-mono text-kertas">{revoking?.prefix}…</span> will
				fail immediately. This can't be undone.
			</ConfirmDialog>
		</>
	);
}

/* ---------- Webhooks ---------- */

const SNIPPET = `import { createHmac, timingSafeEqual } from "node:crypto";

// header: X-Lunaz-Signature, "t=<unix seconds>,v1=<hex>"
// rawBody: the request body as received, before JSON parsing
function verify(rawBody, header, secret, toleranceSecs = 300) {
  const parts = Object.fromEntries(
    (header ?? "").split(",").map((p) => p.trim().split("=", 2)),
  );
  const t = Number(parts.t);
  if (!Number.isInteger(t) || !/^[0-9a-f]{64}$/.test(parts.v1 ?? "")) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSecs) return false; // replay
  const want = createHmac("sha256", secret).update(\`\${t}.\${rawBody}\`).digest();
  return timingSafeEqual(Buffer.from(parts.v1, "hex"), want);
}

// if (!verify(raw, req.headers["x-lunaz-signature"], process.env.LUNAZ_WEBHOOK_SECRET)) return 401
// Retries resend the same event: skip X-Lunaz-Event-Id values you already processed.`;

const okCode = (c: number | null) => c !== null && c >= 200 && c < 300;

// Raw HTTP client errors read as noise; the full text stays in the tooltip
const deliveryError = (e: string) =>
	/error sending request|connect|dns|timed? ?out/i.test(e)
		? "Couldn't reach your endpoint"
		: e;

export function Webhooks({
	webhook,
	events,
}: {
	webhook: { url: string | null };
	events: WebhookEvent[];
}) {
	const router = useRouter();
	const { run, busy } = useAction();
	const [url, setUrl] = useState(webhook.url ?? "");
	const [secret, setSecret] = useState<string | null>(null);
	const [rotating, setRotating] = useState(false);
	const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
	const dirty = url.trim() !== (webhook.url ?? "");

	return (
		<>
			<PageHeader
				title="Webhooks"
				description="Lunaz sends a signed POST to your endpoint when an invoice changes."
			/>
			<div className="space-y-6">
				<Card title="Endpoint">
					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							run(
								"save",
								async () => {
									await saveWebhook({ data: { url } });
									setTest(null);
									await router.invalidate();
								},
								url.trim() ? "Webhook URL saved" : "Webhook removed",
							);
						}}
					>
						<Input
							id="wh-url"
							type="url"
							label="Webhook URL"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://example.com/lunaz-webhook"
							hint="Must be reachable from the internet. Leave empty to stop deliveries."
						/>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="submit"
								variant="primary"
								pending={busy === "save"}
								disabled={!dirty}
							>
								Save
							</Button>
							<Button
								icon="send"
								pending={busy === "test"}
								disabled={!webhook.url || dirty}
								onClick={async () => {
									setTest(null);
									const r = await run(
										"test",
										() => testWebhook(),
										(r) =>
											okCode(r.status)
												? "Test event delivered"
												: [
														`Test failed: endpoint answered ${r.status}`,
														"error",
													],
									);
									if (!r) return;
									const ok = okCode(r.status);
									setTest({
										ok,
										text: ok
											? `Delivered. Your endpoint answered ${r.status}.`
											: `Your endpoint answered ${r.status}. Expected a 2xx response.`,
									});
									await router.invalidate();
								}}
							>
								Send test event
							</Button>
							{test && (
								<output
									className={`flex items-center gap-1.5 text-sm ${test.ok ? "text-lunas" : "text-[#ffa597]"}`}
								>
									<Icon name={test.ok ? "check" : "alert"} />
									{test.text}
								</output>
							)}
							{!webhook.url && !dirty && (
								<span className="text-sm text-kertas/55">
									Save a URL to send a test.
								</span>
							)}
						</div>
					</form>
				</Card>

				<Card
					title="Signing secret"
					description="Verify the X-Lunaz-Signature header with this secret."
				>
					<div className="flex flex-wrap items-center gap-2">
						<code className="flex h-9 min-w-0 flex-1 basis-64 items-center overflow-hidden rounded-lg border border-white/[0.08] bg-[#171a36] px-3 font-mono text-[13px]">
							<span className="truncate">{secret ?? "•".repeat(32)}</span>
						</code>
						<Button
							icon={secret ? "eyeOff" : "eye"}
							onClick={() =>
								secret
									? setSecret(null)
									: run("reveal", async () => {
											setSecret((await revealWebhookSecret()).secret);
										})
							}
							aria-pressed={!!secret}
						>
							{secret ? "Hide" : "Reveal"}
						</Button>
						<Button
							icon="copy"
							onClick={() =>
								run("copy-secret", async () => {
									const { secret: s } = await revealWebhookSecret();
									await copyText(s, "Signing secret copied");
								})
							}
						>
							Copy
						</Button>
						<Button
							variant="danger-soft"
							icon="rotate"
							onClick={() => setRotating(true)}
						>
							Rotate
						</Button>
					</div>
				</Card>

				<WebhookEvents events={events} />

				<Card
					title="Verify the signature"
					description={
						<>
							Each request carries{" "}
							<code className="font-mono text-kertas/85">X-Lunaz-Event-Id</code>{" "}
							(the same on every retry) and{" "}
							<code className="font-mono text-kertas/85">
								X-Lunaz-Signature: t=…,v1=…
							</code>
							, the HMAC-SHA256 hex of{" "}
							<code className="font-mono text-kertas/85">
								{"{t}.{raw body}"}
							</code>
							. Reject a t more than 5 minutes off and de-duplicate by event id.
							The JSON body has an{" "}
							<code className="font-mono text-kertas/85">id</code>,{" "}
							<code className="font-mono text-kertas/85">created_at</code> and a{" "}
							<code className="font-mono text-kertas/85">type</code>:
							invoice.paid, invoice.underpaid, swap.refunded, swap.failed,
							swap.incomplete_deposit, withdrawal.updated or test.
						</>
					}
				>
					<Code lang="Node.js">{SNIPPET}</Code>
				</Card>
			</div>

			<ConfirmDialog
				open={rotating}
				onClose={() => setRotating(false)}
				title="Rotate signing secret?"
				confirmLabel="Rotate secret"
				onConfirm={() =>
					run(
						"rotate",
						async () => {
							setSecret((await rotateSecret()).secret);
							await router.invalidate();
						},
						"Secret rotated. Update your server now.",
					)
				}
			>
				The current secret stops working immediately. Deliveries fail
				verification until your server uses the new one.
			</ConfirmDialog>
		</>
	);
}

const EV_FILTERS = ["all", "pending", "delivered", "failed"] as const;
const EV_TONE = {
	delivered: "success",
	pending: "neutral",
	failed: "danger",
} as const;
const EV_EMPTY: Record<(typeof EV_FILTERS)[number], string> = {
	all: "Send a test event or wait for an invoice to change.",
	pending: "No events are waiting to be sent.",
	delivered: "No event has been delivered yet.",
	failed: "Nothing failed. Events that fail all 3 tries show up here.",
};

const result = (code: number | null, err: string | null) =>
	code !== null ? `HTTP ${code}` : err ? deliveryError(err) : "—";

function useNow(active: boolean) {
	const [now, setNow] = useState(() => Date.now() / 1000);
	useEffect(() => {
		if (!active) return;
		const t = setInterval(() => setNow(Date.now() / 1000), 1000);
		return () => clearInterval(t);
	}, [active]);
	return now;
}

function EventStatus({ e, now }: { e: WebhookEvent; now: number }) {
	const wait = e.next_attempt_at ? Math.ceil(e.next_attempt_at - now) : 0;
	return (
		<span className="inline-flex flex-wrap items-center gap-2">
			<Badge tone={EV_TONE[e.status]} dot>
				{e.status === "delivered"
					? "Delivered"
					: e.status === "failed"
						? "Failed"
						: "Pending"}
			</Badge>
			{e.status === "pending" && (
				<span className="text-xs text-kertas/60 tabular-nums">
					{wait > 0 ? `next try in ${wait} s` : "trying now"}
				</span>
			)}
		</span>
	);
}

function WebhookEvents({ events }: { events: WebhookEvent[] }) {
	const router = useRouter();
	const { run, busy } = useAction();
	const [filter, setFilter] = useState<(typeof EV_FILTERS)[number]>("all");
	const [openId, setOpenId] = useState<string | null>(null);
	const [confirmAll, setConfirmAll] = useState(false);
	const counts = useMemo(() => {
		const c = { all: events.length, pending: 0, delivered: 0, failed: 0 };
		for (const e of events) c[e.status]++;
		return c;
	}, [events]);
	const now = useNow(counts.pending > 0);
	const rows =
		filter === "all" ? events : events.filter((e) => e.status === filter);
	const open = events.find((e) => e.id === openId) ?? null;

	// Poll while anything is pending; stops by itself once none is
	useEffect(() => {
		if (counts.pending === 0) return;
		const t = setInterval(() => router.invalidate(), 5000);
		return () => clearInterval(t);
	}, [counts.pending, router]);

	const retry = (e: WebhookEvent) =>
		run(
			`retry-${e.id}`,
			async () => {
				await retryWebhookEvent({ data: { id: e.id } });
				await router.invalidate();
			},
			"Retry queued",
		);

	return (
		<Card
			title="Events"
			description="Each event is tried up to 3 times (right away, after 10 seconds and after 1 minute). Failed events can be sent again."
			flush
			actions={
				<>
					{counts.failed > 0 && (
						<Button
							size="sm"
							icon="rotate"
							pending={busy === "retry-all"}
							onClick={() => setConfirmAll(true)}
						>
							Retry all failed
						</Button>
					)}
					<Button
						size="sm"
						icon="refresh"
						pending={busy === "refresh"}
						onClick={() => run("refresh", () => router.invalidate())}
					>
						Refresh
					</Button>
				</>
			}
		>
			<div
				role="radiogroup"
				aria-label="Filter events by status"
				className="flex gap-1 overflow-x-auto px-4 pb-3"
			>
				{EV_FILTERS.map((f) => (
					<label
						key={f}
						className="dash-focus relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-kertas/65 capitalize transition-colors hover:text-kertas has-[:checked]:bg-white/[0.09] has-[:checked]:font-medium has-[:checked]:text-kertas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lunas"
					>
						<input
							type="radio"
							name="event-status"
							value={f}
							checked={filter === f}
							onChange={() => setFilter(f)}
							className="sr-only"
						/>
						{f}
						<span className="text-xs text-kertas/55 tabular-nums">
							{counts[f]}
						</span>
					</label>
				))}
			</div>
			<output className="sr-only" aria-live="polite">
				{counts.all} events: {counts.pending} pending, {counts.delivered}{" "}
				delivered, {counts.failed} failed
			</output>
			{rows.length === 0 ? (
				<EmptyState
					icon="hook"
					title={filter === "all" ? "No events yet" : `No ${filter} events`}
				>
					{EV_EMPTY[filter]}
				</EmptyState>
			) : (
				<Table
					caption="Webhook events"
					head={
						<>
							<th className={th}>Time</th>
							<th className={th}>Type</th>
							<th className={th}>Invoice</th>
							<th className={th}>Status</th>
							<th className={th}>Attempts</th>
							<th className={th}>Last result</th>
							<th className={`${th} text-right`}>
								<span className="sr-only">Actions</span>
							</th>
						</>
					}
				>
					{rows.map((e) => (
						<tr
							key={e.id}
							data-href
							onClick={(ev) => {
								if (!(ev.target as HTMLElement).closest("button,a"))
									setOpenId(e.id);
							}}
						>
							<td className={td} data-label="Time">
								<Time s={e.created_at} />
							</td>
							<td className={`${td} font-mono text-[13px]`} data-label="Type">
								<button
									type="button"
									className="dash-focus rounded-sm underline decoration-white/20 underline-offset-2 hover:decoration-kertas"
									onClick={() => setOpenId(e.id)}
									aria-label={`Open event ${e.type}`}
								>
									{e.type}
								</button>
							</td>
							<td className={td} data-label="Invoice">
								{e.invoice_id ? (
									<Link
										to="/dashboard/invoices"
										search={{ id: e.invoice_id }}
										className="dash-focus rounded-sm font-mono text-[13px] text-kertas/85 underline decoration-white/25 underline-offset-2 hover:decoration-kertas"
									>
										{e.invoice_id.slice(0, 8)}
									</Link>
								) : (
									<span className="text-kertas/55">—</span>
								)}
							</td>
							<td className={td} data-label="Status" data-wide>
								<EventStatus e={e} now={now} />
							</td>
							<td className={`${td} tabular-nums`} data-label="Attempts">
								{e.attempts} / {e.max_attempts}
							</td>
							<td className={td} data-label="Last result" data-wide>
								<span
									className="block truncate text-kertas/75 sm:inline-block sm:max-w-56 sm:align-bottom"
									title={e.last_error ?? undefined}
								>
									{result(e.last_status_code, e.last_error)}
								</span>
							</td>
							<td className={`${td} text-right`} data-end>
								{e.status === "failed" && (
									<Button
										size="sm"
										icon="rotate"
										pending={busy === `retry-${e.id}`}
										aria-label={`Retry event ${e.type}`}
										onClick={() => retry(e)}
									>
										Retry
									</Button>
								)}
							</td>
						</tr>
					))}
				</Table>
			)}

			<Dialog
				open={!!open}
				onClose={() => setOpenId(null)}
				variant="sheet"
				initialFocus="self"
				title={open?.type ?? "Event"}
				description={
					open && (
						<Mono value={open.id} head={8} tail={4} label="Copy event ID" />
					)
				}
				footer={
					open?.status === "failed" && (
						<Button
							variant="primary"
							icon="rotate"
							pending={busy === `retry-${open.id}`}
							aria-label={`Retry event ${open.type}`}
							onClick={() => retry(open)}
						>
							Retry
						</Button>
					)
				}
			>
				{open && (
					<div className="space-y-6" aria-live="polite">
						<dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
							<dt className="text-kertas/55">Status</dt>
							<dd>
								<EventStatus e={open} now={now} />
							</dd>
							<dt className="text-kertas/55">Attempts</dt>
							<dd className="tabular-nums">
								{open.attempts} / {open.max_attempts}
							</dd>
							<dt className="text-kertas/55">Invoice</dt>
							<dd>
								{open.invoice_id ? (
									<Link
										to="/dashboard/invoices"
										search={{ id: open.invoice_id }}
										className="dash-focus rounded-sm font-mono text-[13px] underline decoration-white/25 underline-offset-2"
									>
										{open.invoice_id}
									</Link>
								) : (
									"—"
								)}
							</dd>
							<dt className="text-kertas/55">Created</dt>
							<dd>
								<Time s={open.created_at} absoluteOnly />
							</dd>
							<dt className="text-kertas/55">Updated</dt>
							<dd>
								<Time s={open.updated_at} absoluteOnly />
							</dd>
						</dl>
						<section>
							<h3 className="mb-2 text-sm font-bold">Attempts</h3>
							{open.deliveries.length === 0 ? (
								<p className="text-sm text-kertas/65">No attempt yet.</p>
							) : (
								<ol className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
									{open.deliveries.map((d) => (
										<li
											key={d.attempt}
											className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm"
										>
											<span className="tabular-nums">#{d.attempt}</span>
											<span
												className={
													okCode(d.status_code)
														? "text-lunas"
														: "text-[#ffa597]"
												}
												title={d.error ?? undefined}
											>
												{result(d.status_code, d.error)}
											</span>
											<span className="text-xs text-kertas/60">
												<Time s={d.created_at} absoluteOnly />
											</span>
										</li>
									))}
								</ol>
							)}
						</section>
					</div>
				)}
			</Dialog>

			<ConfirmDialog
				open={confirmAll}
				onClose={() => setConfirmAll(false)}
				title={`Send ${counts.failed} failed ${counts.failed === 1 ? "event" : "events"} again?`}
				confirmLabel="Retry all"
				danger={false}
				onConfirm={() =>
					run(
						"retry-all",
						async () => {
							const r = await retryFailedWebhookEvents();
							await router.invalidate();
							return r;
						},
						(r) =>
							`${r.retried} ${r.retried === 1 ? "event" : "events"} queued`,
					)
				}
			>
				Each one gets 3 new tries.
			</ConfirmDialog>
		</Card>
	);
}

/* ---------- Invoices ---------- */

export type InvoiceSearch = {
	status?: Invoice["status"];
	q?: string;
	id?: string;
	export?: boolean;
};
const FILTERS = [
	"all",
	"paid",
	"pending",
	"detected",
	"underpaid",
	"expired",
] as const;
const PAGE = 25;

const monthStart = () => {
	const d = new Date();
	return new Date(d.getFullYear(), d.getMonth(), 1);
};
// yyyy-mm-dd in local time, as native date inputs expect
const ymd = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function ExportDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [from, setFrom] = useState(() => ymd(monthStart()));
	const [to, setTo] = useState(() => ymd(new Date()));
	const [kind, setKind] = useState("invoices");
	const { run, busy } = useAction();

	async function download(e: React.FormEvent) {
		e.preventDefault();
		// local-day bounds as unix seconds
		const f = from ? new Date(`${from}T00:00:00`).getTime() / 1000 : "";
		const t = to ? new Date(`${to}T23:59:59`).getTime() / 1000 : "";
		const r = await run(
			"export",
			() => exportCsv({ data: { from: f, to: t, kind } }),
			(r) => `Downloaded ${r.filename}`,
		);
		if (!r) return;
		const url = URL.createObjectURL(
			new Blob([r.csv], { type: "text/csv;charset=utf-8" }),
		);
		const a = document.createElement("a");
		a.href = url;
		a.download = r.filename;
		a.click();
		URL.revokeObjectURL(url);
		onClose();
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title="Export CSV"
			initialFocus="#exp-from"
			description="For your accountant. Built from your viewing key; this data is not public."
			footer={
				<>
					<Button onClick={onClose}>Cancel</Button>
					<Button
						type="submit"
						form="export-form"
						variant="primary"
						icon="download"
						pending={busy === "export"}
					>
						Download
					</Button>
				</>
			}
		>
			<form
				id="export-form"
				onSubmit={download}
				className="grid gap-4 sm:grid-cols-2"
			>
				<Input
					id="exp-from"
					type="date"
					label="From"
					value={from}
					max={to || undefined}
					onChange={(e) => setFrom(e.target.value)}
				/>
				<Input
					id="exp-to"
					type="date"
					label="To"
					value={to}
					min={from || undefined}
					onChange={(e) => setTo(e.target.value)}
				/>
				<Select
					id="exp-kind"
					label="Contents"
					className="sm:col-span-2"
					value={kind}
					onChange={(e) => setKind(e.target.value)}
					hint={
						kind === "invoices"
							? "One row per invoice, with status and amounts."
							: "One row per received payment."
					}
				>
					<option value="invoices">Invoices</option>
					<option value="payments">Payments</option>
				</Select>
			</form>
		</Dialog>
	);
}

// Mainnet only; Blockchair indexes Zcash transactions by txid
const explorer = (txid: string) =>
	`https://blockchair.com/zcash/transaction/${encodeURIComponent(txid)}`;

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 text-sm">
			<dt className="text-kertas/55">{label}</dt>
			<dd className="min-w-0">{children}</dd>
		</div>
	);
}

function InvoiceDrawer({
	invoice,
	network,
	onClose,
}: {
	invoice: Invoice | null;
	network: Account["network"];
	onClose: () => void;
}) {
	const [shown, setShown] = useState(invoice);
	const [detail, setDetail] = useState<InvoiceDetail | null>(null);
	const [err, setErr] = useState(false);
	// Keep the last invoice rendered while the sheet animates out
	useEffect(() => {
		if (invoice) setShown(invoice);
	}, [invoice]);
	const id = invoice?.id;
	useEffect(() => {
		if (!id) return;
		let live = true;
		setDetail(null);
		setErr(false);
		getInvoice({ data: { id } }).then(
			(d) => live && setDetail(d),
			() => live && setErr(true),
		);
		return () => {
			live = false;
		};
	}, [id]);
	const i = invoice ?? shown;
	const status = i ? (STATUS[i.status] ?? STATUS.pending) : null;

	return (
		<Dialog
			open={!!invoice}
			onClose={onClose}
			variant="sheet"
			initialFocus="self"
			title="Invoice"
			description={
				i && <Mono value={i.id} head={8} tail={4} label="Copy invoice ID" />
			}
		>
			{i && status && (
				<div className="space-y-6">
					<div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-xs text-kertas/55">Amount</p>
								<p className="mt-0.5 text-2xl font-bold tracking-[-0.02em] tabular-nums">
									{zec(i.amount_zat)}{" "}
									<span className="text-base font-medium text-kertas/60">
										ZEC
									</span>
								</p>
							</div>
							<StatusPill status={i.status} />
						</div>
						<p className="mt-2 text-sm text-kertas/65">{status.desc}</p>
					</div>

					<section>
						<h3 className="mb-1 text-xs font-medium tracking-wide text-kertas/55 uppercase">
							Payment
						</h3>
						<dl className="divide-y divide-white/[0.06]">
							<Row label="Received">
								<Amount zat={i.received_zat} muted={i.received_zat === 0} />
							</Row>
							{i.overpaid_zat > 0 && (
								<Row label="Overpaid">
									<Amount zat={i.overpaid_zat} />
								</Row>
							)}
							{i.status === "underpaid" && (
								<Row label="Short by">
									<Amount zat={i.amount_zat - i.received_zat} />
								</Row>
							)}
							<Row label="Address">
								<Mono value={i.address} full label="Copy address" />
							</Row>
							<Row label="Transaction">
								{i.txid ? (
									<div className="space-y-1">
										<Mono value={i.txid} head={10} tail={8} label="Copy txid" />
										{network === "main" && (
											<a
												href={explorer(i.txid)}
												target="_blank"
												rel="noreferrer"
												className="dash-focus inline-flex items-center gap-1 rounded-sm text-xs text-kertas/70 underline decoration-white/25 underline-offset-2 hover:text-kertas"
											>
												View on Blockchair
												<Icon name="external" className="size-3" />
											</a>
										)}
									</div>
								) : (
									<span className="text-kertas/55">Not paid yet</span>
								)}
							</Row>
						</dl>
					</section>

					<section>
						<h3 className="mb-1 text-xs font-medium tracking-wide text-kertas/55 uppercase">
							Cross-chain swap
						</h3>
						{err ? (
							<p className="py-2.5 text-sm text-kertas/55">
								Couldn't load swap details.
							</p>
						) : !detail ? (
							<div className="space-y-2 py-2.5" aria-hidden="true">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-4 w-28" />
							</div>
						) : detail.swap ? (
							<dl className="divide-y divide-white/[0.06]">
								<Row label="Paid with">
									<span className="tabular-nums">
										{detail.swap.amount_in_formatted} {detail.swap.symbol}
									</span>{" "}
									<span className="text-kertas/55">
										on {detail.swap.blockchain}
									</span>
								</Row>
								<Row label="Swap status">
									<Badge
										tone={
											detail.swap.status === "SUCCESS"
												? "success"
												: /FAIL|REFUND|INCOMPLETE/.test(detail.swap.status)
													? "danger"
													: "neutral"
										}
									>
										{detail.swap.status.replaceAll("_", " ").toLowerCase()}
									</Badge>
								</Row>
								<Row label="Deposit address">
									<Mono
										value={detail.swap.deposit_address}
										label="Copy deposit address"
									/>
								</Row>
							</dl>
						) : (
							<p className="py-2.5 text-sm text-kertas/55">
								Paid directly in ZEC, no swap.
							</p>
						)}
					</section>

					<section>
						<h3 className="mb-1 text-xs font-medium tracking-wide text-kertas/55 uppercase">
							Timeline
						</h3>
						<dl className="divide-y divide-white/[0.06]">
							<Row label="Created">
								<Time s={i.created_at} absoluteOnly />
							</Row>
							<Row label={i.status === "expired" ? "Expired" : "Expires"}>
								<Time s={i.expires_at} absoluteOnly />
							</Row>
							<Row label="Paid">
								<Time s={i.paid_at} absoluteOnly empty="—" />
							</Row>
						</dl>
					</section>
				</div>
			)}
		</Dialog>
	);
}

export function Invoices({
	invoices,
	network,
	search,
	setSearch,
}: {
	invoices: Invoice[];
	network: Account["network"];
	search: InvoiceSearch;
	setSearch: (s: InvoiceSearch) => void;
}) {
	const [limit, setLimit] = useState(PAGE);
	const status = search.status ?? "all";
	const q = (search.q ?? "").trim().toLowerCase();
	const counts = useMemo(() => {
		const c: Record<string, number> = { all: invoices.length };
		for (const i of invoices) c[i.status] = (c[i.status] ?? 0) + 1;
		return c;
	}, [invoices]);
	const rows = useMemo(
		() =>
			invoices.filter(
				(i) =>
					(status === "all" || i.status === status) &&
					(!q ||
						i.id.toLowerCase().includes(q) ||
						i.txid?.toLowerCase().includes(q)),
			),
		[invoices, status, q],
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset paging when the filter changes
	useEffect(() => setLimit(PAGE), [status, q]);
	const open = invoices.find((i) => i.id === search.id) ?? null;

	return (
		<>
			<PageHeader
				title="Invoices"
				description={
					invoices.length >= 200
						? "Your 200 most recent invoices. Export a CSV for the full history."
						: "Every invoice created with your API keys."
				}
				actions={
					<Button
						icon="download"
						onClick={() => setSearch({ ...search, export: true })}
					>
						Export CSV
					</Button>
				}
			/>
			{invoices.length === 0 ? (
				<Card>
					<EmptyState
						icon="invoice"
						title="No invoices yet"
						action={
							<Link
								to="/dashboard/keys"
								className="dash-focus press inline-flex h-9 items-center rounded-lg bg-lunas px-3.5 text-sm font-bold text-malam"
							>
								Create an API key
							</Link>
						}
					>
						Create invoices from your server with an API key:
						<div className="mt-3 text-left">
							<Code copy="Copy command" lang="Terminal">
								{curlFor()}
							</Code>
						</div>
					</EmptyState>
				</Card>
			) : (
				<div className="dash-card overflow-hidden">
					<div className="flex flex-wrap items-center gap-3 border-b border-white/[0.08] p-3">
						<div
							role="radiogroup"
							aria-label="Filter by status"
							className="-m-1 flex w-[calc(100%+0.5rem)] min-w-0 gap-1 overflow-x-auto p-1 sm:w-auto sm:flex-1"
						>
							{FILTERS.map((f) => (
								<label
									key={f}
									className="dash-focus relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-kertas/65 capitalize transition-colors hover:text-kertas has-[:checked]:bg-white/[0.09] has-[:checked]:font-medium has-[:checked]:text-kertas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lunas"
								>
									<input
										type="radio"
										name="status"
										value={f}
										checked={status === f}
										onChange={() =>
											setSearch({
												...search,
												status: f === "all" ? undefined : f,
											})
										}
										className="sr-only"
									/>
									{f}
									<span className="text-xs text-kertas/55 tabular-nums">
										{counts[f] ?? 0}
									</span>
								</label>
							))}
						</div>
						<div className="relative w-full sm:w-64">
							<Icon
								name="search"
								className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-kertas/40"
							/>
							<label htmlFor="inv-q" className="sr-only">
								Search by invoice ID or txid
							</label>
							<input
								id="inv-q"
								type="search"
								value={search.q ?? ""}
								onChange={(e) =>
									setSearch({ ...search, q: e.target.value || undefined })
								}
								placeholder="Search invoice ID or txid"
								className="h-8 w-full rounded-lg border border-white/[0.13] bg-[#171a36] pr-3 pl-8 text-[13px] placeholder:text-kertas/35 hover:border-white/25 focus-visible:border-lunas/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-lunas/20"
							/>
						</div>
					</div>
					{rows.length === 0 ? (
						<EmptyState icon="search" title="No matching invoices">
							Try another status or search term.
						</EmptyState>
					) : (
						<Table
							caption="Invoices"
							head={
								<>
									<th className={th}>Invoice</th>
									<th className={th}>Status</th>
									<th className={`${th} text-right`}>Amount</th>
									<th className={`${th} text-right`}>Received</th>
									<th className={`${th} text-right`}>Fee</th>
									<th className={th}>Txid</th>
									<th className={`${th} text-right`}>Created</th>
								</>
							}
						>
							{rows.slice(0, limit).map((i) => (
								<tr
									key={i.id}
									data-href
									onClick={(e) => {
										if (!(e.target as HTMLElement).closest("button,a"))
											setSearch({ ...search, id: i.id });
									}}
								>
									<td className={td}>
										<button
											type="button"
											className="dash-focus rounded-sm font-mono text-[13px] underline decoration-white/20 underline-offset-2 hover:decoration-kertas"
											onClick={() => setSearch({ ...search, id: i.id })}
											aria-label={`Open invoice ${i.id}`}
										>
											{i.id.slice(0, 8)}
										</button>
									</td>
									<td className={td} data-sm-end>
										<StatusPill status={i.status} />
									</td>
									<td
										className={`${td} text-right`}
										data-label="Amount"
										data-end
									>
										<Amount zat={i.amount_zat} />
									</td>
									<td
										className={`${td} text-right`}
										data-label="Received"
										data-end
										data-sm-hide={i.received_zat === 0 || undefined}
									>
										<Amount zat={i.received_zat} muted={i.received_zat === 0} />
										{i.overpaid_zat > 0 && (
											<span className="ml-1.5 text-xs text-lunas">
												+{zec(i.overpaid_zat)}
											</span>
										)}
									</td>
									<td
										className={`${td} text-right`}
										data-label="Fee"
										data-end
										data-sm-hide={!i.fee_zat || undefined}
									>
										<Amount zat={i.fee_zat ?? 0} muted={!i.fee_zat} />
									</td>
									<td
										className={td}
										data-label="Txid"
										data-sm-hide={!i.txid || undefined}
									>
										{i.txid ? (
											<Mono value={i.txid} label="Copy txid" />
										) : (
											<span className="text-kertas/55">—</span>
										)}
									</td>
									<td
										className={`${td} text-right`}
										data-label="Created"
										data-end
									>
										<Time s={i.created_at} />
									</td>
								</tr>
							))}
						</Table>
					)}
					{rows.length > 0 && (
						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3 text-xs text-kertas/55">
							<span className="tabular-nums">
								Showing {Math.min(limit, rows.length)} of {rows.length}
							</span>
							{limit < rows.length && (
								<Button size="sm" onClick={() => setLimit(limit + PAGE)}>
									Show more
								</Button>
							)}
						</div>
					)}
				</div>
			)}

			<InvoiceDrawer
				invoice={open}
				network={network}
				onClose={() => setSearch({ ...search, id: undefined })}
			/>
			<ExportDialog
				open={!!search.export}
				onClose={() => setSearch({ ...search, export: undefined })}
			/>
		</>
	);
}

/** Business name editor; used as a prompt on Overview and in Settings */
export function NameForm({ initial = "" }: { initial?: string }) {
	const router = useRouter();
	const [name, setNameValue] = useState(initial);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<form
			className="space-y-3"
			onSubmit={async (e) => {
				e.preventDefault();
				setBusy(true);
				setError("");
				try {
					await setName({ data: { name } });
					await router.invalidate();
				} catch (err) {
					setError(errMsg(err));
				}
				setBusy(false);
			}}
		>
			<Input
				id="shop-name"
				label="Your shop or business name"
				autoComplete="organization"
				value={name}
				onChange={(e) => setNameValue(e.target.value)}
				maxLength={80}
				required
			/>
			<ErrorText error={error} />
			<Button type="submit" variant="primary" size="sm" pending={busy}>
				Save name
			</Button>
		</form>
	);
}
