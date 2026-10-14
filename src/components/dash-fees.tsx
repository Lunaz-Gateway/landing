import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	type Fees,
	getFees,
	type Settle,
	type Settlement,
	settleFees,
} from "#/server/dash";
import {
	Badge,
	Button,
	button,
	Card,
	Dialog,
	EmptyState,
	Icon,
	Mono,
	PageHeader,
	Spinner,
	Table,
	Time,
	td,
	th,
	toast,
	useAction,
	zec,
} from "./dash-ui";
import { Countdown } from "./dash-withdraw";

const pct = (bps: number) => `${(bps / 100).toString()}%`;

export function FeesPage({ fees }: { fees: Fees }) {
	const router = useRouter();
	const { run, busy } = useAction();
	const [pay, setPay] = useState<Settle | null>(null);
	const due = fees.outstanding_zat > 0;
	const stats = [
		{
			label: "Charged",
			value: fees.charged_zat,
			hint: "Fees on your payments",
		},
		{
			label: "Paid in payment",
			value: fees.paid_in_tx_zat,
			hint: "Paid by buyers with the order",
		},
		{ label: "Settled", value: fees.settled_zat, hint: "Paid from this page" },
	];

	return (
		<>
			<PageHeader
				title="Fees"
				description="Lunaz earns a small fee on each payment, paid by your buyer."
			/>
			<div className="space-y-6">
				<section className="dash-card p-5" aria-labelledby="out-h">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<h2 id="out-h" className="text-sm text-kertas/65">
								Outstanding fees
							</h2>
							<p className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.02em] tabular-nums">
								{zec(fees.outstanding_zat)}{" "}
								<span className="text-base font-medium text-kertas/55">
									ZEC
								</span>
							</p>
							<p className="mt-1 text-sm text-kertas/65">
								{due
									? "Fees that buyers did not pay with their order."
									: "Nothing to pay. You're all settled."}
							</p>
						</div>
						<Button
							variant="primary"
							disabled={!due}
							pending={busy === "settle"}
							onClick={async () => {
								const r = await run("settle", () => settleFees());
								if (r) setPay(r);
							}}
						>
							Pay outstanding fees
						</Button>
					</div>
					<dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
						{stats.map((s) => (
							<div key={s.label}>
								<dt className="text-sm text-kertas/65">{s.label}</dt>
								<dd className="mt-1 text-lg font-bold tabular-nums">
									{zec(s.value)}{" "}
									<span className="text-sm font-medium text-kertas/55">
										ZEC
									</span>
								</dd>
								<dd className="text-xs text-kertas/60">{s.hint}</dd>
							</div>
						))}
					</dl>
				</section>

				<Card title="How fees work">
					<ul className="space-y-2 text-sm text-kertas/75">
						<li>
							Each shielded payment request has a second payment for Lunaz:{" "}
							<span className="font-medium text-kertas">
								{pct(fees.fee_bps)}
							</span>{" "}
							of the invoice, at least{" "}
							<span className="font-medium text-kertas tabular-nums">
								{fees.fee_min_zat.toLocaleString("en-US")} zatoshis
							</span>
							. Your buyer pays it on top of the price.
						</li>
						<li>On a cross-chain payment, the fee is part of the swap app fee, also paid by the buyer.</li>
						<li>
							If a buyer's wallet pays only your part, the invoice is still
							paid. The missing fee shows here as outstanding.
						</li>
						<li>Pay outstanding fees any time with a ZEC payment to Lunaz.</li>
					</ul>
				</Card>

				<History items={fees.settlements} />
			</div>
			<Dialog
				open={!!pay}
				onClose={() => setPay(null)}
				title="Pay outstanding fees"
				description="Send this payment from any shielded wallet."
			>
				{pay && (
					<PayStep
						key={pay.id}
						pay={pay}
						onClose={() => {
							setPay(null);
							router.invalidate();
						}}
					/>
				)}
			</Dialog>
		</>
	);
}

