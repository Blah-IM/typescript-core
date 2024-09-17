// A simple adoption of https://github.com/erdtman/canonicalize/blob/master/lib/canonicalize.js

export default function canonicalize(object: unknown) {
  if (typeof object === "number" && isNaN(object)) {
    throw new Error("NaN is not allowed");
  }

  if (typeof object === "number" && !isFinite(object)) {
    throw new Error("Infinity is not allowed");
  }

  if (object === null || typeof object !== "object") {
    return JSON.stringify(object);
  }

  if ("toJSON" in object && object.toJSON instanceof Function) {
    return canonicalize(object.toJSON());
  }

  if (Array.isArray(object)) {
    const values = object.reduce((t, cv, ci) => {
      const comma = ci === 0 ? "" : ",";
      const value = cv === undefined || typeof cv === "symbol" ? null : cv;
      return `${t}${comma}${canonicalize(value)}`;
    }, "");
    return `[${values}]`;
  }

  const values = Object.keys(object).sort().reduce((t, cv): string => {
    const value: unknown = (object as Record<string, unknown>)[cv];
    if (
      value === undefined ||
      typeof value === "symbol"
    ) {
      return t;
    }
    const comma = t.length === 0 ? "" : ",";
    return `${t}${comma}${canonicalize(cv)}:${canonicalize(value)}`;
  }, "");
  return `{${values}}`;
}
