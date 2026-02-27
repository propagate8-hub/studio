"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export function MarketingFooter() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-secondary/10 border-t">
      <div className="container mx-auto px-6 py-12">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2">
            <Link
              href="/contact"
              className="mx-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              aria-label="Contact"
            >
              Contact Us
            </Link>
            <Link
              href="/buy-acet"
              className="mx-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              aria-label="Buy ACET"
            >
              Buy ACET
            </Link>
            <Link
              href="/portal/login"
              className="mx-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              aria-label="Portal Login"
            >
              Portal
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex flex-col items-center md:items-start gap-4">
                <Image 
                  src="/logo.png" 
                  alt="Propagate Digital Logo" 
                  width={200} 
                  height={50} 
                  className="h-10 w-auto object-contain mix-blend-multiply opacity-80 hover:opacity-100 transition-opacity" 
                />
                <p className="text-center md:text-left text-sm text-muted-foreground">
                &copy; {year || "..."} Propagate Digital. All rights reserved.
                </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
