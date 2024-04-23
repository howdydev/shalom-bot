import { SlayerTask } from "../../types/slayer";
import TaskList, { TaskMaster } from "./tasks";

export function fetchTask(
	level: number,
	master: TaskMaster,
	previousTask?: string
): SlayerTask | null {
	const tasks = TaskList[master];
	if (!tasks) {
		console.error(`Invalid task master: ${master}`);
		return null;
	}

	if (!previousTask) previousTask = "Invalid";

	const availableTasks = tasks.filter(
		(task) =>
			task.levelRequirement <= level &&
			task.weight <= 12 &&
			task.name !== previousTask
	);

	if (availableTasks.length === 0) {
		console.error("No tasks available");
		return null;
	}

	const totalWeight = availableTasks.reduce(
		(acc, task) => acc + task.weight,
		0
	);
	let random = Math.random() * totalWeight;

	for (const task of availableTasks) {
		random -= task.weight;

		if (random < 0) {
			const amount = Math.floor(
				Math.random() * (task.amount[1] - task.amount[0] + 1) +
					task.amount[0]
			);
			const ttk = Math.round((task.timeToKill * 1000) / 2);
			const timeAdded = ttk * amount;

			return {
				name: task.name,
				amount: Math.floor(
					Math.random() * (task.amount[1] - task.amount[0] + 1) +
						task.amount[0]
				),
				experience: Math.floor(task.hitpoints * amount),
				finishedAt: new Date(Date.now() + timeAdded),
				taskMaster: master,
			};
		}
	}

	console.error(`Failed to select task from ${master}`);
	return null;
}
