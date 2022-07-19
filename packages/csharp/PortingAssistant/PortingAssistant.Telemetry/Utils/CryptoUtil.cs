using System;
using System.Security.Cryptography;
using System.Text;

namespace PortingAssistant.Telemetry.Utils
{
    public static class CryptoUtil
    {
        public static string HashString(string toHash)
        {
            using var sha = SHA256.Create();
            byte[] bytes = Encoding.UTF8.GetBytes(toHash);
            byte[] hash = sha.ComputeHash(bytes);

            return BitConverter.ToString(hash);
        }
    }
}
