"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { useToast } from "@/hooks/use-toast";
import { Mail, Building, User } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  schoolName: z.string().min(2, {
    message: "School name must be at least 2 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

export default function ContactPage() {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            schoolName: "",
            message: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        // In a real app, you'd send this to a backend/API
        console.log(values);
        toast({
            title: "Message Sent!",
            description: "Thank you for your inquiry. We will get back to you shortly.",
        });
        form.reset();
    }

    return (
        <div className="flex flex-col min-h-screen">
            <MarketingHeader />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h1 className="text-4xl font-headline font-bold text-primary sm:text-5xl">
                                Let's Connect
                            </h1>
                            <p className="text-lg text-foreground/80">
                                Have questions about how Propagate Digital can benefit your institution?
                                Fill out the form, and our team will get in touch to schedule a personalized demo.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-primary" />
                                    <a href="mailto:sales@propagate8.com" className="hover:underline">sales@propagate8.com</a>
                                </div>
                                 <div className="flex items-center gap-3">
                                    <Building className="h-5 w-5 text-primary" />
                                    <span>123 Education Lane, Knowledge City, 45678</span>
                                </div>
                            </div>
                        </div>

                        <Card className="shadow-2xl bg-card">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">B2B Inquiry Form</CardTitle>
                                <CardDescription>For schools and institutions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Your Name</FormLabel>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} className="pl-9" />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email Address</FormLabel>
                                                      <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input placeholder="you@yourcompany.com" {...field} className="pl-9" />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="schoolName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>School/Institution Name</FormLabel>
                                                    <div className="relative">
                                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <FormControl>
                                                            <Input placeholder="Springfield University" {...field} className="pl-9" />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Your Message</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Tell us how we can help..." {...field} rows={5} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full font-bold">Submit Inquiry</Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <MarketingFooter />
        </div>
    );
}
