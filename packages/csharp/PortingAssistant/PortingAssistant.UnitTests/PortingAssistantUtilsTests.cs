using System;
using System.IO;
using System.Linq;
using NUnit.Framework;
using PortingAssistant.Common.Utils;


namespace PortingAssistant.UnitTests
{

    public class PortingAssistantUtilsTests
    {
        private static Random random = new Random();
        private const int MaxPathLength = 260;


        [Test]
        public void TestSolutionPathTooLongWillThrowException()
        {
            var solutionPath = RandomString(265);
            var destinationPath = "xx/yy.sln";
           
            var ex = Assert.Throws<PathTooLongException>(() =>
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            });
            Assert.AreEqual(ex.Message, $"The solution path length cannot exceed {MaxPathLength} characters. Please try a location that has a shorter path.");
        }

        [Test]
        public void TestFileNamePlusDestinationPathTooLongWillThrowException()
        {
            var solutionPath = "xx/yy.sln";
            var destinationPath = RandomString(258);

            var ex = Assert.Throws<PathTooLongException>(() =>
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            });
            Assert.AreEqual(ex.Message, $"The destination path length cannot exceed {MaxPathLength} characters. Please try a location that has a shorter path.");
        }

        [Test]
        public void TestFileNamePlusDestinationPathEqualToMaxWillNotThrowPathTooLongException()
        {
            var solutionPath = "xx/yy.sln";
            var destinationPath = RandomString(254);
            
            // since 'xx/yy.sln' is a fake path, in the end this directory will not be found,
            // but throws this exception means our checks for path too long has been passed
            var ex = Assert.Throws<DirectoryNotFoundException>(() =>
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            });
        }

        private static string RandomString(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
