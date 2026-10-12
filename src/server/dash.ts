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
	status: "pending" | "detected" | "paid" | "expired";
	amount_zat: number;
	received_zat: number;
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

// Authenticated call; an expired session clears the cookie
async function authed(path: string, method = "GET", body?: unknown) {
	const token = getCookie(COOKIE);
	if (!token) throw new ApiError("Not signed in", 401);
	try {
		return await call(path, method, body, token);
	} catch (e) {
		if (e instanceof ApiError && e.status === 401)
			deleteCookie(COOKIE, { path: "/" });
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

// Returns null when signed out; other failures bubble up
export const getAccount = createServerFn({ method: "GET" }).handler(
	async (): Promise<Account | null> => {
		if (!getCookie(COOKIE)) return null;
		try {
			return (await authed("/v1/account")) as Account;
		} catch (e) {
			if (e instanceof ApiError && e.status === 401) return null;
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
	async () => (await authed("/v1/account/invoices?limit=50")) as Invoice[],
);
