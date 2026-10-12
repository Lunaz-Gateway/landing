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

export const signup = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const r = (await call("/v1/auth/signup", "POST", {
			email: str(data.email),
			name: str(data.name),
			password: str(data.password),
		})) as { token: string };
		startSession(r.token);
		return { ok: true };
	});

export const login = createServerFn({ method: "POST" })
	.inputValidator(input)
	.handler(async ({ data }) => {
		const r = (await call("/v1/auth/login", "POST", {
			email: str(data.email),
			password: str(data.password),
		})) as { token: string };
		startSession(r.token);
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
