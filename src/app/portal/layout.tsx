import { AuthProvider } from "@/components/providers/auth-provider";
import { SidebarNav } from "@/components/portal/sidebar-nav";
import { UserNav } from "@/components/portal/user-nav";
import { SyncManager } from "@/components/sync-manager";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-sidebar md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                <Image src="/logo.svg" alt="Propagate8 Digital Logo" width={32} height={32} />
                <span className="font-headline">Propagate8 Portal</span>
              </Link>
            </div>
            <div className="flex-1">
              <SidebarNav />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col bg-sidebar text-sidebar-foreground p-0">
                 <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                        <Image src="/logo.svg" alt="Propagate8 Digital Logo" width={24} height={24} />
                        <span className="font-headline">Propagate8 Portal</span>
                    </Link>
                </div>
                <SidebarNav />
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              {/* Optional: Add search bar or other header content here */}
            </div>
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
      <SyncManager />
    </AuthProvider>
  );
}
