import { createFileRoute, redirect } from "@tanstack/react-router";

// Kept so old links still work
export const Route = createFileRoute("/dashboard/signup")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/login" });
	},
});
