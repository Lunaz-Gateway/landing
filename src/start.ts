import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// Behind a TLS proxy request.url is http://: PUBLIC_ORIGIN names the public origin
// used when the browser sends no Sec-Fetch-Site header.
const csrf = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
	origin: (value, ctx) =>
		value ===
		(process.env.PUBLIC_ORIGIN?.replace(/\/+$/, "") ||
			new URL(ctx.request.url).origin),
});

export const startInstance = createStart(() => ({ requestMiddleware: [csrf] }));
