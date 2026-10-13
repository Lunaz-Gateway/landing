import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import { TestnetBanner } from "#/components/TestnetBanner";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{ title: "Lunaz — Private payment gateway for shielded Zcash" },
			{
				name: "description",
				content:
					"Lunaz is a non-custodial payment gateway for shielded Zcash. A fresh shielded address per invoice, payments from other chains through NEAR Intents, signed webhooks, and every merchant or marketplace seller paid straight to its own wallet.",
			},
			{ name: "theme-color", content: "#1C1F3D" },
			{ property: "og:type", content: "website" },
			{
				property: "og:title",
				content: "Lunaz — Private payment gateway for shielded Zcash",
			},
			{
				property: "og:description",
				content:
					"Lunaz is a non-custodial payment gateway for shielded Zcash. A fresh shielded address per invoice, payments from other chains through NEAR Intents, signed webhooks, and every merchant or marketplace seller paid straight to its own wallet.",
			},
			{ property: "og:image", content: "/icon-512.png" },
			{ name: "twitter:card", content: "summary" },
		],
		links: [
			{ rel: "icon", href: "/favicon.ico", sizes: "48x48" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "manifest", href: "/site.webmanifest" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
});

function NotFound() {
	return (
		<main className="grid min-h-dvh place-items-center bg-malam px-5 text-center">
			<div>
				<a href="/" aria-label="Lunaz home" className="inline-block">
					<img
						src="/lunaz-symbol-on-dark.svg"
						alt=""
						width={40}
						height={40}
						className="mx-auto size-10"
					/>
				</a>
				<p className="mt-6 font-mono text-sm text-kertas/55">404</p>
				<h1 className="mt-1 text-2xl font-bold tracking-[-0.02em]">
					Page not found
				</h1>
				<p className="mt-2 text-sm text-kertas/65">
					The page you're looking for doesn't exist or has moved.
				</p>
				<div className="mt-6 flex justify-center gap-2">
					<a
						href="/"
						className="press inline-flex h-9 items-center rounded-lg bg-lunas px-3.5 text-sm font-bold text-malam"
					>
						Go home
					</a>
					<a
						href="/dashboard"
						className="press inline-flex h-9 items-center rounded-lg border border-white/15 px-3.5 text-sm font-medium hover:bg-white/[0.06]"
					>
						Dashboard
					</a>
				</div>
			</div>
		</main>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<TestnetBanner name="Lunaz" />
				{children}
				<Scripts />
			</body>
		</html>
	);
}
