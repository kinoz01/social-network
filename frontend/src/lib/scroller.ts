import { useCallback, useEffect } from "react";
import { throttle } from "./utils";

type Options = {
	loading: boolean;
	hasMore: boolean;
	page: number;
	fetchPage: (p: number) => void;
	bottomGap?: number;
	wait?: number;
};

export function useInfiniteScroll(ref: any, opts: Options) {
	const {
		loading,
		hasMore,
		page,
		fetchPage,
		bottomGap = 32,
		wait = 250,
	} = opts;

	/* stable, throttled handler */
	const onScroll = useCallback(
		throttle(() => {
			const el = ref.current;
			if (!el || loading || !hasMore) return;
			if (el.scrollTop + el.clientHeight >= el.scrollHeight - bottomGap) {
				fetchPage(page);
			}
		}, wait),
		[ref, loading, hasMore, page, fetchPage, bottomGap, wait]
	);

	/* attach / detach whenever the DOM node becomes available */
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.addEventListener("scroll", onScroll);
		return () => el.removeEventListener("scroll", onScroll);
	}, [ref.current, onScroll]);
}