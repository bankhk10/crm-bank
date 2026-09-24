"use client";

import React from "react";
import { Type13Create, type Type13CreateProps } from "../create/type13-create";

export interface Type13EditProps extends Type13CreateProps {}

export function Type13Edit(props: Type13EditProps) {
  return <Type13Create {...props} />;
}

export default Type13Edit;
