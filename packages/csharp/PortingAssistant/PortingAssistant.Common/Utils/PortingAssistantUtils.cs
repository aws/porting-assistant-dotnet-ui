using System.IO;

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
            {
                var file = FindFiles(subdirectory, fileName);
                if (file != null) return file;
            }

            return null;
        }
    }
}
