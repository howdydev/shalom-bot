import { SlayerMasterTask } from "../../types/slayer";
import DuradelTasks from "./masters/duradel";

export const TaskMasters = ["Duradel", "Steve"] as const;
export type TaskMaster = (typeof TaskMasters)[number];

const TaskList: { [key in TaskMaster]?: SlayerMasterTask[] } = {
  Duradel: DuradelTasks,
};

export function getTaskData(master: string, monster: string) {
  const tasks = TaskList[master as TaskMaster];
  if (!tasks) return null;
  return tasks.find(
    (task) => task.name.toLowerCase() === monster.toLowerCase()
  );
}

export default TaskList;
