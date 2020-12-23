export interface Response<T, E = any> {
  value: T;
  errorValue: E;
  status: {
    status: "Success" | "Failure";
    error: string;
  };
}
