import { authEnvs } from "../auth/auth.env";
import { dbEnvs } from "../db/db.env";

const commonEnvs = [
	"HOST",
	"PORT",
] as const;

const allEnvs = [
	...commonEnvs,
	...dbEnvs,
	...authEnvs,
] as const;

type AllEnvKeys = (typeof allEnvs)[number];

declare module "bun" {
	interface Env extends Record<AllEnvKeys, string> {}
}

export function commonEnvVerify() {
	for (const env of allEnvs) {
		if (Bun.env[env] === undefined) {
			throw new Error(`Environment variable ${env} is not set. Exiting.`);
		}
	}
	console.log("[env] All environment variables validated");
}
