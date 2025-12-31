import * as fs from "node:fs";
import * as os from "node:os";
import type { SystemMemoryStats, SystemStats } from "@claude-manager/common/src/system/system.types";
import { terminalPtyService } from "../terminal/pty/pty.service";

const MEM_AVAILABLE_REGEX = /MemAvailable:\s+(\d+)\s+kB/;

type CpuTimes = {
	idle: number;
	total: number;
};

class SystemService {
	private previousCpuTimes: CpuTimes | null = null;

	private cpuTimesGet(): CpuTimes {
		const cpus = os.cpus();
		let idle = 0;
		let total = 0;

		for (const cpu of cpus) {
			idle += cpu.times.idle;
			total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
		}

		return {
			idle,
			total,
		};
	}

	cpuPercentageGet(): number {
		const current = this.cpuTimesGet();

		if (!this.previousCpuTimes) {
			this.previousCpuTimes = current;
			return 0;
		}

		const idleDiff = current.idle - this.previousCpuTimes.idle;
		const totalDiff = current.total - this.previousCpuTimes.total;

		this.previousCpuTimes = current;

		if (totalDiff === 0) return 0;

		const usage = 100 - (idleDiff / totalDiff) * 100;
		return Math.round(usage * 10) / 10;
	}

	private memoryAvailableFromProcMeminfo(): number | null {
		if (os.platform() !== "linux") return null;

		try {
			const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
			const match = meminfo.match(MEM_AVAILABLE_REGEX);
			if (match) {
				return Number.parseInt(match[1], 10) * 1024;
			}
		} catch {
			return null;
		}
		return null;
	}

	memoryGet(): SystemMemoryStats {
		const total = os.totalmem();
		const available = this.memoryAvailableFromProcMeminfo() ?? os.freemem();
		const used = total - available;
		const usedPercentage = Math.round((used / total) * 1000) / 10;

		return {
			free: available,
			total,
			used,
			usedPercentage,
		};
	}

	statsGet(): SystemStats {
		return {
			cpuPercentage: this.cpuPercentageGet(),
			memory: this.memoryGet(),
			ptyCount: terminalPtyService.instancesCount(),
			uptime: os.uptime(),
		};
	}
}

export const systemService = new SystemService();
