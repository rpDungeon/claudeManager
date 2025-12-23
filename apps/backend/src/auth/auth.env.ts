type AuthEnv = {
	JWT_SECRET: string;
	MASTER_PASSWORD: string;
};

declare module "bun" {
	interface Env extends AuthEnv {}
}

export const authEnvs = [
	"JWT_SECRET",
	"MASTER_PASSWORD",
] as const satisfies (keyof AuthEnv)[];
