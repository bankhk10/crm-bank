"use client";

import React, { useState } from "react";
import { DrugWithdrawalCard } from "./drug-withdrawal-card";
import type {
  DrugWithdrawalCardProps,
  DrugWithdrawalPlotOption,
  DrugWithdrawalProductOption,
} from "./types";
import type { DrugWithdrawalInput } from "../../../application/validations";

export interface DrugWithdrawalFormProps extends Partial<DrugWithdrawalCardProps> {
  initialValue?: DrugWithdrawalInput;
  availablePlots?: DrugWithdrawalPlotOption[];
  products: DrugWithdrawalProductOption[];
  workTypeCode?: string;
  onPayloadChange?: (payload: DrugWithdrawalInput) => void;
  editable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DrugWithdrawalForm({
  initialValue = { hasDrugWithdrawal: false, items: [] },
  value: controlledValue,
  onChange: controlledOnChange,
  onPayloadChange,
  availablePlots = [],
  products = [],
  workTypeCode,
  editable = true,
  disabled = false,
  allowCustomPlot = true,
  errors,
  className,
}: DrugWithdrawalFormProps) {
  // Support both controlled and uncontrolled states
  const [internalValue, setInternalValue] = useState<DrugWithdrawalInput>(initialValue);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (newVal: DrugWithdrawalInput) => {
    if (controlledOnChange) {
      controlledOnChange(newVal);
    } else {
      setInternalValue(newVal);
    }
    if (onPayloadChange) {
      onPayloadChange(newVal);
    }
  };

  return (
    <DrugWithdrawalCard
      value={currentValue}
      onChange={handleChange}
      availablePlots={availablePlots}
      products={products}
      workTypeCode={workTypeCode}
      editable={editable}
      disabled={disabled}
      allowCustomPlot={allowCustomPlot}
      errors={errors}
      className={className}
    />
  );
}

export default DrugWithdrawalForm;
