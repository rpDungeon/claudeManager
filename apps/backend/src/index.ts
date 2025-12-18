import { commonEnvVerify } from "./common/common.env";

commonEnvVerify();

import { api } from "./api";

api.listen(Number(Bun.env.PORT), () => {
	console.log(`Server running at http://${Bun.env.HOST}:${Bun.env.PORT}`);
});
