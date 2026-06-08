"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserRole, userRoleTamil } from "@/lib/enums";
import type { AdminMasterData, MasterActionType } from "@/lib/repositories/admin-master";

type FormMutation = UseMutationResult<string, Error, { action: MasterActionType; formData: FormData }>;

function submitAction(action: MasterActionType, formData: FormData) {
  formData.set("action", action);
  return formData;
}

export function AdminMasterDataManager({
  data,
  canManageGlobal,
}: {
  data: AdminMasterData;
  canManageGlobal: boolean;
}) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async ({ action, formData }: { action: MasterActionType; formData: FormData }) => {
      const response = await fetch("/api/admin/masters", {
        method: "POST",
        body: submitAction(action, formData),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? payload.message ?? "செயல் நிறைவேறவில்லை.");
      }

      return payload.message ?? "செயல் நிறைவேறியது.";
    },
    onSuccess() {
      router.refresh();
    },
  });

  return (
    <div className="space-y-5">
      {canManageGlobal ? (
        <SectionCard title="நிர்வாக பயனர்கள்" helper="Local username + password hash in public.users" action={renderUserForm(mutation, data.wards)}>
          <div className="space-y-3">
            {data.users.map((user) => (
              <MasterRow
                key={user.id}
                title={user.full_name}
                meta={[
                  user.username ?? "username missing",
                  userRoleTamil[user.role],
                  user.ward_number ? `Ward ${user.ward_number}` : null,
                  user.has_credentials ? null : "Password hash missing",
                  user.id.slice(0, 8),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                active={user.is_active}
                canToggle
                onToggle={() => mutateToggle(mutation, "toggle-user", user.id, user.is_active)}
              />
            ))}
            {data.users.length === 0 ? <p className="text-sm text-muted-foreground">பயனர்கள் இல்லை.</p> : null}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="வார்டுகள்" helper="Ward master data" action={canManageGlobal ? renderWardForm(mutation) : null}>
        <div className="grid gap-2">
          {data.wards.map((ward) => (
            <MasterRow
              key={ward.id}
              title={`வார்டு ${ward.ward_number}`}
              meta={[ward.name_ta, ward.name_en ?? null].filter(Boolean).join(" · ")}
              active={ward.is_active}
              canToggle={canManageGlobal}
              onToggle={() => mutateToggle(mutation, "toggle-ward", ward.id, ward.is_active)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="வகைகள்" helper="Complaint taxonomy" action={canManageGlobal ? renderCategoryForm(mutation) : null}>
        <div className="grid gap-2">
          {data.categories.map((category) => (
            <MasterRow
              key={category.id}
              title={category.name_ta}
              meta={category.slug}
              active={category.is_active}
              canToggle={canManageGlobal}
              onToggle={() => mutateToggle(mutation, "toggle-category", category.id, category.is_active)}
            />
          ))}
        </div>
      </SectionCard>

      {canManageGlobal ? (
        <>
          <SectionCard title="பகுதிகள் / POCs" helper="Area points of contact" action={renderPocForm(mutation, data.wards)}>
            <div className="grid gap-2">
              {data.pocs.map((poc) => (
                <MasterRow
                  key={poc.id}
                  title={poc.name}
                  meta={`${poc.area_name}${poc.ward_number ? ` · Ward ${poc.ward_number}` : ""} · ${poc.phone}`}
                  active={poc.is_active}
                  canToggle
                  onToggle={() => mutateToggle(mutation, "toggle-poc", poc.id, poc.is_active)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="அறிவிப்புகள்" helper="Public updates" action={renderAnnouncementForm(mutation)}>
            <div className="grid gap-2">
              {data.announcements.map((announcement) => (
                <MasterRow
                  key={announcement.id}
                  title={announcement.title_ta}
                  meta={announcement.published_at ?? announcement.created_at}
                  active={announcement.is_active}
                  canToggle
                  onToggle={() => mutateToggle(mutation, "toggle-announcement", announcement.id, announcement.is_active)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="பேனர்கள்" helper="Homepage banners" action={renderBannerForm(mutation)}>
            <div className="grid gap-2">
              {data.banners.map((banner) => (
                <MasterRow
                  key={banner.id}
                  title={banner.title_ta}
                  meta={banner.link_url ?? banner.image_path ?? "Banner"}
                  active={banner.is_active}
                  canToggle
                  onToggle={() => mutateToggle(mutation, "toggle-banner", banner.id, banner.is_active)}
                />
              ))}
            </div>
          </SectionCard>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>உலகளாவிய அமைப்புகள்</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">வகைகள், POC, அறிவிப்புகள் மற்றும் பேனர்களை நிர்வகிக்க SUPER_ADMIN அனுமதி தேவை.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function renderUserForm(mutation: FormMutation, wards: AdminMasterData["wards"]) {
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => handleSubmit(event, mutation, "create-user")}>
      <Input name="username" placeholder="Username" required />
      <Input name="password" type="password" placeholder="Password" required />
      <Input name="full_name" placeholder="Full name" required />
      <Input name="phone" placeholder="Mobile number" />
      <select name="role" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        <option value="">Role</option>
        {Object.values(UserRole).map((role) => (
          <option key={role} value={role}>
            {userRoleTamil[role]}
          </option>
        ))}
      </select>
      <select name="ward_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        <option value="">Ward (optional for SUPER_ADMIN)</option>
        {wards.map((ward) => (
          <option key={ward.id} value={ward.id}>
            Ward {ward.ward_number}
          </option>
        ))}
      </select>
      <select name="is_active" className="h-10 w-full rounded-md border bg-background px-3 text-sm md:col-span-2">
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      <div className="md:col-span-2">
        <p className="text-xs leading-5 text-muted-foreground">
          Username + password hash public.users-இல் சேமிக்கப்படும். இதுவே admin login-க்கு பயன்படும்.
        </p>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          பயனரைச் சேர்க்கவும்
        </Button>
      </div>
    </form>
  );
}

function SectionCard({
  title,
  helper,
  action,
  children,
}: {
  title: string;
  helper?: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        {helper ? <p className="text-sm text-muted-foreground">{helper}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {action}
        {children}
      </CardContent>
    </Card>
  );
}

function renderWardForm(mutation: FormMutation) {
  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => handleSubmit(event, mutation, "create-ward")}>
      <Input name="ward_number" type="number" min={1} placeholder="Ward No" required />
      <Input name="name_ta" placeholder="Ward name in Tamil" required />
      <Input name="name_en" placeholder="Ward name in English" />
      <div className="md:col-span-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          சேர்க்கவும்
        </Button>
      </div>
    </form>
  );
}

function renderCategoryForm(mutation: FormMutation) {
  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => handleSubmit(event, mutation, "create-category")}>
      <Input name="name_ta" placeholder="வகை பெயர்" required />
      <Input name="name_en" placeholder="English name" />
      <Input name="slug" placeholder="slug" required />
      <div className="md:col-span-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          சேர்க்கவும்
        </Button>
      </div>
    </form>
  );
}

function renderPocForm(mutation: FormMutation, wards: AdminMasterData["wards"]) {
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => handleSubmit(event, mutation, "create-poc")}>
      <select name="ward_id" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        <option value="">வார்டை தேர்வு செய்யவும்</option>
        {wards.map((ward) => (
          <option key={ward.id} value={ward.id}>
            வார்டு {ward.ward_number}
          </option>
        ))}
      </select>
      <Input name="name" placeholder="Name" required />
      <Input name="phone" placeholder="Phone" required />
      <Input name="area_name" placeholder="Area" required />
      <div className="md:col-span-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          சேர்க்கவும்
        </Button>
      </div>
    </form>
  );
}

function renderAnnouncementForm(mutation: FormMutation) {
  return (
    <form className="grid gap-3" onSubmit={(event) => handleSubmit(event, mutation, "create-announcement")}>
      <Input name="title_ta" placeholder="Title" required />
      <Textarea name="body_ta" placeholder="Body" required />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        சேர்க்கவும்
      </Button>
    </form>
  );
}

function renderBannerForm(mutation: FormMutation) {
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => handleSubmit(event, mutation, "create-banner")}>
      <Input name="title_ta" placeholder="Title" required />
      <Input name="image_path" placeholder="Image path" />
      <Input name="link_url" placeholder="Link URL" />
      <div className="md:col-span-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          சேர்க்கவும்
        </Button>
      </div>
    </form>
  );
}

function handleSubmit(event: FormEvent<HTMLFormElement>, mutation: FormMutation, action: MasterActionType) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  mutation.mutate({ action, formData });
  event.currentTarget.reset();
}

function mutateToggle(mutation: FormMutation, action: MasterActionType, id: string, currentActive: boolean) {
  const formData = new FormData();
  formData.set("id", id);
  formData.set("is_active", String(!currentActive));
  mutation.mutate({ action, formData });
}

function MasterRow({
  title,
  meta,
  active,
  canToggle,
  onToggle,
}: {
  title: string;
  meta: string;
  active: boolean;
  canToggle: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{meta}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={active ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-muted-foreground"}>
          {active ? "Active" : "Inactive"}
        </span>
        {canToggle ? (
          <Button type="button" variant="outline" size="sm" onClick={onToggle}>
            <RefreshCcw className="size-4" />
            Toggle
          </Button>
        ) : null}
      </div>
    </div>
  );
}
