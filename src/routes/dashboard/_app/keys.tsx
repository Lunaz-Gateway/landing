import { createFileRoute } from "@tanstack/react-router";
import { ApiKeys } from "#/components/dash-sections";

export const Route = createFileRoute("/dashboard/_app/keys")({
	head: () => ({ meta: [{ title: "API keys — Lunaz" }] }),
	component: ApiKeys,
});
