export type GeneratedWallet = {
	mnemonic: string;
	ufvk: string;
	address: string;
};

// Flip once the in-browser WASM generator lands
export const walletGenReady = false;

// Hook point for the in-browser WASM wallet generator. The mnemonic must never leave the browser.
export async function generateWallet(): Promise<GeneratedWallet> {
	throw new Error("Coming soon");
}
