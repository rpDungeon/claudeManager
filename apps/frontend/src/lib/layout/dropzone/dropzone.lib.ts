// Review pending by Autumnlight

type LayoutDropZonePosition = "left" | "right" | "top" | "bottom" | "center";

const EDGE_THRESHOLD = 0.3;

function layoutDropZonePositionFromCoordinates(
	x: number,
	y: number,
	width: number,
	height: number,
): LayoutDropZonePosition {
	const relX = x / width;
	const relY = y / height;

	const distLeft = relX;
	const distRight = 1 - relX;
	const distTop = relY;
	const distBottom = 1 - relY;

	const minDist = Math.min(distLeft, distRight, distTop, distBottom);

	if (minDist > EDGE_THRESHOLD) {
		return "center";
	}

	if (minDist === distLeft) return "left";
	if (minDist === distRight) return "right";
	if (minDist === distTop) return "top";
	return "bottom";
}

export { layoutDropZonePositionFromCoordinates };
export type { LayoutDropZonePosition };
