import { readFile, writeFile } from "node:fs/promises";
import path, { basename, parse } from "node:path";
import sharp from "sharp";
import { mkdirp } from "mkdirp";

const fileFormats = [".jpg", ".jpeg", ".webp", ".png"];

const allFileFormats = fileFormats.concat(
  fileFormats.map((format) => format.toUpperCase())
);

export async function optimizeImage(opt: {
  inputFile: string;
  quality?: number;
}) {
  const filePathDetails = parse(opt.inputFile);

  if (!allFileFormats.includes(filePathDetails.ext)) {
    console.log(
      `🤔  [skipping unknown ${filePathDetails.ext}] ${opt.inputFile}`
    );
    return;
  }
  if (filePathDetails.name.includes("_downsized")) {
    console.log(`⛷️  [skipping already downsized] ${opt.inputFile}`);
    return;
  }

  const imageBuffer = await readFile(opt.inputFile);

  const outputFile = await getOutputFilePath(opt.inputFile);

  const outputBuffer = await sharp(imageBuffer)
    .jpeg({ mozjpeg: true, quality: opt.quality || 80 })
    .toBuffer();

  await writeFile(outputFile, outputBuffer);

  const initalSize = imageBuffer.byteLength;
  const finalSize = outputBuffer.byteLength;

  const reduction = initalSize - finalSize;
  const reductionPercentage = ((reduction * 100) / initalSize)
    .toString()
    .substring(0, 4);

  console.log(
    `✅ ${(initalSize / (1024 * 1024)).toString().substring(0, 5)}MB -> ${(
      finalSize /
      (1024 * 1024)
    )
      .toString()
      .substring(0, 5)}MB (${reductionPercentage} %) ${opt.inputFile} `
  );
}

async function getOutputFilePath(inputFilePath: string) {
  const pathDetails = path.parse(inputFilePath);
  const fileNameWithOutExt = basename(inputFilePath, pathDetails.ext);
  const baseDir = path.join(pathDetails.dir, "downsized");
  await mkdirp(baseDir);
  const outputFilePath = path.join(
    baseDir,
    `${fileNameWithOutExt}_downsized${pathDetails.ext}`
  );
  return outputFilePath;
}

process.on("message", async (msg: string) => {
  const { id, inputFile, quality } = JSON.parse(msg);

  await optimizeImage({ inputFile, quality });
  if (process.send) {
    process.send(id);
  }
});
