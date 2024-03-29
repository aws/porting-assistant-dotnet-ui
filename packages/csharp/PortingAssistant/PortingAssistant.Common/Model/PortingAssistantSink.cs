﻿using Serilog.Core;
using Serilog.Events;
using Serilog.Formatting;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace PortingAssistant.Common.Model
{
    public delegate void OnDataUpdate(string response);

    public class PortingAssistantSink : ILogEventSink
    {
        private readonly ITextFormatter _formatProvider;
        private readonly List<OnDataUpdate> _onDataUpdateDelegates = new List<OnDataUpdate>();

        public PortingAssistantSink(ITextFormatter formatProvider)
        {
            _formatProvider = formatProvider;

        }

        public void Emit(LogEvent logEvent)
        {
            if (logEvent.Level < LogEventLevel.Warning)
            {
                return;
            }

            var buffer = new StringWriter(new StringBuilder());
            _formatProvider.Format(logEvent, buffer);
            string message = buffer.ToString();
            _onDataUpdateDelegates.ForEach(listener => listener.Invoke(message));
        }

        public void registerOnData(OnDataUpdate listener)
        {
            _onDataUpdateDelegates.Add(listener);
        }
    }
}
