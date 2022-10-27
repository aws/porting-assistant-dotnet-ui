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
        public void TestLongestFileNamePlusDestinationPathTooLongWillThrowException()
        {
            var solutionPath = "cs/yy.sln";
            var destinationPath = @"D:\" + RandomString(258);

            var ex = Assert.Throws<PathTooLongException>(() =>
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            });
            Assert.AreEqual(ex.Message, $"The destination path length cannot exceed {MaxPathLength - 1} characters. Please try a location that has a shorter path.");
        }

        [Test]
        public void TestLongestFileNamePlusDestinationPathEqualToMaxWillThrowPathTooLongException()
        {
            var solutionPath = "cs/yy.sln";
            var destinationPath = @"D:\" + RandomString(255);

            var ex = Assert.Throws<PathTooLongException>(() =>
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            });
            Assert.AreEqual(ex.Message, $"The destination path length cannot exceed {MaxPathLength - 1} characters. Please try a location that has a shorter path.");
        }

        private static string RandomString(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
