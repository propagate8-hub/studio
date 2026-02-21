import Link from "next/link";
import Image from "next/image";

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
              Buy ACET
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
                <Image src="/logo.svg" alt="Propagate Digital Logo" width={24} height={24} />
                <p className="text-center text-sm text-secondary-foreground/80">
                &copy; {new Date().getFullYear()} Propagate Digital. All rights reserved.
                </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
