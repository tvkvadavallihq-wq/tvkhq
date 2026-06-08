import { ComplaintForm } from "@/components/complaints/complaint-form";
import { getComplaintFormOptions } from "@/lib/repositories/public";
import { unstable_noStore as noStore } from "next/cache";

export const metadata = {
  title: "புகார் பதிவு",
};

export default async function NewComplaintPage() {
  noStore();
  const options = await getComplaintFormOptions();

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">புதிய புகார் பதிவு</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          புகார் விவரங்களை தெளிவாக பதிவு செய்யுங்கள். சமர்ப்பித்ததும் கண்காணிப்பு எண் கிடைக்கும்.
        </p>
      </div>
      <ComplaintForm wards={options.wards} categories={options.categories} />
    </section>
  );
}
