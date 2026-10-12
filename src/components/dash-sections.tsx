import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type ApiKey,
	createKey,
	getWebhook,
	type Invoice,
	listInvoices,
	listKeys,
	revokeKey,
	rotateSecret,
	saveWebhook,
	testWebhook,
} from "#/server/dash";
import { btn, btn2, card, ErrorText, errMsg, input } from "./dash-ui";

const th =
	"px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-kertas/60";
const td = "whitespace-nowrap px-3 py-3 align-top";
export const date = (s: number | null) =>
	s ? new Date(s * 1000).toISOString().slice(0, 16).replace("T", " ") : "—";
export const zec = (z: number) =>
	(z / 1e8).toFixed(8).replace(/0+$/, "").replace(/\.$/, ".0");

// Load once, expose reload; errors shown by the caller
export function useLoad<T>(fn: () => Promise<T>) {
	const [data, setData] = useState<T>();
	const [error, setError] = useState("");
	// biome-ignore lint/correctness/useExhaustiveDependencies: fn is a stable server function
	const reload = useCallback(
		() => fn().then(setData, (e) => setError(errMsg(e))),
		[],
	);
	useEffect(() => {
		reload();
	}, [reload]);
	return { data, error, reload };
}

function copy(text: string) {
	return navigator.clipboard?.writeText(text);
}

export function CopyButton({
	text,
	label = "Copy",
}: {
	text: string;
	label?: string;
}) {
	const [done, setDone] = useState(false);
	return (
		<button
			type="button"
			className={btn2}
			onClick={async () => {
				await copy(text);
				setDone(true);
				setTimeout(() => setDone(false), 1500);
			}}
		>
			<span aria-live="polite">{done ? "Copied" : label}</span>
		</button>
	);
}

export type NewKey = { name: string; key: string };

export function CreateKeyForm({
	onCreated,
	error = "",
}: {
	onCreated: (k: NewKey) => void;
	error?: string;
}) {
	const [name, setName] = useState("");
	const [err, setErr] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<form
			className="flex flex-wrap items-end gap-3"
			onSubmit={async (e) => {
				e.preventDefault();
				setErr("");
				setBusy(true);
				try {
					const k = await createKey({ data: { name } });
					setName("");
					onCreated({ name: k.name, key: k.key });
				} catch (x) {
					setErr(errMsg(x));
				}
				setBusy(false);
			}}
		>
			<div className="min-w-48 flex-1">
				<label htmlFor="key-name" className="mb-1.5 block text-sm font-medium">
					Key name
				</label>
				<input
					id="key-name"
					className={input}
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. production"
					required
				/>
			</div>
			<button type="submit" className={btn} disabled={busy}>
				{busy ? "Creating…" : "Create key"}
			</button>
			<div className="w-full">
				<ErrorText error={err || error} />
			</div>
		</form>
	);
}

export function NewKeyPanel({
	created,
	onDone,
}: {
	created: NewKey;
	onDone: () => void;
}) {
	const ref = useRef<HTMLElement>(null);
	useEffect(() => ref.current?.focus(), []);
	return (
		<section
			ref={ref}
			tabIndex={-1}
			aria-labelledby="newkey-h"
			className="rounded-xl border border-lunas/60 bg-malam p-5"
		>
			<h3 id="newkey-h" className="mb-1 font-bold">
				Key "{created.name}" created
			</h3>
			<p className="mb-3 text-sm text-kertas/80">
				Copy it now. You won't see it again.
			</p>
			<code className="mb-3 block break-all rounded-lg bg-malam-2 p-3 font-mono text-sm text-lunas">
				{created.key}
			</code>
			<div className="flex gap-2">
				<CopyButton text={created.key} label="Copy key" />
				<button type="button" className={btn2} onClick={onDone}>
					I've saved it
				</button>
			</div>
		</section>
	);
}

