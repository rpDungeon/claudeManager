import { authEnvs } from "../auth/auth.env";
import { dbEnvs } from "../db/db.env";

type CommonEnv = {
	HOST: string;
	PORT: string;
};

declare module "bun" {
	interface Env extends CommonEnv {}
}

const commonEnvs = [
	"HOST",
	"PORT",
] as const satisfies (keyof CommonEnv)[];

const allEnvs: readonly (readonly string[])[] = [
	commonEnvs,
	dbEnvs,
	authEnvs,
];

export function commonEnvVerify() {
	for (const envPack of allEnvs) {
		for (const env of envPack) {
			if (Bun.env[env] === undefined) {
				throw new Error(`Environment variable ${env} is not set. Exiting.`);
			}
		}
	}
	console.log("[env] All environment variables validated");
}
