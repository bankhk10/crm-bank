"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { DealerFields } from "../specific/DealerFields";
import { FarmerFields } from "../specific/FarmerFields";
import { BrokerFields } from "../specific/BrokerFields";
import { SubDealerFields } from "../specific/SubDealerFields";
import { CustomerFormData } from "../../../types";

export function SpecificSection() {
  const { watch } = useFormContext<CustomerFormData>();
  const customerType = watch("customerType");

  switch (customerType) {
    case "DEALER":
      return <DealerFields />;
    case "FARMER":
      return <FarmerFields />;
    case "BROKER":
      return <BrokerFields />;
    case "SUBDEALER":
      return <SubDealerFields />;
    default:
      return null;
  }
}
