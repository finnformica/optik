import { Typography } from "@/components/ui/typography";
import { UkTaxClient } from "@/components/uk-tax/uk-tax-client";
import { getUkTaxData } from "./actions";

export default async function UkTaxPage() {
  const { profitLoss, cgtCalculation } = await getUkTaxData();

  return (
    <div className="space-y-3 md:space-y-6">
      <Typography variant="h2" className="mb-4">
        UK Tax Analysis
      </Typography>

      <UkTaxClient profitLoss={profitLoss} cgtCalculation={cgtCalculation} />
    </div>
  );
}