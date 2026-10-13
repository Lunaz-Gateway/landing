// Browser-only Magic client, loaded lazily so it never runs during SSR or bloats other routes.
type MagicClient = import("magic-sdk").Magic;
let instance: MagicClient | undefined;

export const magicKey = () =>
	(import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY as string | undefined) ?? "";

export async function getMagic(): Promise<MagicClient> {
	if (!instance) {
		const { Magic } = await import("magic-sdk");
		instance = new Magic(magicKey());
	}
	return instance;
}

// Best effort: Magic is only used for identity, never as the session
export async function signOutMagic() {
	if (!instance) return;
	try {
		await instance.user.logout();
	} catch {}
}
