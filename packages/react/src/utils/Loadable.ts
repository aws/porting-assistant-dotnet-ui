export type Loadable<S> = ILoaded<S> | ILoading<S> | IFailed | IReloading<S>;

interface ILoaded<S> {
  status: "LOADED";
  data: S;
}

interface ILoadingWithoutData {
  status: "LOADING";
}
interface ILoadingWithData<S> {
  status: "LOADING";
  data: S;
}
type ILoading<S> = ILoadingWithoutData | ILoadingWithData<S>;

interface IReloading<S> {
  status: "RELOADING";
  data: S;
}

interface IFailed {
  status: "FAILED";
  error: Error | string | undefined | null;
  message: string | undefined | null;
}

export const Loading = <S>(s?: S): Loadable<S> => ({
  status: "LOADING",
  data: s
});
export const Reloading = <S>(s: S): Loadable<S> => ({
  status: "RELOADING",
  data: s
});
export const Loaded = <S>(s: S): Loadable<S> => ({
  status: "LOADED",
  data: s
});
export const Failed = <S>(e: Error | string | undefined | null, message?: string | undefined | null): Loadable<S> => ({
  status: "FAILED",
  error: e,
  message
});

export const isLoaded = <S>(s: Loadable<S> | undefined | null): s is ILoaded<S> => s != null && s.status === "LOADED";
export const isLoading = <S>(s?: Loadable<S> | undefined | null): s is ILoading<S> => s == null || s.status === "LOADING";
export const isLoadingWithData = <S>(s: Loadable<S> | undefined | null): s is ILoadingWithData<S> => isLoading(s) && s !== null && ('data' in s) && s.data !== undefined && s.data !== null;
export const isReloading = <S>(s?: Loadable<S> | undefined | null): s is IReloading<S> =>
  s != null && s.status === "RELOADING";
export const isFailed = <S>(s: Loadable<S> | undefined | null): s is IFailed => s != null && s.status === "FAILED";
export const hasNewData = <S>(s: Loadable<S> | undefined | null): s is ILoaded<S> | ILoadingWithData<S> => isLoaded(s) || isLoadingWithData(s);
