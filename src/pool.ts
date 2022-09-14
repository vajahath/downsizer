import chalk from "chalk";
import { ChildProcess, fork } from "node:child_process";
import EventEmitter from "node:events";
import { cpus } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerNumber = cpus().length - 1;

class Q {
  private q: number[] = [];
  push(thing: number) {
    this.q.push(thing);
  }
  pull() {
    return this.q.pop();
  }
  length() {
    return this.q.length;
  }
}

const freeWorkerQueue = new Q();
const workerFreeEvent = new EventEmitter();

async function getFreeWorker() {
  let freeWorker: number | undefined = undefined;

  while (freeWorker === undefined) {
    freeWorker = freeWorkerQueue.pull();
    if (freeWorker !== undefined) {
      return freeWorker;
    }

    await new Promise((resolve) => {
      workerFreeEvent.once("free", resolve);
    });
  }
}

export function createWorkerPool(quality?: number) {
  const jobToWorkerMap: Record<string, number> = {};

  const workers: ChildProcess[] = [];

  for (var i = 0; i < workerNumber; i++) {
    const p = fork(join(__dirname, "optimizer.js"));
    console.log(chalk.gray(`⚙️  Creating worker ${i} pid: ${p.pid}`));

    freeWorkerQueue.push(i);

    p.on("message", (jobId: string) => {
      const freedUpWorker = jobToWorkerMap[jobId];
      delete jobToWorkerMap[jobId];
      freeWorkerQueue.push(freedUpWorker);
      workerFreeEvent.emit("free", freedUpWorker.toString());
    });
    workers.push(p);
  }

  console.log("");

  process.on("SIGINT", terminatePool);

  function terminatePool() {
    for (const worker of workers) {
      console.log(chalk.grey(`⚙️  Terminating worker ${worker.pid}`));
      worker.kill();
    }
  }

  return {
    optimizeImage: async (inputImagePath: string) => {
      const freeWorkerIndex = await getFreeWorker();
      if (freeWorkerIndex === undefined) {
        throw new Error("unable to find free worker");
      }
      const id = Date.now() + "_" + Math.random();
      jobToWorkerMap[id] = freeWorkerIndex;

      // console.log(`[optimizing] worker ${freeWorkerIndex}: ${inputImagePath}`);

      workers[freeWorkerIndex].send(
        JSON.stringify({
          inputFile: inputImagePath,
          id,
          quality,
        })
      );
    },
    terminate: async () => {
      while (freeWorkerQueue.length() !== workerNumber) {
        await new Promise((resolve) => {
          workerFreeEvent.once("free", resolve);
        });
      }

      console.log("");
      terminatePool();
    },
  };
}
