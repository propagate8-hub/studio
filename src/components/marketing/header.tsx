"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MarketingHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center">
            <Image 
              src="/logo.svg" 
              alt="Propagate Digital Logo" 
              width={400} 
              height={100} 
              className="h-10 w-auto object-contain" 
              priority
            />
          </Link>
          <nav className="hidden gap-6 text-sm md:flex items-center">
            <Link
              href="/"
              className="font-medium text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Home
            </Link>
            <Link
              href="/contact"
              className="font-medium text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Contact
            </Link>
            <Link
              href="/buy-acet"
              className="font-medium text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Buy ACET
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button asChild>
            <Link href="/portal/login">Portal Login</Link>
          </Button>
          {mounted && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="flex items-center mb-4">
                    <Image 
                      src="/logo.svg" 
                      alt="Propagate Digital Logo" 
                      width={200} 
                      height={50} 
                      className="h-8 w-auto object-contain" 
                    />
                  </Link>
                  <Link
                    href="/"
                    className="block px-2 py-1 text-lg border-b"
                  >
                    Home
                  </Link>
                  <Link
                    href="/contact"
                    className="block px-2 py-1 text-lg border-b"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/buy-acet"
                    className="block px-2 py-1 text-lg border-b"
                  >
                    Buy ACET
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
