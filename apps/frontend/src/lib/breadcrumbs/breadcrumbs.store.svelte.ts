import { SvelteSet } from "svelte/reactivity";

interface BreadcrumbsStore {
	expandRequests: SvelteSet<string>;
	requestExpand: (folderPath: string) => void;
	clearRequest: (folderPath: string) => void;
}

function breadcrumbsStoreCreate(): BreadcrumbsStore {
	const expandRequests = new SvelteSet<string>();

	function requestExpand(folderPath: string) {
		expandRequests.add(folderPath);
	}

	function clearRequest(folderPath: string) {
		expandRequests.delete(folderPath);
	}

	return {
		clearRequest,
		expandRequests,
		requestExpand,
	};
}

export const breadcrumbsStore = breadcrumbsStoreCreate();
