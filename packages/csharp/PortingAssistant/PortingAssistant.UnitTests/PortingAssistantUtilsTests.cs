using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
            try
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            }
            catch (Exception e)
            {
                Assert.AreEqual(e.Message,
                    $"The solution path length cannot exceed {MaxPathLength} characters. Please try a location that has a shorter path.");
            }
        }

        [Test]
        public void TestFileNamePlusDestinationPathTooLongWillThrowException()
        {
            var solutionPath = "xx/yy.sln";
            var destinationPath = RandomString(258);

            try
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            }
            catch (Exception e)
            {
                Assert.AreEqual(e.Message,
                    $"The destination path length cannot exceed {MaxPathLength} characters. Please try a location that has a shorter path.");
            }
        }

        private static string RandomString(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
