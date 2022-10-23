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

        [Test]
        public void TestSolutionPathTooLongWillThrowException()
        {
            var solutionPath = RandomString(280);
            var destinationPath = "xx";
            try
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            }
            catch (Exception e)
            {
                Assert.AreEqual(e.Message,
                    "The solution path length cannot exceed 260 characters. Please try a location that has a shorter path.");
            }
        }

        [Test]
        public void TestDestinationPathTooLongWillThrowException()
        {
            var solutionPath = "xx";
            var destinationPath = RandomString(280);
            try
            {
                PortingAssistantUtils.CopyDirectory(solutionPath, destinationPath);
            }
            catch (Exception e)
            {
                Assert.AreEqual(e.Message,
                    "The destination path length cannot exceed 260 characters. Please try a location that has a shorter path.");
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
