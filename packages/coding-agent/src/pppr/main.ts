import { createPpprMain } from "pppr/main";
import { PPPR_LEGACY_PI_HOST_KIND, runPpprLegacyPiHost } from "./legacy-pi-host.js";

export const PPPR_DEFAULT_HOST_KIND = PPPR_LEGACY_PI_HOST_KIND;
export const main = createPpprMain({
	kind: PPPR_DEFAULT_HOST_KIND,
	run: runPpprLegacyPiHost,
});