export function ApiKeys() {
	const { data, error, reload } = useLoad(() => listKeys());
	const [err, setErr] = useState("");
	const [created, setCreated] = useState<NewKey | null>(null);
	const [confirm, setConfirm] = useState<string | null>(null);
	return (
		<div className="space-y-6">
			<section className={card} aria-labelledby="create-h">
				<h2 id="create-h" className="mb-3 font-bold">
					Create an API key
				</h2>
				<CreateKeyForm
					error={err || error}
					onCreated={(k) => {
						setCreated(k);
						reload();
					}}
				/>
			</section>

			{created && (
				<NewKeyPanel created={created} onDone={() => setCreated(null)} />
			)}

			<div className="overflow-x-auto rounded-xl border border-white/10 bg-malam-2/60">
				<table className="w-full text-sm">
					<caption className="sr-only">API keys</caption>
					<thead className="border-b border-white/10">
						<tr>
							<th className={th}>Name</th>
							<th className={th}>Key</th>
							<th className={th}>Created</th>
							<th className={th}>Last used</th>
							<th className={th}>Status</th>
							<th className={th}>
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-white/10">
						{data?.map((k: ApiKey) => (
							<tr key={k.id}>
								<td className={td}>{k.name}</td>
								<td className={`${td} font-mono`}>{k.prefix}…</td>
								<td className={td}>{date(k.created_at)}</td>
								<td className={td}>{date(k.last_used_at)}</td>
								<td className={td}>{k.revoked_at ? "Revoked" : "Active"}</td>
								<td className={`${td} text-right`}>
									{!k.revoked_at &&
										(confirm === k.id ? (
											<span className="inline-flex gap-2">
												<button
													type="button"
													className={btn2}
													onClick={async () => {
														try {
															await revokeKey({ data: { id: k.id } });
															setConfirm(null);
															reload();
														} catch (x) {
															setErr(errMsg(x));
														}
													}}
												>
													Confirm revoke
												</button>
												<button
													type="button"
													className={btn2}
													onClick={() => setConfirm(null)}
												>
													Cancel
												</button>
											</span>
										) : (
											<button
												type="button"
												className={btn2}
												aria-label={`Revoke ${k.name}`}
												onClick={() => setConfirm(k.id)}
											>
												Revoke
											</button>
										))}
								</td>
							</tr>
						))}
						{data?.length === 0 && (
							<tr>
								<td className={`${td} text-kertas/60`} colSpan={6}>
									No keys yet. Create one above.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

const SNIPPET = `import { createHmac, timingSafeEqual } from "node:crypto";

// rawBody: the request body as received, before JSON parsing
function verify(rawBody, signature, secret) {
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(hex);
  const b = Buffer.from(signature ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

// verify(raw, req.headers["x-lunaz-signature"], process.env.LUNAZ_WEBHOOK_SECRET)`;

export function Webhooks() {
	const { data, error, reload } = useLoad(() => getWebhook());
	const [url, setUrl] = useState<string | null>(null);
	const [secret, setSecret] = useState<string | null>(null);
	const [show, setShow] = useState(false);
	const [msg, setMsg] = useState("");
	const [err, setErr] = useState("");
	const [rot, setRot] = useState(false);
	const shown = secret ?? data?.secret ?? "";
	const run = async (fn: () => Promise<string>) => {
		setErr("");
		setMsg("");
		try {
			setMsg(await fn());
		} catch (x) {
			setErr(errMsg(x));
		}
	};
	return (
		<div className="space-y-6">
			<form
				className={`${card} space-y-3`}
				onSubmit={(e) => {
					e.preventDefault();
					run(async () => {
						await saveWebhook({ data: { url: url ?? data?.url ?? "" } });
						reload();
						return "Webhook URL saved.";
					});
				}}
			>
				<label htmlFor="wh-url" className="block text-sm font-medium">
					Webhook URL
				</label>
				<div className="flex flex-wrap gap-3">
					<input
						id="wh-url"
						type="url"
						className={`${input} min-w-64 flex-1`}
						value={url ?? data?.url ?? ""}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://example.com/lunaz-webhook"
					/>
					<button type="submit" className={btn}>
						Save
					</button>
					<button
						type="button"
						className={btn2}
						onClick={() =>
							run(
								async () =>
									`Test delivered, your endpoint answered ${(await testWebhook()).status}.`,
							)
						}
					>
						Send test
					</button>
				</div>
				<output className="block text-sm text-kertas/80 empty:hidden">
					{msg}
				</output>
				<ErrorText error={err || error} />
			</form>

			<section className={`${card} space-y-3`}>
				<h2 className="font-bold">Signing secret</h2>
				<code className="block break-all rounded-lg bg-malam p-3 font-mono text-sm">
					{show ? shown : "•".repeat(32)}
				</code>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						className={btn2}
						onClick={() => setShow(!show)}
						aria-pressed={show}
					>
						{show ? "Hide" : "Reveal"}
					</button>
					<CopyButton text={shown} />
					{rot ? (
						<>
							<button
								type="button"
								className={btn2}
								onClick={() =>
									run(async () => {
										setSecret((await rotateSecret()).secret);
										setRot(false);
										setShow(true);
										return "Secret rotated. Update your server now.";
									})
								}
							>
								Confirm rotate
							</button>
							<button
								type="button"
								className={btn2}
								onClick={() => setRot(false)}
							>
								Cancel
							</button>
						</>
					) : (
						<button type="button" className={btn2} onClick={() => setRot(true)}>
							Rotate
						</button>
					)}
				</div>
				{rot && (
					<p className="text-sm text-kertas/70">
						The old secret stops working immediately.
					</p>
				)}
			</section>

			<section>
				<h2 className="mb-2 font-bold">Verify the signature</h2>
				<p className="mb-3 text-sm text-kertas/70">
					Each request carries X-Lunaz-Signature, the HMAC-SHA256 hex of the raw
					body. The JSON body has a type field, such as invoice.paid.
				</p>
				<pre className="overflow-x-auto rounded-xl border border-white/10 bg-malam-2 p-4 font-mono text-xs leading-relaxed">
					{SNIPPET}
				</pre>
			</section>
		</div>
	);
}

const pill: Record<Invoice["status"], string> = {
	pending: "border-white/30 text-kertas/80",
	detected: "border-white/50 text-kertas",
	paid: "border-lunas text-lunas",
	expired: "border-white/15 text-kertas/50",
};

export const curlFor = (
	prefix = "lz_...",
) => `curl -X POST $LUNAZ/v1/invoices \\
  -H "Authorization: Bearer ${prefix}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount_zat":10000}'`;

export function Invoices() {
	const { data, error } = useLoad(() => listInvoices());
	return (
		<div>
			<ErrorText error={error} />
			{data?.length === 0 ? (
				<section className={`${card} space-y-3`}>
					<h2 className="font-bold">No invoices yet</h2>
					<p className="text-sm text-kertas/80">
						Create an{" "}
						<Link to="/dashboard/keys" className="font-bold underline">
							API key
						</Link>{" "}
						and make your first invoice:
					</p>
					<pre className="overflow-x-auto rounded-lg bg-malam p-3 font-mono text-xs">
						{curlFor()}
					</pre>
				</section>
			) : (
				<div className="overflow-x-auto rounded-xl border border-white/10 bg-malam-2/60">
					<table className="w-full text-sm">
						<caption className="sr-only">Invoices</caption>
						<thead className="border-b border-white/10">
							<tr>
								<th className={th}>Created</th>
								<th className={th}>Amount (ZEC)</th>
								<th className={th}>Status</th>
								<th className={th}>Received</th>
								<th className={th}>Txid</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/10">
							{data?.map((i) => (
								<tr key={i.id}>
									<td className={td}>{date(i.created_at)}</td>
									<td className={`${td} font-mono`}>{zec(i.amount_zat)}</td>
									<td className={td}>
										<span
											className={`rounded-full border px-2.5 py-0.5 text-xs ${pill[i.status]}`}
										>
											{i.status}
										</span>
									</td>
									<td className={`${td} font-mono`}>{zec(i.received_zat)}</td>
									<td className={`${td} font-mono`} title={i.txid ?? undefined}>
										{i.txid ? `${i.txid.slice(0, 8)}…${i.txid.slice(-6)}` : "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
