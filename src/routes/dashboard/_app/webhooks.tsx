import { createFileRoute } from "@tanstack/react-router";
import { Webhooks } from "#/components/dash-sections";

export const Route = createFileRoute("/dashboard/_app/webhooks")({
	head: () => ({ meta: [{ title: "Webhooks — Lunaz" }] }),
	component: Webhooks,
});
