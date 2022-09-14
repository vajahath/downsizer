import { globbyStream } from "globby";
import { Writable } from "node:stream";
import { createWorkerPool } from "./pool.js";

function getListOfFilesStream(matchString: string) {
  return globbyStream(matchString);
}

export function runner(INPUT_MATCH_STRING: string, quality?: number) {
  const optimizerPool = createWorkerPool(quality);

  function getOptimizerStream() {
    return new Writable({
      async write(this, chunk, encoding, callback) {
        const inputFile = chunk.toString();
        await optimizerPool.optimizeImage(inputFile);
        callback();
      },
    });
  }

  const optimizerStream = getOptimizerStream();

  return new Promise((resolve) => {
    getListOfFilesStream(INPUT_MATCH_STRING)
      .pipe(optimizerStream)
      .on("close", () => {
        resolve(null);
      })
      .on("finish", () => {
        resolve(null);
      })
      .on("error", () => console.error("error"));
  }).then(() => optimizerPool.terminate());
}
