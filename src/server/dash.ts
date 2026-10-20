import { createHash } from "node:crypto";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";

// __Host- needs Secure + Path=/ + no Domain, so it is production (TLS) only.
// Sessions under the old name are not read: users sign in again once.
const PROD = process.env.NODE_ENV === "production";
const COOKIE = PROD ? "__Host-lunaz_session" : "lunaz_session";
// Keep equal to the core-service session lifetime
const SESSION_SECS = 60 * 60 * 24 * 7;
const base = () => process.env.LUNAZ_API_URL ?? "http://127.0.0.1:8097";

export type Account = {
	id: string;
	email: string;
	name: string;
	network: "main" | "test";
	viewing_key_set: boolean;
	ufvk_set?: boolean;
	webhook_url: string | null;
};
export type ApiKey = {
	id: string;
	name: string;
	prefix: string;
	created_at: number;
	last_used_at: number | null;
	revoked_at: number | null;
};
export type Invoice = {
	id: string;
	status: "pending" | "detected" | "paid" | "underpaid" | "expired";
	amount_zat: number;
	received_zat: number;
	overpaid_zat: number;
	address: string;
	txid: string | null;
	created_at: number;
	expires_at: number;
	paid_at: number | null;
	fee_zat?: number;
};

class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

async function call(
	path: string,
	method = "GET",
	body?: unknown,
	token?: string,
): Promise<unknown> {
	let res: Response;
	try {
		res = await fetch(base() + path, {
			method,
			headers: {
				...(body !== undefined && { "content-type": "application/json" }),
				...(token && { authorization: `Bearer ${token}` }),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		});
	} catch {
		throw new ApiError("Cannot reach the Lunaz API. Try again shortly.", 502);
	}
	const text = await res.text();
	let data: { error?: unknown } | null = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		throw new ApiError("Unexpected response from the Lunaz API.", 502);
	}
	if (!res.ok) {
		const msg = typeof data?.error === "string" ? data.error : "";
		throw new ApiError(msg || `Request failed (${res.status})`, res.status);
	}
	return data;
}

const expired = (stale = true) => {
	clearSession();
	return redirect({
		to: "/dashboard/login",
		search: { expired: stale || undefined },
	});
};

// Authenticated call; an expired session clears the cookie and sends the user to sign in
async function authed(path: string, method = "GET", body?: unknown) {
	const token = getCookie(COOKIE);
	if (!token) throw expired(false);
	try {
		return await call(path, method, body, token);
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) throw expired();
		throw e;
	}
}

// Deleting needs the same attributes as setting (__Host- rejects a delete without Secure)
const cookieOpts = {
	httpOnly: true,
	sameSite: "lax",
	secure: PROD,
	path: "/",
} as const;

function clearSession() {
	deleteCookie(COOKIE, cookieOpts);
}

function startSession(token: string) {
	setCookie(COOKIE, token, { ...cookieOpts, maxAge: SESSION_SECS });
}

const str = (v: unknown) => String(v ?? "");
type In = Record<string, unknown>;
const input = (d: unknown) => (d ?? {}) as In;

const NOT_CONFIGURED = "Sign-in is not configured. Contact support.";
const SIGN_IN_FAILED = "Sign-in failed. Try again.";

type MagicAdmin = Awaited<
	ReturnType<typeof import("@magic-sdk/admin")["Magic"]["init"]>
>;
let magicAdmin: MagicAdmin | undefined;
async function getMagicAdmin(secret: string) {
	if (!magicAdmin) {
		const { Magic } = await import("@magic-sdk/admin");
		const m = await Magic.init(secret);
		if (!m.clientId) throw new ApiError(NOT_CONFIGURED, 503);
		magicAdmin = m;
	}
	return magicAdmin;
}

// Replay guard: a DID token is single-use for 20 minutes after a successful exchange
// ponytail: in-memory, per process; use a shared store (Redis) when running several replicas
const REPLAY_MS = 20 * 60 * 1000;
const used = new Map<string, number>();
const fingerprint = (t: string) => createHash("sha256").update(t).digest("hex");
const seen = (h: string) => {
	const now = Date.now();
	for (const [k, exp] of used) if (exp <= now) used.delete(k);
	return used.has(h);
};

