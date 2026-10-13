import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";

const COOKIE = "lunaz_session";
const base = () => process.env.LUNAZ_API_URL ?? "http://127.0.0.1:8097";

export type Account = {
	id: string;
	email: string;
	name: string;
	network: "main" | "test";
	ufvk_set: boolean;
	webhook_url: string | null;
	plan?: PlanId;
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
	const data = text ? JSON.parse(text) : null;
	if (!res.ok) {
		throw new ApiError(
			data?.error ?? `Request failed (${res.status})`,
			res.status,
		);
	}
	return data;
}

const expired = (stale = true) => {
	deleteCookie(COOKIE, { path: "/" });
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

function startSession(token: string) {
	setCookie(COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60 * 24 * 7,
	});
}

const str = (v: unknown) => String(v ?? "");
type In = Record<string, unknown>;
const input = (d: unknown) => (d ?? {}) as In;

const NOT_CONFIGURED = "Sign-in is not configured. Contact support.";

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
		if (!didToken) throw new ApiError("Sign-in failed. Try again.", 400);
		const { Magic } = await import("@magic-sdk/admin");
		const magic = await Magic.init(secret);
		let email: string | null | undefined;
		try {
			magic.token.validate(didToken);
			email = (await magic.users.getMetadataByToken(didToken)).email;
		} catch (e) {
			console.error("signInWithMagic: magic verification failed", e);
			throw new ApiError("Sign-in failed. Try again.", 401);
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
	deleteCookie(COOKIE, { path: "/" });
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
			return (await call("/v1/account", "GET", undefined, token)) as Account;
		} catch (e) {
			if (e instanceof ApiError && e.status === 401) {
				deleteCookie(COOKIE, { path: "/" });
				return null;
			}
			throw e;
		}
	},
);

export const setUfvk = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		await authed("/v1/account/ufvk", "PUT", { ufvk: str(data.ufvk).trim() });
		return { ok: true };
	});

export const listKeys = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/api-keys")) as ApiKey[],
);

export type LimitHit = {
	error: string;
	limit: number;
	used: number;
	plan: string;
};
type NewKeyRes = { id: string; name: string; prefix: string; key: string };

// A plan limit (402) comes back as data so the form can offer an upgrade
export const createKey = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }): Promise<NewKeyRes | { limit: LimitHit }> => {
		const token = getCookie(COOKIE);
		if (!token) throw expired(false);
		const res = await fetch(`${base()}/v1/account/api-keys`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ name: str(data.name) }),
		}).catch(() => {
			throw new ApiError("Cannot reach the Lunaz API. Try again shortly.", 502);
		});
		const body = await res.json().catch(() => null);
		if (res.status === 402) return { limit: body as LimitHit };
		if (res.status === 401) throw expired();
		if (!res.ok)
			throw new ApiError(
				body?.error ?? `Request failed (${res.status})`,
				res.status,
			);
		return body as NewKeyRes;
	});

export const revokeKey = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		await authed(
			`/v1/account/api-keys/${encodeURIComponent(str(data.id))}`,
			"DELETE",
		);
		return { ok: true };
	});

export const getWebhook = createServerFn({ method: "GET" }).handler(
	async () =>
		(await authed("/v1/account/webhook")) as {
			url: string | null;
			secret: string;
		},
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

export type Delivery = {
	id: string;
	invoice_id: string | null;
	type: string;
	url: string;
	status_code: number | null;
	error: string | null;
	attempt: number;
	created_at: number;
};

export const listDeliveries = createServerFn({ method: "GET" }).handler(
	async () =>
		(await authed("/v1/account/webhook/deliveries?limit=50")) as Delivery[],
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
				msg = JSON.parse(text).error ?? msg;
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

/* ---------- Plans and billing ---------- */

export type PlanId = "free" | "pro" | "platform" | "enterprise";
export type Plan = {
	id: PlanId;
	name: string;
	price_usd: number | null;
	invoices_per_month: number | null;
	api_keys: number | null;
};
export type AccountPlan = {
	plan: PlanId;
	plan_name: string;
	expires_at: number | null;
	limits: { invoices_per_month: number | null; api_keys: number | null };
	usage: { invoices_this_month: number; api_keys_active: number };
	period_start_of_month: number;
	sandbox_billing: boolean;
	billing_configured: boolean;
};
export type Checkout = {
	subscription_id: string;
	plan: PlanId;
	months: number;
	price_usd: number;
	amount_zat: number;
	zec_usd: number;
	invoice: {
		id: string;
		address: string;
		zip321_uri: string;
		expires_at: number;
		status: Invoice["status"];
	};
};
export type Subscription = {
	id: string;
	plan: PlanId;
	months: number;
	price_usd: number;
	amount_zat: number;
	zec_usd: number;
	invoice_id: string;
	status: "pending" | "paid" | "expired" | "cancelled";
	created_at: number;
	paid_at: number | null;
	period_start: number | null;
	period_end: number | null;
	invoice_status: Invoice["status"] | null;
};

export const listPlans = createServerFn({ method: "GET" }).handler(
	async () => (await call("/v1/plans")) as Plan[],
);

export const getPlan = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/plan")) as AccountPlan,
);

export const listBilling = createServerFn({ method: "GET" }).handler(
	async () => (await authed("/v1/account/billing")) as Subscription[],
);

export const checkout = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const plan = str(data.plan);
		const months = Number(data.months);
		if (!["pro", "platform"].includes(plan) || ![1, 3, 12].includes(months))
			throw new ApiError("Choose a plan and period", 400);
		return (await authed("/v1/account/billing/checkout", "POST", {
			plan,
			months,
		})) as Checkout;
	});

export const simulatePaid = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		await authed(
			`/v1/account/billing/${encodeURIComponent(str(data.id))}/simulate-paid`,
			"POST",
		);
		return { ok: true };
	});
