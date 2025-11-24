"use client";

import React from "react";
import CustomerForm, { CustomerFormProps } from "./customer-form";

type Props = Omit<CustomerFormProps, "customerType">;

export default function CustomerFormFarmer(props: Props) {
  return <CustomerForm {...props} customerType="FARMER" />;
}
