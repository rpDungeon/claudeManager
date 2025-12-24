export type SystemMemoryStats = {
	free: number;
	total: number;
	used: number;
	usedPercentage: number;
};

export type SystemStats = {
	cpuPercentage: number;
	memory: SystemMemoryStats;
	ptyCount: number;
	uptime: number;
};
