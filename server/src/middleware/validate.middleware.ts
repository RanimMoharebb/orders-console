import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

type ValidationTarget = "body" | "query" | "header";

type ValidationOptions = {
target: ValidationTarget;
schema: ZodType;
headerName?: string;
errorMessage?: string;
includeDetails?: boolean;
localName?: string;
};

export function validate({
target,
schema,
headerName,
errorMessage = "Invalid request data.",
includeDetails = false,
localName = `validated${target[0].toUpperCase()}${target.slice(1)}`,
}: ValidationOptions) {
return (req: Request, res: Response, next: NextFunction) => {
const input =
target === "header"
? headerName
? req.get(headerName)
: undefined
: target === "body"
? req.body
: req.query;

const result = schema.safeParse(input);

if (!result.success) {
  const issues = result.error.issues;

  if (includeDetails) {
    res.status(400).json({
      error: errorMessage,
      details: issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  res.status(400).json({
    error: issues[0]?.message ?? errorMessage,
  });
  return;
}

res.locals[localName] = result.data;

next();

};
}
