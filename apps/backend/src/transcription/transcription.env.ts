declare module "bun" {
	interface Env {
		TRANSCRIPTION_USE_LEGACY?: string;
	}
}

export const transcriptionEnvs = [
	"MISTRAL_API_KEY",
] as const;
