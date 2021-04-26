using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace PortingAssistant.Common.Utils
{
    public static class PortingAssistantUtils
    {
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
                return FindFiles(subdirectory, fileName);

            return null;
        }
    }
}
