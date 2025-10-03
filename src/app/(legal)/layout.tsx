import { BackButton } from "@/components/global/back-button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      <BackButton variant="ghost" className="fixed top-4 left-4 z-10" />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="[&_p]:text-foreground [&_a]:text-primary space-y-8 [&_a]:underline-offset-4 hover:[&_a]:underline [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:scroll-mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:scroll-mt-8 [&_h3]:text-xl [&_h3]:font-medium [&_h4]:mt-6 [&_h4]:mb-3 [&_h4]:scroll-mt-8 [&_h4]:text-lg [&_h4]:font-medium [&_li]:my-2 [&_p]:mb-4 [&_p]:leading-7 [&_strong]:font-semibold [&_ul]:my-6 [&_ul]:space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}
