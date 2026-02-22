import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Fingerprint, Users, FileEdit, ShieldCheck, WifiOff } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

const services = [
  {
    icon: <BookOpen className="h-16 w-16 text-primary" />,
    title: "Aptitude and Career Exploration Test (ACET)",
    description: "Standardized, offline-first aptitude and career exploration testing for accurate student evaluation.",
  },
  {
    icon: <Fingerprint className="h-16 w-16 text-primary" />,
    title: "Identity Management",
    description: "Secure and efficient student identification using biometrics and RFID, powered by AI.",
  },
  {
    icon: <Users className="h-16 w-16 text-primary" />,
    title: "School Growth Audit",
    description: "Gather 360-degree feedback from parents, students, and teachers with our dynamic survey tools.",
  },
  {
    icon: <FileEdit className="h-16 w-16 text-primary" />,
    title: "Custom Assessments",
    description: "Tailor-made assessment solutions to meet your institution's unique requirements.",
  },
];

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 bg-secondary/50">
          {heroImage && (
             <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover z-0 opacity-10"
                priority
                data-ai-hint={heroImage.imageHint}
             />
          )}
          <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-primary">
                Tailored Data Driven Solutions for the Educational Sector.
              </h1>
              <p className="mt-6 text-lg text-foreground/80 md:text-xl">
                Propagate Digital is a comprehensive EdTech solution for modern schools, offering offline testing, secure identity management, and insightful stakeholder feedback.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="font-bold">
                  <Link href="/contact">Request a Demo</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="font-bold">
                  <Link href="/portal/login">Client Portal</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                 <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">Key Features</div>
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">Why Choose Propagate Digital?</h2>
                <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is built to address the core challenges of modern education with robust, reliable, and intelligent tools.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <Card className="bg-card/50 border-0 shadow-none">
                <CardHeader className="items-center text-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <WifiOff className="h-8 w-8 text-primary"/>
                    </div>
                  <CardTitle className="font-headline mt-2">Offline-First Testing</CardTitle>
                  <CardDescription>Conduct assessments anywhere, anytime, without worrying about internet connectivity. Results sync automatically when back online.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 border-0 shadow-none">
                 <CardHeader className="items-center text-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <ShieldCheck className="h-8 w-8 text-primary"/>
                    </div>
                   <CardTitle className="font-headline mt-2">AI-Powered Identity</CardTitle>
                   <CardDescription>Leverage AI to accurately verify and match student identities using biometrics or RFID, eliminating errors and fraud.</CardDescription>
                 </CardHeader>
              </Card>
              <Card className="bg-card/50 border-0 shadow-none">
                <CardHeader className="items-center text-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <Users className="h-8 w-8 text-primary"/>
                    </div>
                  <CardTitle className="font-headline mt-2">360° Feedback Loop</CardTitle>
                  <CardDescription>Gain holistic insights into your school's climate and performance with our School Growth Audit tools.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl">Our Core Services</h2>
              <p className="mt-4 text-lg text-foreground/80 md:text-xl">
                A complete suite of tools for educational excellence.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <Card key={service.title} className="overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl text-center">
                  <CardHeader className="pt-8">
                    <div className="flex justify-center mb-4">
                        {service.icon}
                    </div>
                    <CardTitle className="font-headline">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl">Ready to Transform Your Institution?</h2>
                <p className="mt-4 text-lg text-foreground/80 md:text-xl">
                Join the growing number of schools leveraging Propagate Digital to drive academic excellence and operational efficiency.
                </p>
                <div className="mt-8">
                <Button asChild size="lg" className="font-bold">
                    <Link href="/contact">Get in Touch</Link>
                </Button>
                </div>
            </div>
          </div>
        </section>

      </main>
      <MarketingFooter />
    </div>
  );
}