// Magic only proves the email; the Lunaz session comes from core-service
export const signInWithMagic = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const didToken = str(data.didToken);
		const secret = process.env.MAGIC_SECRET_KEY;
		const internal = process.env.LUNAZ_INTERNAL_TOKEN;
		if (!secret || !internal) {
			console.error(
				"signInWithMagic: MAGIC_SECRET_KEY or LUNAZ_INTERNAL_TOKEN unset",
			);
			throw new ApiError(NOT_CONFIGURED, 503);
		}
		if (!didToken) throw new ApiError(SIGN_IN_FAILED, 400);
		const hash = fingerprint(didToken);
		if (seen(hash)) throw new ApiError(SIGN_IN_FAILED, 401);
		let magic: MagicAdmin;
		try {
			magic = await getMagicAdmin(secret);
		} catch (e) {
			console.error("signInWithMagic: magic init failed", e);
			throw e instanceof ApiError ? e : new ApiError(SIGN_IN_FAILED, 502);
		}
		let email: string | null | undefined;
		try {
			magic.token.validate(didToken);
			email = (await magic.users.getMetadataByToken(didToken)).email;
		} catch (e) {
			console.error("signInWithMagic: magic verification failed", e);
			throw new ApiError(SIGN_IN_FAILED, 401);
		}
		if (!email) throw new ApiError("No email found for this sign-in.", 400);
		let r: { token: string; new_account: boolean; merchant_id: string };
		try {
			r = (await call(
				"/v1/auth/exchange",
				"POST",
				{ email },
				internal,
			)) as typeof r;
		} catch (e) {
			if (e instanceof ApiError) {
				console.error("signInWithMagic: exchange failed", e.status, e.message);
				if (e.status === 401 || e.status === 503)
					throw new ApiError(NOT_CONFIGURED, 503);
				if (e.status === 429)
					throw new ApiError(
						"Too many attempts. Wait a minute and try again.",
						429,
					);
			}
			throw e;
		}
		used.set(hash, Date.now() + REPLAY_MS);
		startSession(r.token);
		await magic.users.logoutByToken(didToken).catch(() => {});
		return { ok: true, new_account: r.new_account };
	});

export const setName = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const name = str(data.name).trim();
		if (!name || name.length > 80)
			throw new ApiError("Enter a name up to 80 characters", 400);
		await authed("/v1/account", "PUT", { name });
		return { ok: true };
	});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
	const token = getCookie(COOKIE);
	clearSession();
	if (token)
		await call("/v1/auth/logout", "POST", undefined, token).catch(() => {});
	return { ok: true };
});

// Null when signed out or the session is stale (never redirects, so auth pages can call it)
export const getAccount = createServerFn({ method: "GET" }).handler(
	async (): Promise<Account | null> => {
		const token = getCookie(COOKIE);
		if (!token) return null;
		try {
			const a = (await call("/v1/account", "GET", undefined, token)) as Account;
			return { ...a, viewing_key_set: a.viewing_key_set ?? !!a.ufvk_set };
		} catch (e) {
			if (e instanceof ApiError && e.status === 401) {
				clearSession();
				return null;
			}
			throw e;
		}
	},
);

export const setViewingKey = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const key = str(data.viewing_key).trim();
		try {
			await authed("/v1/account/viewing-key", "PUT", { viewing_key: key });
		} catch (e) {
			// Older backend without the new endpoint
			if (!(e instanceof ApiError && e.status === 404)) throw e;
			await authed("/v1/account/ufvk", "PUT", { ufvk: key });
		}
		return { ok: true };
	});

export const listKeys = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/api-keys")) as ApiKey[],
);

export const createKey = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(
		async ({ data }) =>
			(await authed("/v1/account/api-keys", "POST", {
				name: str(data.name),
			})) as { id: string; name: string; prefix: string; key: string },
	);

export const revokeKey = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		await authed(
			`/v1/account/api-keys/${encodeURIComponent(str(data.id))}`,
			"DELETE",
		);
		return { ok: true };
	});

// The secret never rides along with page loads: it is fetched on demand
export const getWebhookUrl = createServerFn({ method: "GET" }).handler(
	async () => {
		const w = (await authed("/v1/account/webhook")) as { url: string | null };
		return { url: w.url ?? null };
	},
);

