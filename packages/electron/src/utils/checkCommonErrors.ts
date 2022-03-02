import { commonErrors } from "../constants";
import readline from "readline";
import events from "events";
import fs from "fs";

function lineIsFromRecentRun(start: Date, line: string): boolean {
  var startIndex = line.indexOf("[");
  var endIndex = line.indexOf("]");
  var timeStamp = new Date(line.substring(startIndex + 1, endIndex - 4));
  return timeStamp > start;
}

async function searchTextInFile(
  file: string,
  targetText: string,
  start: Date
): Promise<string> {
  let targetTextLine = "";
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  });
  rl.on("line", (line) => {
    if (lineIsFromRecentRun(start, line)) {
      if (line.includes(targetText)) {
        targetTextLine = line;
        rl.close();
        rl.removeAllListeners();
      }
    }
  });
  await events.once(rl, "close");
  return targetTextLine;
}

function findNoAccessFile(line: string): string {
  // space intention to avoid getting index of "AccessException"
  const start = line.search("Access ");
  const end = line.search("denied.") + 6;
  return line.substring(start, end);
}

export async function checkCommonErrors(
  start: Date,
  log: string
): Promise<{ error: string; message: string }[]> {
  let errorsFound = [];
  try {
    for (const e of commonErrors) {
      const line = await searchTextInFile(log, e.searchText, start);
      if (line !== "") {
        if (e.searchText === "UnauthorizedAccessException") {
          e.message = e.message.replace("{}", findNoAccessFile(line));
        }
        errorsFound.push(e);
      }
    }
    return errorsFound;
  } catch (err) {
    console.error(err);
    return errorsFound;
  }
}