function PayStep({ pay, onClose }: { pay: Settle; onClose: () => void }) {
	const [status, setStatus] = useState<Settlement["status"]>("pending");
	const done = status === "paid";
	const dead = status === "expired";

	// ponytail: polls every 3 s; the browser never talks to core-service
	useEffect(() => {
		if (done || dead) return;
		let live = true;
		const t = setInterval(
			() =>
				getFees()
					.then((f) => {
						const s = f.settlements.find((x) => x.id === pay.id);
						if (live && s) setStatus(s.status);
					})
					.catch(() => {}),
			3000,
		);
		return () => {
			live = false;
			clearInterval(t);
		};
	}, [pay.id, done, dead]);

	useEffect(() => {
		if (done) toast("Payment confirmed. Fees settled.");
	}, [done]);

	if (done)
		return (
			<div className="flex flex-col items-center py-4 text-center">
				<span className="lunas-stamp" aria-hidden="true">
					Lunas
				</span>
				<p className="mt-6 text-lg font-bold">Fees settled</p>
				<p className="mt-1 text-sm text-kertas/65">
					Payment confirmed. Thank you.
				</p>
				<Button variant="primary" className="mt-6" onClick={onClose}>
					Done
				</Button>
			</div>
		);

	const amount = zec(pay.amount_zat);
	const uri = pay.invoice.zip321_uri;
	return (
		<div className="space-y-5">
			<div>
				<p className="text-xs text-kertas/60">Send exactly</p>
				<p className="text-[28px] leading-tight font-bold tracking-[-0.02em] tabular-nums">
					{amount}{" "}
					<span className="text-base font-medium text-kertas/55">ZEC</span>
				</p>
			</div>
			<div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
				<div>
					<p className="mb-1 text-xs text-kertas/60">Shielded address</p>
					<Mono
						value={pay.invoice.address}
						head={14}
						tail={10}
						label="Copy address"
					/>
				</div>
				<div className="border-t border-white/[0.08] pt-3">
					<p className="mb-1 text-xs text-kertas/60">Payment URI (ZIP 321)</p>
					<Mono value={uri} head={24} tail={12} label="Copy payment URI" />
				</div>
				{uri.startsWith("zcash:") && (
					<a href={uri} className={`${button("primary")} w-full`}>
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
				<p
					className="flex items-center gap-2 text-sm text-kertas/65"
					aria-live="polite"
				>
					<Spinner className="size-3.5" />
					<span>
						Waiting for payment ·{" "}
						<Countdown to={pay.invoice.expires_at} prefix="expires in" />
					</span>
				</p>
			)}
		</div>
	);
}

const TONE: Record<Settlement["status"], "success" | "neutral" | "muted"> = {
	paid: "success",
	pending: "neutral",
	expired: "muted",
};

function History({ items }: { items: Settlement[] }) {
	return (
		<Card title="Settlement history" flush>
			{items.length === 0 ? (
				<EmptyState icon="invoice" title="No settlements yet">
					Payments you make for outstanding fees show up here.
				</EmptyState>
			) : (
				<Table
					caption="Settlement history"
					head={
						<>
							<th className={th}>Created</th>
							<th className={`${th} text-right`}>Amount</th>
							<th className={th}>Status</th>
							<th className={th}>Paid</th>
							<th className={th}>Invoice</th>
						</>
					}
				>
					{items.map((s) => (
						<tr key={s.id}>
							<td className={td} data-label="Created">
								<Time s={s.created_at} />
							</td>
							<td
								className={`${td} text-right tabular-nums`}
								data-label="Amount"
								data-end
							>
								{zec(s.amount_zat)} <span className="text-kertas/55">ZEC</span>
							</td>
							<td className={td} data-label="Status">
								<Badge tone={TONE[s.status] ?? "neutral"} dot>
									{s.status[0].toUpperCase() + s.status.slice(1)}
								</Badge>
							</td>
							<td className={td} data-label="Paid">
								<Time s={s.paid_at} />
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
