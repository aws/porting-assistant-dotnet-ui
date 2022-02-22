using PortingAssistant.Client.NuGet.Interfaces;
using System.Threading.Tasks;        

namespace PortingAssistant.Common.Utils
{
    public static class HttpServiceUtils
    {
        public static async Task<bool> TryGetFile(IHttpService httpService, string file)
        {
            try
            {
                await httpService.DownloadS3FileAsync(file);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
        