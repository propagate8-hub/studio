import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-secondary">
      <div className="container mx-auto px-6 py-12">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2">
            <Link
              href="/contact"
              className="mx-2 text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
              aria-label="Contact"
            >
              Contact Us
            </Link>
            <Link
              href="/buy-acet"
              className="mx-2 text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
              aria-label="Buy ACET"
            >
              Buy ACET Test
            </Link>
            <Link
              href="/portal/login"
              className="mx-2 text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
              aria-label="Portal Login"
            >
              Portal
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <div className="flex items-center justify-center gap-2">
                <BookOpenCheck className="h-6 w-6 text-primary" />
                <p className="text-center text-sm text-secondary-foreground/80">
                &copy; {new Date().getFullYear()} ACET Platform. All rights reserved.
                </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
