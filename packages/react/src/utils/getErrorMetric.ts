import { MetricSource, MetricType, ReactMetric } from '../models/reactmetric';

export const getErrorMetric = (err: any, metricSource: MetricSource) => {
    let errorMessage = ""
    if (err instanceof Error) {
      errorMessage = err.message
    } else if (typeof err === "string") {
      errorMessage = err
    }
    let errorMetric: ReactMetric = {
      MetricSource: metricSource,
      MetricType: MetricType.UIError,
      Content: errorMessage
    }
    return errorMetric;
}