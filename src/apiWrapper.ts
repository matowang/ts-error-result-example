import { Result } from "#utils/result";
import z from "zod";
export * as API from "./apiWrapper";

export class StatusError extends Error {
  name = "StatusError" as const;
}

export class JsonError extends Error {
  name = "JsonError" as const;
}

export class ParseError extends Error {
  name = "ParseError" as const;
}

export class NetworkError extends Error {
  name = "NetworkError" as const;
}

export class ValidationError extends Error {
  name = "ValidationError" as const;
}

export type PostDTO = z.infer<typeof PostDTO>;
const PostDTO = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
});

export async function getPosts(
  userId: number
): Promise<
  Result<PostDTO, StatusError | JsonError | ParseError | NetworkError>
> {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${userId}`
  );
  if (!res.ok) {
    return Result.Failure(new StatusError("Failed to fetch Posts"));
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    return Result.Failure(
      new JsonError("Failed to parse Posts JSON", {
        cause: e,
      })
    );
  }

  const { success, data, error } = PostDTO.safeParse(json);

  if (!success) {
    return Result.Failure(
      new ParseError("Failed to validate Posts JSON", {
        cause: error,
      })
    );
  }

  return Result.Success(data);
}

class UserDoesNotExistError extends Error {
  name = "UserDoesNotExistError" as const;
}

type Post = z.infer<typeof Post>;
const Post = z.object({
  userId: z.number().min(1),
  title: z.string().min(5),
  body: z.string().min(10),
});

// this function throws errors, which is not ideal
// async function createPost(input: { post: Post }): Promise<unknown> {
//   const _post = Post.parse(input.post); // ❗️ May throw an error
//   const res = await fetch(`https://jsonplaceholder.typicode.com/posts`, {
//     method: "POST",
//     body: JSON.stringify(_post),
//     headers: {
//       "Content-type": "application/json; charset=UTF-8",
//     },
//   }); // ❗️ May throw an error

//   if (!res.ok) {
//     throw new Error("Failed to create Post");
//   }

//   return await res.json(); // ❗️ May throw an error
// }

// async function run() {
//   try {
//     await createPost({
//       post: {
//         userId: 1,
//         title: "Hello",
//         body: "World",
//       },
//     });
//   } catch (e) {
//     //     ^ we don't know what type of error this is. We can't handle different error types
//     console.error(e);
//   }
// }

export async function createPost(input: {
  post: Post;
}): Promise<
  Result<
    null,
    | UserDoesNotExistError
    | StatusError
    | JsonError
    | NetworkError
    | ValidationError
    | ParseError
  >
> {
  const parsedPost = Post.safeParse(input.post);
  if (!parsedPost.success) {
    return Result.Failure(
      new ValidationError("Failed to validate Post input", {
        cause: parsedPost.error,
      })
    );
  }

  const _post = parsedPost.data;

  const userRes = await getUserFromId(_post.userId);
  if (!userRes.isOk) {
    // We can return this error directly because it is already a Result type
    return userRes;
  }

  if (userRes.value === null) {
    return Result.Failure(
      new UserDoesNotExistError(`UserId: ${_post.userId} does not exist`)
    );
  }

  const res = await fetch(`https://jsonplaceholder.typicode.com/posts`, {
    method: "POST",
    body: JSON.stringify(_post),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  });

  if (!res.ok) {
    return Result.Failure(new StatusError("Failed to create Post"));
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    return Result.Failure(
      new JsonError("Failed to parse Post JSON", {
        cause: e,
      })
    );
  }

  const parsedResponse = PostDTO.safeParse(json);

  if (!parsedResponse.success) {
    return Result.Failure(
      new ParseError("Failed to validate Post response schema", {
        cause: parsedResponse.error,
      })
    );
  }

  return Result.Success(null);
}

type UserDTO = z.infer<typeof UserDTO>;
const UserDTO = z.object({
  id: z.number(),
  name: z.string(),
});

async function getUserFromId(
  id: number
): Promise<Result<UserDTO | null, StatusError | JsonError | ParseError>> {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/users/${String(id)}`
  );
  if (!res.ok) {
    return Result.Failure(new StatusError("Failed to fetch User"));
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    return Result.Failure(
      new JsonError("Failed to parse User JSON", {
        cause: e,
      })
    );
  }

  const { success, data, error } = UserDTO.nullable().safeParse(json);

  if (!success) {
    return Result.Failure(
      new ParseError("Failed to validate User JSON", {
        cause: error,
      })
    );
  }

  return Result.Success(data);
}
