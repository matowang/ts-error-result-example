export type Failure<E> = {
  isOk: false;
  error: E;
};

function Failure<E>(error: E): Failure<E> {
  return {
    isOk: false,
    error,
  };
}

export type Success<T> = {
  isOk: true;
  value: T;
};

function Success<T>(value: T): Success<T> {
  return {
    isOk: true,
    value,
  };
}
export type Result<T, E = never> = Success<T> | Failure<E>;
export const Result = {
  Failure,
  Success,
};

// discriminated union

function getSuccessResult(): Result<number, Error> {
  return Result.Success(1);
}
function getFailureResult(): Result<number, Error> {
  return Result.Failure(new Error("error"));
}

const successResult: Result<number, Error> = getSuccessResult();
if (successResult.isOk) {
  console.log(successResult.value); // 1
}

const failureResult: Result<number, Error> = getFailureResult();
if (!failureResult.isOk) {
  console.log(failureResult.error.message);
}
