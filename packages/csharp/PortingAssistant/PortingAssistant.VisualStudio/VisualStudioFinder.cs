﻿using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.Setup.Configuration;
using System;
using System.IO;
using System.Runtime.InteropServices;

namespace PortingAssistant.VisualStudio
{
    /// <summary>
    ///     Wrap the Microsoft.VisualStudio.Setup.Configuration.Interop API to query
    ///     Visual Studio setup for instances installed on the machine.
    ///     Code derived from sample: 
    ///     https://code.msdn.microsoft.com/Visual-Studio-Setup-0cedd331.
    ///     https://github.com/dotnet/upgrade-assistant
    /// </summary>
    public class VisualStudioFinder : IVisualStudioFinder
    {
        private const int REGDB_E_CLASSNOTREG = unchecked((int)0x80040154);

        private readonly ILogger<VisualStudioFinder> _logger;

        public VisualStudioFinder(ILogger<VisualStudioFinder> logger)
        {
            _logger = logger;
        }

        public VisualStudioFinder()
        {
        }

        public string GetLatestVisualStudioPath()
        {
            var latest = GetLatestPath();

            if (latest is null)
            {
                return null;
            }

            var version = Version.Parse(latest.GetInstallationVersion());
            var installation = latest.GetInstallationPath();

            if (Directory.Exists(installation))
            {

                return installation;
            }
            else
            {

                return null;
            }
        }

        private static ISetupInstance2 GetLatestPath()
        {
            var result = default(ISetupInstance2);
            var resultVersion = new Version(0, 0);

            try
            {
                // This code is not obvious. See the sample (link above) for reference.
                var query = (ISetupConfiguration2)GetQuery();
                var e = query.EnumAllInstances();

                int fetched;
                var instances = new ISetupInstance[1];
                do
                {
                    // Call e.Next to query for the next instance (single item or nothing returned).
                    e.Next(1, instances, out fetched);
                    if (fetched <= 0)
                    {
                        continue;
                    }

                    var instance = (ISetupInstance2)instances[0];
                    var state = instance.GetState();

                    if (!Version.TryParse(instance.GetInstallationVersion(), out var version))
                    {
                        continue;
                    }

                    // If the install was complete and a valid version, consider it.
                    if (state == InstanceState.Complete ||
                        (state.HasFlag(InstanceState.Registered) && state.HasFlag(InstanceState.NoRebootRequired)))
                    {
                        var instanceHasMSBuild = false;

                        foreach (var package in instance.GetPackages())
                        {
                            if (string.Equals(package.GetId(), "Microsoft.Component.MSBuild", StringComparison.OrdinalIgnoreCase))
                            {
                                instanceHasMSBuild = true;
                                break;
                            }
                        }

                        if (instanceHasMSBuild && instance != null && version > resultVersion)
                        {
                            result = instance;
                            resultVersion = version;
                        }
                    }
                }
                while (fetched > 0);
            }
            catch (COMException)
            {
            }
            catch (DllNotFoundException)
            {
                // This is OK, VS "15" or greater likely not installed.
            }

            return result;
        }

        private static ISetupConfiguration GetQuery()
        {
            try
            {
                // Try to CoCreate the class object.
                return new SetupConfiguration();
            }
            catch (COMException ex) when (ex.ErrorCode == REGDB_E_CLASSNOTREG)
            {
                // Try to get the class object using app-local call.
                var result = NativeMethods.GetSetupConfiguration(out var query, IntPtr.Zero);

                if (result < 0)
                {
                    throw;
                }

                return query;
            }
        }
    }
}
