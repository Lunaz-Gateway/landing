import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

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
			{ title: "Lunaz — Pay with anything. Settled in private." },
			{
				name: "description",
				content:
					"Lunaz is a private, non-custodial payment gateway for shielded Zcash. Accept ZEC, or pay from other chains through NEAR Intents, without exposing your revenue or customers.",
			},
			{ name: "theme-color", content: "#1C1F3D" },
			{ property: "og:type", content: "website" },
			{
				property: "og:title",
				content: "Lunaz — Pay with anything. Settled in private.",
			},
			{
				property: "og:description",
				content:
					"Lunaz is a private, non-custodial payment gateway for shielded Zcash. Accept ZEC, or pay from other chains through NEAR Intents, without exposing your revenue or customers.",
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
				href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
