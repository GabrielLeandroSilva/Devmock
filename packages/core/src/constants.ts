import type { FieldType, HttpMethod, RouteKind } from "./types.js";

export const FIELD_TYPES: FieldType[] = [
  "uuid",
  "string",
  "number",
  "boolean",
  "date",
  "datetime",
  "image",
  "enum",
  "ref",
  "array",
];

export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const ROUTE_KINDS: RouteKind[] = [
  "list",
  "item",
  "create",
  "update",
  "patch",
  "delete",
  "custom",
];
