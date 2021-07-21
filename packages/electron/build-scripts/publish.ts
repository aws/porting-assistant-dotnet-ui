import process from "process";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import AWS from "aws-sdk";
import util from "util";
import { build } from "electron-builder";
import yargs from "yargs";

const args = yargs
  .option("s3", { describe: "S3 Bucket", type: "string" })
  .option("filename", {
    describe:
      "Filename of EXE to upload. The file must be in the dist/ folder.",
    type: "string",
  })
  .option("version", {
    describe: "Version of the EXE to be uploaded.",
    type: "string",
  })
  .option("upload", {
    describe:
      "Whether to only upload to S3, when specified, a prebuilt EXE will need to be specified",
    type: "boolean",
    implies: ["filename", "version"],
  })
  .option("sign", {
    describe: "Should we sign using env variable SIGNER_PATH",
    type: "boolean",
    default: false,
  })
  .option("require-s3", {
    describe: "Whether to require a S3 bucket to be specified.",
    type: "boolean",
    implies: ["s3"],
  })
  .option("config", {
    describe: "Config file",
    type: "string",
    demandOption: true,
  })
  .boolean("public")
  .boolean("local")
  .help().argv;

const configFilename = args.config;

const config = require(path.join(process.cwd(), configFilename));

const checksumFile = (hashName: string, path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashName);
    const stream = fs.createReadStream(path);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

if (!process.env["S3_PUBLISH_PATH"]) {
  process.env["S3_PUBLISH_PATH"] == ""
}
if (!process.env["S3_UPGRADE_PATH"]) {
  process.env["S3_UPGRADE_PATH"] == ""
}
if (!process.env["S3_PUBLISH_REGION"]) {
  process.env["S3_PUBLISH_REGION"] == ""
}
if (!process.env["S3_UPGRADE_REGION"]) {
  process.env["S3_UPGRADE_REGION"] == ""
}

const s3 = new AWS.S3({
  region: process.env["S3_PUBLISH_REGION"],
});
const upgradeS3 = new AWS.S3({
  region: process.env["S3_UPGRADE_REGION"],
});
const upload = util.promisify(s3.upload).bind(s3);

const manifest = {
  "1.0": {
    Windows32: {
      PackageS3Uri: "",
      MD5ChecksumS3Uri: "",
      Sha256ChecksumS3Uri: "",
      Sha512ChecksumS3Uri: "",
    },
    Windows64: {
      PackageS3Uri: "",
      MD5ChecksumS3Uri: "",
      Sha256ChecksumS3Uri: "",
      Sha512ChecksumS3Uri: "",
    },
    Linux32: {
      PackageS3Uri: "",
      MD5ChecksumS3Uri: "",
      Sha256ChecksumS3Uri: "",
      Sha512ChecksumS3Uri: "",
    },
    Linux64: {
      PackageS3Uri: "",
      MD5ChecksumS3Uri: "",
      Sha256ChecksumS3Uri: "",
      Sha512ChecksumS3Uri: "",
    },
    PackageVer: "",
    SchemaVer: "1.0",
  },
};
const upgradeConfigPath = path.join("upgrade", "upgrade-config.json");

const s3Bucket = args.s3 !== undefined ? args.s3 : process.env["S3_PUBLISH_PATH"];

fs.mkdirSync("upgrade", { recursive: true });
fs.writeFileSync(
  upgradeConfigPath,
  JSON.stringify({
    s3Url: upgradeS3.endpoint.href + process.env["S3_UPGRADE_PATH"],
  })
);

fs.mkdirSync("config", { recursive: true });
if (config.config !== undefined) {
  fs.writeFileSync(
    path.join("config", "porting-assistant-config.json"),
    fs.readFileSync(config.config).toString()
  );
} else {
  fs.writeFileSync(
    path.join("config", "porting-assistant-config.json"),
    JSON.stringify({
      PortingAssistantConfiguration: {
        DataStoreSettings: {
          HttpsEndpoint: `https://s3.${process.env["NUGET_PACKAGE_S3_REGION"]}.amazonaws.com/${process.env["NUGET_PACKAGE_S3_BUCKET"]}/`,
          S3Endpoint: process.env["NUGET_PACKAGE_S3_BUCKET"],
          GitHubEndpoint:
            process.env["NUGET_PACKAGE_GITHUB_ENDPOINT"] ||
            "https://raw.githubusercontent.com/aws/porting-assistant-dotnet-datastore/master/",
        },
      },
      PortingAssistantMetrics: {
        InvokeUrl: process.env["INVOKE_URL"],
        Region: process.env["S3_REGION"],
        ServiceName: process.env["SERVICE_NAME"],
        MaxBufferCapacity: process.env["MAX_BUFFER_CAPACITY"],
        MaxBufferCache: process.env["MAX_BUFFER_CACHE"],
        FlushInterval: process.env["FLUSH_INTERVAL"],
        LogTimerInterval: process.env["LogTimerInterval"],
        Prefix: process.env["Prefix"],
        Description: process.env["Description"]
      },
    })
  );
}

