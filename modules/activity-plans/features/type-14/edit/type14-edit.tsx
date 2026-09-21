"use client";

import { Type14Create, type Type14CreateProps } from "../create/type14-create";

/**
 * Type14Edit - Thin Facade for TYPE_14 Edit Flow
 * Strictly re-exports the canonical form from create/ with zero duplicate business logic.
 */
export const Type14Edit = Type14Create;
export type Type14EditProps = Type14CreateProps;
