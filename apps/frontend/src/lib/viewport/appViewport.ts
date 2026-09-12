/** Keep the app inside the visible area when a keyboard only resizes VisualViewport. */
export function appViewportTrack() {
	const viewport = window.visualViewport;
	const style = document.documentElement.style;
	let frame = 0;

	function update() {
		// Preserve normal pinch zoom instead of reflowing the terminal while zooming.
		if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;

		const height = viewport?.height ?? window.innerHeight;
		const top = viewport?.offsetTop ?? 0;
		style.setProperty("--app-viewport-height", `${height}px`);
		style.setProperty("--app-viewport-top", `${top}px`);
		style.setProperty("--app-viewport-bottom", `${Math.max(0, window.innerHeight - height - top)}px`);
	}

	function scheduleUpdate() {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(update);
	}

	update();
	viewport?.addEventListener("resize", scheduleUpdate);
	viewport?.addEventListener("scroll", scheduleUpdate);
	window.addEventListener("resize", scheduleUpdate);

	return () => {
		cancelAnimationFrame(frame);
		viewport?.removeEventListener("resize", scheduleUpdate);
		viewport?.removeEventListener("scroll", scheduleUpdate);
		window.removeEventListener("resize", scheduleUpdate);
		style.removeProperty("--app-viewport-height");
		style.removeProperty("--app-viewport-top");
		style.removeProperty("--app-viewport-bottom");
	};
}
