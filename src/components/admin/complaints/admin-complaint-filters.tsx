import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ComplaintStatus, complaintStatusTamil } from "@/lib/enums";
import type { AdminComplaintListFilterValues } from "@/lib/validators";

type SelectOption = {
  id: string;
  label: string;
};

export function AdminComplaintFilters({
  wards,
  categories,
  assignees,
  current,
}: {
  wards: SelectOption[];
  categories: SelectOption[];
  assignees: SelectOption[];
  current: AdminComplaintListFilterValues & { q?: string; ward?: string; category?: string; status?: string };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <form className="grid gap-3 xl:grid-cols-12" method="get">
          <input type="hidden" name="page" value="1" />
          <div className="space-y-2 xl:col-span-4">
            <label htmlFor="q" className="text-sm font-semibold">
              தேடல்
            </label>
            <Input id="q" name="q" placeholder="புகார் எண், பெயர், மொபைல், முகவரி" defaultValue={current.q ?? ""} />
          </div>

          <div className="space-y-2 xl:col-span-2">
            <label htmlFor="ward" className="text-sm font-semibold">
              வார்டு
            </label>
            <select id="ward" name="ward" defaultValue={current.ward ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">அனைத்து வார்டுகள்</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.label}
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
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 xl:col-span-2">
            <label htmlFor="assignee" className="text-sm font-semibold">
              ஒதுக்கீடு
            </label>
            <select id="assignee" name="assignee" defaultValue={current.assignee ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">அனைத்து பொறுப்பாளர்கள்</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 xl:col-span-2">
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

          <div className="space-y-2 xl:col-span-1">
            <label htmlFor="sort" className="text-sm font-semibold">
              வரிசை
            </label>
            <select id="sort" name="sort" defaultValue={current.sort ?? "created_at"} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="created_at">புதியது</option>
              <option value="updated_at">மாற்றம்</option>
              <option value="priority">முன்னுரிமை</option>
              <option value="current_status">நிலை</option>
            </select>
          </div>

          <div className="space-y-2 xl:col-span-1">
            <label htmlFor="order" className="text-sm font-semibold">
              ஒழுங்கு
            </label>
            <select id="order" name="order" defaultValue={current.order ?? "desc"} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:col-span-12">
            <Button type="submit" className="w-full sm:w-auto">
              <Search className="size-4" />
              வடிகட்டுக
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/admin/complaints">
                <RotateCcw className="size-4" />
                மீட்டமை
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
