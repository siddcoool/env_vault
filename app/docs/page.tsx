import Link from "next/link";
import { Database } from "lucide-react";
import { DocsPanel } from "@/components/DocsPanel";
import { Button } from "@/components/ui/button";
import { getDocsClientScripts } from "@/lib/docs-scripts";

export const metadata = {
  title: "Docs · EnvVault",
  description: "Set up EnvVault locally and connect your apps",
};

export default function DocsPage() {
  const scripts = getDocsClientScripts();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
        <Link href="/login" className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <span className="text-lg font-semibold">EnvVault</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/register">Create account</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1">
        <DocsPanel scripts={scripts} />
      </main>
    </div>
  );
}
