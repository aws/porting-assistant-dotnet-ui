import { Provider, UpdateInfo } from "electron-updater";
import axios from "axios";
import log from "electron-log";
import { ProviderRuntimeOptions } from "electron-updater/out/providers/Provider";

export class LocalProvider extends Provider<UpdateInfo> {
  private s3Path: string;

  constructor(s3Path: string, runtimeOptions: ProviderRuntimeOptions) {
    super(runtimeOptions);
    this.s3Path = s3Path;
  }

  async getLatestVersion(): Promise<UpdateInfo> {
    log.info(`Fetching ${this.s3Path}/ver-latest.json`);
    const response = await axios.get(`${this.s3Path}/ver-latest.json`);
    if (response.status !== 200) {
      throw new Error(
        `Unable to query for latest version. URL: ${this.s3Path}/ver-latest.json, Response: ${response.status} - ${response.statusText}`
      );
    }
    const responseData = response.data;
    const packageVersion = responseData["1.0"]["PackageVer"];
    const packageUrls = responseData["1.0"]["Windows64"];
    const sha512Response = await axios.get(packageUrls.Sha512ChecksumS3Uri);
    if (sha512Response.status !== 200) {
      throw new Error(
        `Unable to query for latest version. URL: ${packageUrls.Sha512ChecksumS3Uri}, Response: ${response.status} - ${response.statusText}`
      );
    }
    const checksum = await sha512Response.data;
    return {
      version: packageVersion,
      files: [
        {
          url: packageUrls.PackageS3Uri,
          sha512: checksum,
        },
      ],
      path: packageUrls.PackageS3Uri,
      sha512: checksum,
      releaseDate: "",
    };
  }

  resolveFiles(updateInfo: UpdateInfo) {
    return updateInfo.files.map((f) => ({
      url: new URL(f.url),
      info: f,
    }));
  }
}
