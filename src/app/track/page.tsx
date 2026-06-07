import { TrackComplaintForm } from "@/components/complaints/track-complaint-form";

export const metadata = {
  title: "நிலை அறிய",
};

export default function TrackPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">புகார் நிலை அறிய</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          கண்காணிப்பு எண் மற்றும் பதிவு செய்த மொபைல் எண்ணை உள்ளிடுங்கள்.
        </p>
      </div>
      <TrackComplaintForm />
    </section>
  );
}
