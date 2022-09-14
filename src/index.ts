#!/usr/bin/env node

import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runner } from "./runner.js";
import updateNotifier from 'update-notifier';

const __dirname = dirname(fileURLToPath(import.meta.url));

const program = new Command();

const pkgJson = JSON.parse((await readFile(join(__dirname, '..', 'package.json'))).toString());
updateNotifier({pkg: pkgJson}).notify();

program.argument("<filePattern>", "./test/*.jpg")
program.option("-q, --quality <0-100>")
program.version(pkgJson.version)
program.parse();

const options = program.opts();

if (!program.args || !program.args.length) {
  throw new Error("provide input");
}

const input = program.args[0];
const quality = options.quality?+options.quality:80;

await runner(input, quality);

console.log('done');