import { authEnvs } from "../auth/auth.env";
import { dbEnvs } from "../db/db.env";

declare module "bun" {
	interface Env {
		PORT: string;
		HOST: string;
	}
}

const commonEnvs = [
	"PORT",
	"HOST",
];

const allEnvs: string[][] = [
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
