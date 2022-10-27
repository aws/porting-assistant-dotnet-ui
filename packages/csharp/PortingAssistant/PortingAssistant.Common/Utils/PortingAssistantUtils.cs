using Microsoft.Build.Construction;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace PortingAssistant.Common.Utils
{
    public static class PortingAssistantUtils
    {
        public static bool cancel = false;
        private const int MaxPathLength = 260;
        public static string FindFiles(string targetDirectory, string fileName)
        {
            // Process the list of files found in the directory.
            string[] fileEntries = Directory.GetFiles(targetDirectory);
            foreach (string file in fileEntries)
            {
                if (Path.GetFileName(file).ToLower().Equals(fileName.ToLower())) return Path.GetFullPath(file);
            }

            // Find in SubDirectories
            string[] subdirectoryEntries = Directory.GetDirectories(targetDirectory);
            foreach (string subdirectory in subdirectoryEntries)
            {
                var file = FindFiles(subdirectory, fileName);
                if (file != null) return file;
            }

            return null;
        }

        public static void CopyDirectory(string solutionPath, string destinationPath)
        {
            if (solutionPath == "")
            {
                throw new ArgumentNullException(nameof(solutionPath), "The solution path length is empty.");
            }

            if (destinationPath == "")
            {
                throw new ArgumentNullException(nameof(destinationPath), "The destination path length is empty.");
            }

            string slnDirPath = Directory.GetParent(solutionPath).FullName;

            DirectoryInfo directoryInfo = new DirectoryInfo(slnDirPath);
            var allFiles = directoryInfo.EnumerateFiles("*.*", SearchOption.AllDirectories);
            string longestFileName = allFiles.OrderByDescending(file => file.FullName.Length).FirstOrDefault().FullName;
            string longestFileNameWithoutParentFolder = longestFileName.Replace(slnDirPath, "").TrimStart('\\');
            string longestFileNameInDestinationFolder = Path.Combine(destinationPath, longestFileNameWithoutParentFolder);
            if (longestFileNameInDestinationFolder.Length >= 260)
            {
                throw new PathTooLongException($"The destination path length cannot exceed {MaxPathLength - 1} characters. Please try a location that has a shorter path.");
            }

            CopyFolderToTemp(Path.GetFileName(solutionPath), slnDirPath, destinationPath);

            if (solutionPath.Contains(".sln") && File.Exists(solutionPath))
            {
                IEnumerable<string> projects = GetProjectPaths(solutionPath);
                foreach (string project in projects)
                {
                    string projPath = Directory.GetParent(project).FullName;

                    if (!IsSubPathOf(slnDirPath, projPath))
                    {
                        string relativeSrc = Path.GetRelativePath(slnDirPath, projPath);
                        string projName = Path.GetFileName(project);
                        string relDestPath = Path.Combine(destinationPath, relativeSrc);
                        CopyFolderToTemp(projName, projPath, relDestPath);
                    }
                }
            }

        }

        /// <summary>
        /// Copies a solution to a new location under a specified folder
        /// </summary>
        /// <param name="solutionName">The name of the solution (MySolution.sln)</param>
        /// <param name="tempDir">The folder the location resides in</param>
        /// <param name="destinationLocation">copied folder location</param>
        /// <returns></returns>
        public static string CopyFolderToTemp(string solutionName, string tempDir, string destinationLocation)
        {
            string solutionPath = Directory.EnumerateFiles(tempDir, solutionName, SearchOption.AllDirectories).FirstOrDefault(s => !s.Contains(string.Concat(Path.DirectorySeparatorChar, Path.DirectorySeparatorChar)));
            string solutionDir = Directory.GetParent(solutionPath).FullName;
            CopyDirectory(new DirectoryInfo(solutionDir), new DirectoryInfo(destinationLocation));

            solutionPath = Directory.EnumerateFiles(destinationLocation, solutionName, SearchOption.AllDirectories).FirstOrDefault();
            return solutionPath;
        }

        public static IEnumerable<string> GetProjectPaths(string solutionPath)
        {
            IEnumerable<string> projectPaths = null;
            try
            {
                SolutionFile solution = SolutionFile.Parse(solutionPath);
                projectPaths = solution.ProjectsInOrder.Where(p => AcceptedProjectTypes.Contains(p.ProjectType)).Select(p => p.AbsolutePath);
            }
            catch (Exception ex)
            {
                throw;
            }

            return projectPaths;

        }

        public static void CopyDirectory(DirectoryInfo source, DirectoryInfo target)
        {
            if (!Directory.Exists(target.FullName))
            {
                Directory.CreateDirectory(target.FullName);
            }

            var files = source.GetFiles();
            foreach (var file in files)
            {
                file.CopyTo(Path.Combine(target.FullName, file.Name), true);
            }

            var dirs = source.GetDirectories();
            foreach (var dir in dirs)
            {
                DirectoryInfo destinationSub = new DirectoryInfo(Path.Combine(target.FullName, dir.Name));
                CopyDirectory(dir, destinationSub);
            }
        }

        public static HashSet<SolutionProjectType> AcceptedProjectTypes = new HashSet<SolutionProjectType>()
        {
            SolutionProjectType.KnownToBeMSBuildFormat,
            SolutionProjectType.WebDeploymentProject,
            SolutionProjectType.WebProject
        };


        public static bool IsSubPathOf(string subPath, string basePath)
        {
            DirectoryInfo subDir = new DirectoryInfo(subPath);
            DirectoryInfo baseDir = new DirectoryInfo(basePath);
            bool isParent = false;
            while (baseDir.Parent != null)
            {
                if (baseDir.Parent.FullName == subDir.FullName)
                {
                    isParent = true;
                    break;
                }
                else
                {
                    baseDir = baseDir.Parent;
                }
            }
            return isParent;
        }
    }
}
