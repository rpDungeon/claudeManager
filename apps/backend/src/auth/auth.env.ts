declare module "bun" {
	interface Env {
		MASTER_PASSWORD: string;
		JWT_SECRET: string;
	}
}

export const authEnvs = [
	"MASTER_PASSWORD",
	"JWT_SECRET",
];
