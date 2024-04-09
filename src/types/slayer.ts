export type SlayerMasterTask = {
  name: string;
  amount: [number, number];
  levelRequirement: number;
  weight: number;
  hitpoints: number;
  timeToKill: number;
  averageGpPerKill: number;
};

export type SlayerTask = {
  name: string;
  amount: number;
  experience: number;
  finishedAt: Date;
  taskMaster: string;
};
