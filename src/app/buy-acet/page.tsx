"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { CheckCircle, CreditCard } from "lucide-react";
import usePaystack from "@/hooks/use-paystack";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const acetImage = PlaceHolderImages.find(img => img.id === 'service-acet');

// This would typically come from your backend or env variables
const ACET_TEST_PRICE = 5000; // in kobo (e.g., 5000 kobo = 50 NGN)

export default function BuyAcetPage() {
    const { toast } = useToast();

    // A mock user email. In a real app, this would come from the logged-in user context.
    const userEmail = "test-b2c-user@example.com";

    const paystackConfig = {
        reference: new Date().getTime().toString(),
        email: userEmail,
        amount: ACET_TEST_PRICE,
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    };
    
    const onSuccess = (reference: any) => {
        // Here you would call your backend to verify the transaction
        // and update the user's record in Firestore.
        console.log("Payment Successful. Reference: ", reference);
        toast({
            title: "Payment Successful!",
            description: "Your ACET test has been unlocked. You can now proceed to your dashboard.",
        });
        // Redirect to B2C dashboard
        // window.location.href = '/portal/b2c/dashboard';
    };

    const onClose = () => {
        console.log('Payment dialog closed.');
    };

    const initializePayment = usePaystack(paystackConfig, onSuccess, onClose);

    return (
        <div className="flex flex-col min-h-screen bg-secondary/30">
            <MarketingHeader />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="mx-auto max-w-3xl">
                        <Card className="shadow-2xl">
                            <CardHeader className="text-center space-y-4 pt-10">
                                {acetImage && <Image src={acetImage.imageUrl} alt="ACET Test" width={120} height={80} className="mx-auto rounded-lg" data-ai-hint={acetImage.imageHint}/>}
                                <CardTitle className="font-headline text-3xl md:text-4xl text-primary">Unlock Your Potential with the Aptitude and Career Exploration Test</CardTitle>
                                <p className="text-muted-foreground text-lg">
                                    Purchase your personal Aptitude and Career Exploration Test (ACET) and gain valuable insights into your abilities.
                                </p>
                            </CardHeader>
                            <CardContent className="mt-6">
                               <div className="space-y-4 text-foreground/90">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-accent mt-1 shrink-0" />
                                        <span>Comprehensive evaluation of cognitive and academic skills.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-accent mt-1 shrink-0" />
                                        <span>Instant access to the test engine after purchase.</span>
                                    </div>
                                     <div className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-accent mt-1 shrink-0" />
                                        <span>Detailed performance report upon completion.</span>
                                    </div>
                                     <div className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-accent mt-1 shrink-0" />
                                        <span>Secure payment processing via Paystack.</span>
                                    </div>
                               </div>

                               <div className="mt-8 text-center">
                                    <p className="text-sm text-muted-foreground">One-time payment</p>
                                    <p className="font-bold text-5xl font-headline text-primary">
                                        &#x20A6;{new Intl.NumberFormat('en-NG').format(ACET_TEST_PRICE / 100)}
                                    </p>
                               </div>

                            </CardContent>
                            <CardFooter>
                                <Button size="lg" className="w-full font-bold text-lg" onClick={() => initializePayment()}>
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Pay Now & Start Test
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>
            <MarketingFooter />
        </div>
    );
}
