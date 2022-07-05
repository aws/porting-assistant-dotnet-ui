using Microsoft.VisualStudio.Setup.Configuration;
using System;
using System.Runtime.InteropServices;

#pragma warning disable CA5392 // Use DefaultDllImportSearchPaths attribute for P/Invokes
#pragma warning disable SA1114 // Parameter list should follow declaration

namespace PortingAssistant.VisualStudio
{
    internal static class NativeMethods
    {
        [DllImport("Microsoft.VisualStudio.Setup.Configuration.Native.dll", ExactSpelling = true, PreserveSig = true)]
        public static extern int GetSetupConfiguration(
            [MarshalAs(UnmanagedType.Interface)][Out] out ISetupConfiguration configuration,
            IntPtr reserved);
    }
}
