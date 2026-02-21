"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Fingerprint, Tags, UserCheck, Search, AlertCircle } from "lucide-react";
import { aiIdentityRecordSuggester } from "@/ai/flows/ai-identity-record-suggester";
import type { IdentityRecord, AIIdentityRecordSuggesterOutput } from "@/lib/types";

// Mock data for existing identity records
const mockIdentityRecords: IdentityRecord[] = [
  { identity_id: 'rec_001', user_id: 'usr_101', rfid_tag: '12345-ABCDE', biometric_hash: 'hash_xyz_123', status: 'active' },
  { identity_id: 'rec_002', user_id: 'usr_102', rfid_tag: '67890-FGHIJ', status: 'active' },
  { identity_id: 'rec_003', user_id: 'usr_103', biometric_hash: 'hash_abc_456', status: 'active' },
];

const formSchema = z.object({
  rfidTag: z.string().optional(),
  biometricFile: z.any().optional(),
}).refine(data => data.rfidTag || data.biometricFile, {
  message: "Either an RFID tag or a biometric file is required.",
  path: ["rfidTag"],
});

export function IdentityMatcher() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIIdentityRecordSuggesterOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    
    let biometricData: string | undefined;
    if (values.biometricFile && values.biometricFile.length > 0) {
      biometricData = await fileToBase64(values.biometricFile[0]);
    }

    try {
      const suggestion = await aiIdentityRecordSuggester({
        rfidTag: values.rfidTag,
        biometricData,
        currentIdentityRecords: mockIdentityRecords,
      });
      setResult(suggestion);
      toast({ title: "Analysis Complete", description: "AI suggestion is ready." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "An Error Occurred", description: "Could not get AI suggestion." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI Identity Matcher</CardTitle>
          <CardDescription>Provide an RFID tag or biometric data to find a matching student record.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rfidTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFID Tag</FormLabel>
                    <div className="relative">
                       <Tags className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <FormControl>
                        <Input placeholder="e.g., 12345-ABCDE" {...field} className="pl-9" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-center text-sm text-muted-foreground">OR</div>
              <FormField
                control={form.control}
                name="biometricFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biometric Data (Image)</FormLabel>
                     <div className="relative">
                       <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <FormControl>
                          <Input type="file" accept="image/*" {...form.register('biometricFile')} className="pl-9 pt-2"/>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4"/>}
                Find Match
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggestion Result</CardTitle>
          <CardDescription>The AI's best guess based on the provided data.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
             <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}
          {!loading && !result && (
              <div className="text-center text-muted-foreground py-8">
                Submit data to see a suggestion.
              </div>
          )}
          {!loading && result && result.suggestedRecord && (
            <Alert variant={result.confidenceScore && result.confidenceScore > 0.8 ? "default" : "destructive"}>
                <UserCheck className="h-4 w-4" />
                <AlertTitle>Match Found!</AlertTitle>
                <AlertDescription>
                    <div className="space-y-2 mt-2">
                        <p><strong>User ID:</strong> {result.suggestedRecord.user_id}</p>
                        <p><strong>Identity ID:</strong> {result.suggestedRecord.identity_id}</p>
                        <p><strong>Status:</strong> <span className="capitalize">{result.suggestedRecord.status}</span></p>
                        <p><strong>Confidence:</strong> {result.confidenceScore ? (Math.round(result.confidenceScore * 100)) : 'N/A'}%</p>
                        <p className="mt-2 pt-2 border-t"><strong>Reasoning:</strong> {result.reasoning}</p>
                    </div>
                </AlertDescription>
            </Alert>
          )}
           {!loading && result && !result.suggestedRecord && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Confident Match Found</AlertTitle>
                <AlertDescription>
                    <p className="mt-2">{result.reasoning}</p>
                </AlertDescription>
            </Alert>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
