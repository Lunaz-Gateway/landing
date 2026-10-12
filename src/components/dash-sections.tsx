import { Link, useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	type Account,
	type ApiKey,
	createKey,
	type Delivery,
	exportCsv,
	getInvoice,
	type Invoice,
	type InvoiceDetail,
	revokeKey,
	rotateSecret,
	saveWebhook,
	testWebhook,
} from "#/server/dash";
import {
	Amount,
	Badge,
	Button,
	Card,
	ConfirmDialog,
	CopyButton,
	Dialog,
	EmptyState,
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

export function Code({ children, copy }: { children: string; copy?: string }) {
	return (
		<div className="relative">
			<pre className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#171a36] p-4 pr-12 font-mono text-xs leading-relaxed text-kertas/90">
				{children}
			</pre>
			<div className="absolute top-2 right-2">
				<CopyButton
					text={children}
					label={copy ?? "Copy code"}
					toastMsg="Copied"
					iconOnly
				/>
			</div>
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
			<PageHeader title={title} />
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
			className="flex flex-wrap items-end gap-3"
			onSubmit={async (e) => {
				e.preventDefault();
				const k = await run("create", () => createKey({ data: { name } }));
				if (k) {
					setName("");
					onCreated({ name: k.name, key: k.key });
				}
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
				className="mb-[22px]"
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
					shown. Store it in your server's secrets.
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
				description="Your server uses these keys to create invoices. Keep them secret."
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
								<tr key={k.id} className={k.revoked_at ? "opacity-60" : ""}>
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
									<td className={`${td} text-right`} data-end>
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

// rawBody: the request body as received, before JSON parsing
function verify(rawBody, signature, secret) {
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(hex);
  const b = Buffer.from(signature ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

// verify(raw, req.headers["x-lunaz-signature"], process.env.LUNAZ_WEBHOOK_SECRET)`;

const okCode = (c: number | null) => c !== null && c >= 200 && c < 300;

export function Webhooks({
	webhook,
	deliveries,
}: {
	webhook: { url: string | null; secret: string };
	deliveries: Delivery[];
}) {
	const router = useRouter();
	const { run, busy } = useAction();
	const [url, setUrl] = useState(webhook.url ?? "");
	const [show, setShow] = useState(false);
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
									const r = await run("test", () => testWebhook());
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
							<span className="truncate">
								{show ? webhook.secret : "•".repeat(32)}
							</span>
						</code>
						<Button
							icon={show ? "eyeOff" : "eye"}
							onClick={() => setShow(!show)}
							aria-pressed={show}
						>
							{show ? "Hide" : "Reveal"}
						</Button>
						<CopyButton
							text={webhook.secret}
							toastMsg="Signing secret copied"
						/>
						<Button
							variant="danger-soft"
							icon="rotate"
							onClick={() => setRotating(true)}
						>
							Rotate
						</Button>
					</div>
				</Card>

				<Card
					title="Recent deliveries"
					description="The last 50 webhook attempts."
					flush
					actions={
						<Button
							size="sm"
							icon="refresh"
							pending={busy === "refresh"}
							onClick={() => run("refresh", () => router.invalidate())}
						>
							Refresh
						</Button>
					}
				>
					{deliveries.length === 0 ? (
						<EmptyState icon="hook" title="No deliveries yet">
							Send a test event or wait for an invoice to change.
						</EmptyState>
					) : (
						<Table
							caption="Recent webhook deliveries"
							head={
								<>
									<th className={th}>Event</th>
									<th className={th}>Result</th>
									<th className={th}>Invoice</th>
									<th className={th}>Attempt</th>
									<th className={`${th} text-right`}>Time</th>
								</>
							}
						>
							{deliveries.map((d) => (
								<tr key={d.id}>
									<td
										className={`${td} font-mono text-[13px]`}
										data-label="Event"
									>
										{d.type}
									</td>
									<td className={td} data-label="Result">
										{okCode(d.status_code) ? (
											<Badge tone="success">{d.status_code} OK</Badge>
										) : (
											<span className="inline-flex max-w-64 items-center gap-2">
												<Badge tone="danger">{d.status_code ?? "Failed"}</Badge>
												{d.error && (
													<span
														className="truncate text-xs text-kertas/60"
														title={d.error}
													>
														{d.error}
													</span>
												)}
											</span>
										)}
									</td>
									<td className={td} data-label="Invoice">
										{d.invoice_id ? (
											<Link
												to="/dashboard/invoices"
												search={{ id: d.invoice_id }}
												className="dash-focus rounded-sm font-mono text-[13px] text-kertas/85 underline decoration-white/25 underline-offset-2 hover:decoration-kertas"
											>
												{d.invoice_id.slice(0, 8)}
											</Link>
										) : (
											<span className="text-kertas/45">—</span>
										)}
									</td>
									<td className={`${td} tabular-nums`} data-label="Attempt">
										#{d.attempt}
									</td>
									<td className={`${td} text-right`} data-label="Time" data-end>
										<Time s={d.created_at} />
									</td>
								</tr>
							))}
						</Table>
					)}
				</Card>

				<Card
					title="Verify the signature"
					description={
						<>
							Each request carries{" "}
							<code className="font-mono text-kertas/85">
								X-Lunaz-Signature
							</code>
							, the HMAC-SHA256 hex of the raw body. The JSON body has a{" "}
							<code className="font-mono text-kertas/85">type</code>:
							invoice.paid, invoice.underpaid, swap.refunded, swap.failed,
							swap.incomplete_deposit or test.
						</>
					}
				>
					<Code>{SNIPPET}</Code>
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
							await rotateSecret();
							await router.invalidate();
							setShow(true);
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
	`https://blockchair.com/zcash/transaction/${txid}`;

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
									<span className="text-base font-medium text-kertas/50">
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
									<span className="text-kertas/45">Not paid yet</span>
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
							<Code copy="Copy command">{curlFor()}</Code>
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
									className="dash-focus flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-kertas/65 capitalize transition-colors hover:text-kertas has-[:checked]:bg-white/[0.09] has-[:checked]:font-medium has-[:checked]:text-kertas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lunas"
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
									<span className="text-xs text-kertas/45 tabular-nums">
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
									<td className={td} data-label="Invoice">
										<button
											type="button"
											className="dash-focus rounded-sm font-mono text-[13px] underline decoration-white/20 underline-offset-2 hover:decoration-kertas"
											onClick={() => setSearch({ ...search, id: i.id })}
											aria-label={`Open invoice ${i.id}`}
										>
											{i.id.slice(0, 8)}
										</button>
									</td>
									<td className={td} data-label="Status">
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
										className={td}
										data-label="Txid"
										data-sm-hide={!i.txid || undefined}
									>
										{i.txid ? (
											<Mono value={i.txid} label="Copy txid" />
										) : (
											<span className="text-kertas/45">—</span>
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
