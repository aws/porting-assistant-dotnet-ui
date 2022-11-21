using System.Linq;
using PortingAssistant.Client.NuGet.Interfaces;
using System.Threading.Tasks;        

namespace PortingAssistant.Common.Utils
{
    public static class HttpServiceUtils
    {
        public static bool CheckInternetAccess(IHttpService httpService, string[] files)
        {
            Task<bool>[] tasks = files.Select((file) =>
                    HttpServiceUtils.TryGetFile(httpService, file))
                .ToArray();
            Task.WhenAll(tasks).Wait();
            return tasks.Any((task) => task.Result);
        }

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
        