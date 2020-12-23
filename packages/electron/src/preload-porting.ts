import path from "path";
import ncp from "ncp";

export const copyDirectory = (
  solutionPath: string,
  destinationPath: string
) => {
  const solutionDirectory = path.dirname(solutionPath);
  return new Promise((resolve, reject) => {
    ncp(
      solutionDirectory,
      destinationPath,
      { clobber: false, stopOnErr: true },
      (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      }
    );
  });
};