const buildConfig = config.buildConfig;
if (args.sign) {
  buildConfig.win["sign"] = process.env["SIGNER_PATH"];
}

// Build package promise
const buildPromise = build({
  win: ["nsis"],
  publish: "never",
  config: Object.assign({}, config.buildConfig),
}).then((result) => {
  fs.unlinkSync(upgradeConfigPath);
  return result;
});

const publishPromise = (distFile: string) => {
  return Promise.all([
    checksumFile("md5", path.join(config.distPath, distFile)),
    checksumFile("sha256", path.join(config.distPath, distFile)),
    checksumFile("sha512", path.join(config.distPath, distFile)),
    distFile,
  ])
    .then(([md5Hash, sha256Hash, sha512Hash, distFile]) => {
      console.log("Generated checksum hashes, uploading files.");
      const dateString = new Date().toISOString();
      return Promise.all([
        upload({
          Bucket: s3Bucket,
          ACL: args.public ? "public-read" : "private",
          Key: `${dateString}/windows/${distFile}.md5`,
          Body: md5Hash,
        }),
        upload({
          Bucket: s3Bucket,
          ACL: args.public ? "public-read" : "private",
          Key: `${dateString}/windows/${distFile}.sha256`,
          Body: sha256Hash,
        }),
        upload({
          Bucket: s3Bucket,
          ACL: args.public ? "public-read" : "private",
          Key: `${dateString}/windows/${distFile}.sha512`,
          Body: sha512Hash,
        }),
        upload({
          Bucket: s3Bucket,
          ACL: args.public ? "public-read" : "private",
          Key: `${dateString}/windows/${distFile}`,
          Body: fs.readFileSync(path.join(config.distPath, distFile)),
        }),
        upload({
          Bucket: s3Bucket,
          ACL: args.public ? "public-read" : "private",
          Key: `latest/windows/Porting-Assistant-Dotnet.exe`,
          Body: fs.readFileSync(path.join(config.distPath, distFile)),
        }),
      ]);
    })
    .then(([md5File, sha256File, sha512File, exeFile]) => {
      console.log("Uploaded files, generating and uploading manifest files.");
      manifest["1.0"].Windows64.PackageS3Uri = exeFile.Location;
      manifest["1.0"].Windows64.MD5ChecksumS3Uri = md5File.Location;
      manifest["1.0"].Windows64.Sha256ChecksumS3Uri = sha256File.Location;
      manifest["1.0"].Windows64.Sha512ChecksumS3Uri = sha512File.Location;
      return Promise.all([
        exeFile.Location,
        upload({
          Bucket: s3Bucket,
          ACL: args.public ? "public-read" : "private",
          Key: `ver-latest.json`,
          Body: JSON.stringify(manifest),
        }),
      ]);
    })
    .then(([exeLocation, _upload]) => {
      console.log("Upload complete.");
      console.log(`Exe Location: ${exeLocation}`);
    });
};

if (args.local) {
  console.log("Local build. Building exe without publishing.");
  buildPromise
    .then((files) => {
      console.log("Build complete. Generated the following files.", files);
      process.exit(0);
    })
    .catch((reason) => {
      console.error(reason);
      process.exit(1);
    });
} else if (args.upload) {
  const distFile = args.filename!;
  const version = args.version!;
  console.log(`Publishing ${distFile} as version ${version}`);
  manifest["1.0"].PackageVer = version;
  publishPromise(distFile)
    .then(() => process.exit(0))
    .catch((reason) => {
      console.error(reason);
      process.exit(1);
    });
} else {
  console.log("Building and then publishing PortingAssistant");
  buildPromise
    .then((files) => {
      console.log("Package complete, generating checksum hashes.");
      // For now we only publish windows files.
      const exeFile = files.find((f) => f.endsWith(".exe"));
      if (exeFile == null) {
        throw new Error("Error creating exe file");
      }
      const distFile = path.parse(exeFile).base;
      manifest["1.0"].PackageVer = require("../package.json").version;

      return publishPromise(distFile)
        .then(() => process.exit(0))
        .catch((reason) => {
          console.error(reason);
          process.exit(1);
        });
    })
    .catch((reason) => {
      console.error(reason);
      process.exit(1);
    });
}
