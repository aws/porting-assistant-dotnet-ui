import { config, putLogData } from "../telemetry/electron-metrics";

export class PortingAssistantBuffer {
  name: string;
  capacity: number;
  buff: any[];
  size: number;
  flushInterval: number;
  maxCache: number;

  constructor(
    name: string,
    capacity: number,
    flushInterval: number,
    maxCache: number
  ) {
    this.name = name;
    this.capacity = capacity;
    this.buff = new Array<any[]>();
    this.size = 0;
    this.flushInterval = flushInterval;

    this.maxCache = maxCache;
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  push = async (element: string) => {
    // Try to flush
    try {
      if (!element) {
        return;
      }
      if (
        this.size + (element?.length || 0) >= this.capacity &&
        Number.MAX_SAFE_INTEGER - (element?.length || 0) > this.size
      ) {
        await this.flush();
      }
      // If beta endpoint fails and flush doesn't work
      if (this.size + element?.length >= this.capacity) {
        // Remove oldest errors from cache
        while (this.size + (element?.length || 0) >= this.maxCache) {
          const removed = this.buff.shift()!;
          this.size -= removed?.length || 0;
        }
      }
      this.buff.push(element);
      this.size += element?.length || 0;
    } catch (error) {
      console.error("Error in pushing data: ", error);
    }
  };

  flush = async () => {
    if (this.size > 0) {
      try {
        const success = await putLogData(this.name, this.getString());
        if (success) {
          // Make buffer empty if flush was scuccessful
          this.buff.length = 0;
          this.size = 0;
        }
      } catch (error) {
        console.error("Error in flushing data: ", error);
      }
    }
  };

  getString(): string {
    // Base64 encoding
    return Buffer.from(JSON.stringify(this.buff), "utf8").toString("base64");
  }
}

export const backendLogBuffer = new PortingAssistantBuffer(
  "portingAssistant-backend-logs",
  config.PortingAssistantMetrics.MaxBufferCapacity,
  config.PortingAssistantMetrics.FlushInterval,
  config.MaxBufferCache
);
export const electronLogBuffer = new PortingAssistantBuffer(
  "electron-logs",
  config.PortingAssistantMetrics.MaxBufferCapacity,
  config.PortingAssistantMetrics.FlushInterval,
  config.MaxBufferCache
);
export const metricsBuffer = new PortingAssistantBuffer(
  "portingAssistant-metrics",
  config.PortingAssistantMetrics.MaxBufferCapacity,
  config.PortingAssistantMetrics.FlushInterval,
  config.MaxBufferCache
);
export const reactErrorBuffer = new PortingAssistantBuffer(
  "react-errors",
  config.PortingAssistantMetrics.MaxBufferCapacity,
  config.PortingAssistantMetrics.FlushInterval,
  config.MaxBufferCache
);
