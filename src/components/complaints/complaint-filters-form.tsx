import Link from "next/link";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComplaintStatus, complaintStatusTamil } from "@/lib/enums";

export function ComplaintFiltersForm({
  wards,
  categories,
  current,
}: {
  wards: Array<{ id: string; ward_number: number }>;
  categories: Array<{ id: string; name_ta: string }>;
  current: {
    ward?: string;
    category?: string;
    status?: string;
    from?: string;
    to?: string;
  };
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" method="get">
          <div className="space-y-2 xl:col-span-2">
            <label htmlFor="ward" className="text-sm font-semibold">
              வார்டு
            </label>
            <select id="ward" name="ward" defaultValue={current.ward ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">அனைத்து வார்டுகள்</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  வார்டு {ward.ward_number}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 xl:col-span-2">
            <label htmlFor="category" className="text-sm font-semibold">
              வகை
            </label>
            <select id="category" name="category" defaultValue={current.category ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">அனைத்து வகைகள்</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ta}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-semibold">
              நிலை
            </label>
            <select id="status" name="status" defaultValue={current.status ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">அனைத்து நிலைகள்</option>
              {Object.values(ComplaintStatus).map((status) => (
                <option key={status} value={status}>
                  {complaintStatusTamil[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="from" className="text-sm font-semibold">
              தொடக்கம்
            </label>
            <Input id="from" name="from" type="date" defaultValue={current.from ?? ""} />
          </div>

          <div className="space-y-2">
            <label htmlFor="to" className="text-sm font-semibold">
              முடிவு
            </label>
            <Input id="to" name="to" type="date" defaultValue={current.to ?? ""} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end xl:col-span-6">
            <Button type="submit" className="w-full sm:w-auto">
              <Search className="size-4" />
              வடிகட்டுக
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/complaints">
                <RotateCcw className="size-4" />
                Reset
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