export const revealWebhookSecret = createServerFn({ method: "POST" }).handler(
	async () => ({
		secret: ((await authed("/v1/account/webhook")) as { secret: string })
			.secret,
	}),
);

export const saveWebhook = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const url = str(data.url).trim();
		await authed("/v1/account/webhook", "PUT", { url: url || null });
		return { ok: true };
	});

export const rotateSecret = createServerFn({ method: "POST" }).handler(
	async () =>
		(await authed("/v1/account/webhook/rotate", "POST")) as { secret: string },
);

export const testWebhook = createServerFn({ method: "POST" }).handler(
	async () =>
		(await authed("/v1/account/webhook/test", "POST")) as { status: number },
);

export const listInvoices = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/invoices?limit=200")) as Invoice[],
);

export type InvoiceDetail = {
	zip321_uri: string | null;
	swap: {
		status: string;
		symbol: string;
		blockchain: string;
		deposit_address: string;
		amount_in_formatted: string;
		deadline: string;
	} | null;
};

// Swap and payment-URI details for one of the merchant's invoices
export const getInvoice = createServerFn({ method: "GET" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const id = str(data.id);
		const mine = (await authed("/v1/account/invoices?limit=200")) as Invoice[];
		if (!mine.some((i) => i.id === id))
			throw new ApiError("Invoice not found", 404);
		const d = (await call(
			`/v1/invoices/${encodeURIComponent(id)}`,
		)) as InvoiceDetail;
		return { zip321_uri: d.zip321_uri, swap: d.swap };
	});

export type WebhookEvent = {
	id: string;
	type: string;
	invoice_id: string | null;
	status: "pending" | "delivered" | "failed";
	attempts: number;
	max_attempts: number;
	next_attempt_at: number | null;
	last_status_code: number | null;
	last_error: string | null;
	created_at: number;
	updated_at: number;
	deliveries: {
		attempt: number;
		status_code: number | null;
		error: string | null;
		created_at: number;
	}[];
};

export const listWebhookEvents = createServerFn({ method: "GET" }).handler(
	async () =>
		(await authed("/v1/account/webhook/events?limit=50")) as WebhookEvent[],
);

export const retryWebhookEvent = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(
		async ({ data }) =>
			(await authed(
				`/v1/account/webhook/events/${encodeURIComponent(str(data.id))}/retry`,
				"POST",
			)) as WebhookEvent,
	);

export const retryFailedWebhookEvents = createServerFn({
	method: "POST",
}).handler(
	async () =>
		(await authed("/v1/account/webhook/events/retry-failed", "POST")) as {
			retried: number;
		},
);

// CSV text and suggested filename; the file is built from the viewing key and never public
export const exportCsv = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const token = getCookie(COOKIE);
		if (!token) throw expired(false);
		const q = new URLSearchParams({ kind: str(data.kind) });
		for (const k of ["from", "to"] as const)
			if (Number.isFinite(Number(data[k])) && data[k] !== "")
				q.set(k, String(Math.trunc(Number(data[k]))));
		let res: Response;
		try {
			res = await fetch(`${base()}/v1/account/export.csv?${q}`, {
				headers: { authorization: `Bearer ${token}` },
			});
		} catch {
			throw new ApiError("Cannot reach the Lunaz API. Try again shortly.", 502);
		}
		const text = await res.text();
		if (!res.ok) {
			if (res.status === 401) throw expired();
			let msg = `Export failed (${res.status})`;
			try {
				const e = JSON.parse(text).error;
				if (typeof e === "string") msg = e;
			} catch {}
			throw new ApiError(msg, res.status);
		}
		const m = /filename="([^"]+)"/.exec(
			res.headers.get("content-disposition") ?? "",
		);
		return { csv: text, filename: m?.[1] ?? "lunaz-export.csv" };
	});

/* ---------- Off-ramp (withdraw to bank) ---------- */

export type Offramp = {
	provider: "mock" | "transfi";
	sandbox: boolean;
	currencies: string[];
	min_zat: number;
	received_zat: number;
	zec_usd: number | null;
};
export type Quote = {
	amount_zat: number;
	currency: string;
	rate: string;
	fee_fiat: string;
	network_fee_zat: number;
	fiat_amount: string;
	expires_at: number;
};
export type WithdrawalStatus =
	| "awaiting_kyc"
	| "awaiting_deposit"
	| "deposit_received"
	| "converting"
	| "payout_processing"
	| "completed"
	| "expired"
	| "failed"
	| "cancelled";
