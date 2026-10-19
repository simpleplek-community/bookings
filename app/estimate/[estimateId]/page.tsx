import React from "react";
import { notFound } from "next/navigation";
import { getEstimate, getProperty, getPackage } from "@/lib/firebase";
import EstimateClient from "./EstimateClient";

interface PageProps {
  params: Promise<{ estimateId: string }>;
}

export default async function EstimatePage({ params }: PageProps) {
  const { estimateId } = await params;
  const estimate = await getEstimate(estimateId);

  if (!estimate) {
    notFound();
  }

  const property = await getProperty(estimate.propertyId);
  const selectedPackage = estimate.packageId ? await getPackage(estimate.packageId) : null;

  // This page renders for anyone with the estimate ID, so the server payload carries no
  // invite token or contact details. The client loads the viewer's scoped copy from the API.
  const { token, removedGuests, guestsDetails, customerEmail, ...publicEstimate } = estimate;

  return (
    <EstimateClient 
      estimate={{ ...publicEstimate, customerEmail: "", guestsDetails: {} }} 
      property={property} 
      selectedPackage={selectedPackage} 
    />
  );
}
