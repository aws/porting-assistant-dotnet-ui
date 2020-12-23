import {
  PartialArgs,
  generateSchema,
  programFromConfig,
} from "typescript-json-schema";
import { JSONSchema } from "json-schema-typed";
import path from "path";
import fs from "fs";

const tjsSettings: PartialArgs = {
  ref: false,
};

const program = programFromConfig(
  path.resolve("./node_modules/@porting-assistant/react/tsconfig.build.json")
);

const nugetCacheSchema = generateSchema(
  program,
  "NugetPackageReducerState",
  tjsSettings
) as JSONSchema;

const reducerCacheSchema = generateSchema(
  program,
  "SolutionReducerState",
  tjsSettings
) as JSONSchema;

fs.mkdirSync("schema", { recursive: true });
fs.writeFileSync(
  path.join("schema", "solution-reducer.json"),
  JSON.stringify(reducerCacheSchema)
);
fs.writeFileSync(
  path.join("schema", "nuget-reducer.json"),
  JSON.stringify(nugetCacheSchema)
);
