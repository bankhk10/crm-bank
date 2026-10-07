"use client";

import React from "react";
import { Type13Create, type Type13CreateProps } from "../create/type13-create";

import type { Type13EditProps } from "./types";

export type { Type13EditProps };

export function Type13Edit(props: Type13EditProps) {
  return <Type13Create {...props} />;
}

export default Type13Edit;
