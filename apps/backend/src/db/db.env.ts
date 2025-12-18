declare module "bun" {
	interface Env {
		DATABASE_PATH: string;
	}
}

export const dbEnvs = [
	"DATABASE_PATH",
];
