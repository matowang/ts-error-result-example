import { API } from "#apiWrapper";
import { Result } from "#utils/result";

// infra/.../index.ts
// This can be anything that runs at the top level (e.g. a controller, lambda handler, CLI, React server component, server action, etc.)
export default async function run(input: {
  userId: number;
  post: {
    title: string;
    body: string;
  };
}): Promise<{
  errorMessage?: string;
}> {
  const res = await API.createPost({
    post: {
      userId: input.userId,
      title: input.post.title,
      body: input.post.body,
    },
  });

  if (res.isOk) {
    return {};
  }

  captureError(res.error);

  // Handle different error types
  switch (res.error.name) {
    case "NetworkError":
      // We want to crash on network errors
      throw res.error;
    // Return generic error message for other errors as we don't want to expose internal error details
    case "UserDoesNotExistError":
      return {
        errorMessage: "User does not exist",
      };
    case "StatusError":
      return {
        errorMessage: "Failed to create post",
      };
    case "JsonError":
      return {
        errorMessage: "Failed to parse response",
      };
    case "ValidationError":
      return {
        errorMessage: "Invalid post input",
      };
    case "ParseError":
      return {
        errorMessage: "Failed to validate response",
      };
  }
}

// Can use telemetry to capture errors such as Sentry.io, OpenTelemetry, etc.
function captureError(e: unknown) {
  console.error(e);
}

function main() {
  function getSuccess(): Result<number, Error> {
    return Result.Success(1);
  }
  function getFailure(): Result<number, Error> {
    return Result.Failure(new Error("error"));
  }

  const successResult: Result<number, Error> = getSuccess();
  if (successResult.isOk) {
    console.log(successResult.value); // 1
  }

  const failureResult: Result<number, Error> = getFailure();
  if (!failureResult.isOk) {
    console.log(failureResult.error);
    /**
     * We still get the stack trace
     *
     * Error: error
     *  at getFailure ...
     *  at main
     */
  }
}
main();
