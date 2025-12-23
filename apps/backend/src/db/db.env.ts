type DbEnv = {
	DATABASE_PATH: string;
};

declare module "bun" {
	interface Env extends DbEnv {}
}

export const dbEnvs = [
	"DATABASE_PATH",
] as const satisfies (keyof DbEnv)[];
