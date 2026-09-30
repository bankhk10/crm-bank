import React from "react";
import { Type10FieldDay } from "../create/type10-field-day";

export function EditType10FieldDay(
  props: React.ComponentProps<typeof Type10FieldDay>,
) {
  return <Type10FieldDay {...props} isEdit={props.isEdit ?? true} />;
}
