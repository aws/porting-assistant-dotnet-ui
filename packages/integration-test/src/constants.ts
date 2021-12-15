export const expectedWCFProgram: string = `
using CoreWCF.Configuration;
using System.Net;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;


namespace WCFTCPSelfHost
{
	public class Program
	{
		public static void Main(string[] args)
		{
      //All Ports set are default.
			IWebHost host = CreateWebHostBuilder(args).Build();
      host.Run();
		}

    public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
      WebHost.CreateDefaultBuilder(args)
				 .UseKestrel(options => { })
.UseNetTcp(8000)				 .UseStartup<Startup>();
	}
}
`;
export const expectedWCFStartup = (testdir: string): string => {
  return `
using CoreWCF.Configuration;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace WCFTCPSelfHost
{
   public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            string pathToXml = @"C:\\testsolutions\\${testdir}\\wcftcpselfhost\\WCFTCPSelfHost\\corewcf_ported.config";
            services.AddServiceModelServices();
            services.AddServiceModelConfigurationManagerFile(pathToXml);
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseServiceModel();
        }
    }
}
`;
};
export const expectedWCFConfig: string = `<?xml version="1.0" encoding="utf-16" standalone="yes"?>
<configuration>
  <system.serviceModel>
    <bindings>
      <netTcpBinding>
        <binding name="EndPointConfiguration">
          <security mode="None" />
        </binding>
      </netTcpBinding>
    </bindings>
    <behaviors>
      <serviceBehaviors>
        <behavior name="mexBehavior">
          <serviceMetadata httpGetEnabled="true" policyVersion="Policy15" />
        </behavior>
      </serviceBehaviors>
    </behaviors>
    <services>
      <service name="WcfServiceLibrary1.Service1" behaviorConfiguration="mexBehavior">
        <endpoint address="/Service1" binding="netTcpBinding" bindingConfiguration="EndPointConfiguration" contract="WcfServiceLibrary1.IService1" />
      </service>
    </services>
  </system.serviceModel>
</configuration>`;