export type Withdrawal = {
	id: string;
	provider: string;
	status: WithdrawalStatus;
	amount_zat: number;
	fiat_currency: string;
	fiat_amount: string;
	rate: string;
	fee_fiat: string;
	network_fee_zat: number;
	deposit_address: string;
	deposit_uri: string;
	bank_label: string | null;
	provider_ref: string | null;
	created_at: number;
	updated_at: number;
	expires_at: number;
	events: {
		status: WithdrawalStatus;
		note: string;
		created_at: number;
	}[];
};

const amountIn = (data: In) => {
	const amount_zat = Number(data.amount_zat);
	if (!Number.isSafeInteger(amount_zat) || amount_zat <= 0)
		throw new ApiError("Enter a valid amount", 400);
	return { amount_zat, currency: str(data.currency).toUpperCase() };
};
const wd = (data: In, action = "") =>
	`/v1/account/withdrawals/${encodeURIComponent(str(data.id))}${action}`;

export const getOfframp = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/offramp")) as Offramp,
);

export const listWithdrawals = createServerFn({ method: "GET" }).handler(
	async () =>
		(await authed("/v1/account/withdrawals?limit=50")) as Withdrawal[],
);

export const getWithdrawal = createServerFn({ method: "GET" })
	.inputValidator(input)
	.handler(async ({ data }) => (await authed(wd(data))) as Withdrawal);

export const quoteWithdrawal = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(
		async ({ data }) =>
			(await authed(
				"/v1/account/withdrawals/quote",
				"POST",
				amountIn(data),
			)) as Quote,
	);

export const createWithdrawal = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(
		async ({ data }) =>
			(await authed(
				"/v1/account/withdrawals",
				"POST",
				amountIn(data),
			)) as Withdrawal,
	);

// Only the bank name and last 4 digits ever leave the browser
export const submitKyc = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const account_last4 = str(data.account_last4);
		if (!/^\d{4}$/.test(account_last4))
			throw new ApiError("Enter a valid account number", 400);
		return (await authed(wd(data, "/kyc"), "POST", {
			bank_name: str(data.bank_name),
			account_last4,
		})) as Withdrawal;
	});

export const simulateDeposit = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(
		async ({ data }) =>
			(await authed(wd(data, "/simulate-deposit"), "POST")) as Withdrawal,
	);

export const cancelWithdrawal = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(
		async ({ data }) =>
			(await authed(wd(data, "/cancel"), "POST")) as Withdrawal,
	);

/* ---------- Fees ---------- */

export type Settlement = {
	id: string;
	invoice_id: string;
	amount_zat: number;
	status: "pending" | "paid" | "expired";
	created_at: number;
	paid_at: number | null;
};
export type Fees = {
	fee_bps: number;
	fee_min_zat: number;
	charged_zat: number;
	paid_in_tx_zat: number;
	settled_zat: number;
	outstanding_zat: number;
	settlements: Settlement[];
};
export type Settle = {
	id: string;
	amount_zat: number;
	invoice: {
		id: string;
		address: string;
		amount_zat: number;
		zip321_uri: string;
		expires_at: number;
	};
};

export const getFees = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/fees")) as Fees,
);

export const settleFees = createServerFn({ method: "POST" }).handler(
	async () => (await authed("/v1/account/fees/settle", "POST")) as Settle,
);

/* ---------- Limits ---------- */

export type Limit = {
	id:
		| "invoices_day"
		| "xc_invoice"
		| "xc_day"
		| "xc_first"
		| "xc_month"
		| "zec_day";
	rail: "cross_chain" | "zec" | "invoices";
	window: "invoice" | "24h" | "30d" | "first_days";
	/** USD, or a count for invoices */
	cap: number;
	/** null for per-payment caps, or when the ZEC price is unavailable */
	used: number | null;
	ends_at: number | null;
};
export type Limits = {
	tier: "new" | "established" | "verified";
	limits: Limit[];
	first_days: number;
	next: {
		tier: "established";
		age_days_left: number;
		paid_invoices_left: number;
		fee_outstanding: boolean;
	} | null;
};

export const getLimits = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/limits")) as Limits,
);
