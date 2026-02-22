import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FileText, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function B2CDashboard() {
  // Mock data - in a real app, this would be fetched from Firestore
  const purchasedTests = [
    {
      id: "acet-001",
      title: "Aptitude and Career Exploration Test (ACET)",
      status: "Not Started",
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-headline font-semibold">My Dashboard</h1>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>My Assessments</CardTitle>
            <CardDescription>
              Here are the assessments you have purchased.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchasedTests.length > 0 ? (
              <div className="space-y-4">
                {purchasedTests.map((test) => (
                  <Card key={test.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{test.title}</h3>
                        <p className="text-sm text-muted-foreground">Status: {test.status}</p>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href="/portal/test-engine">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Test
                      </Link>
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">You haven't purchased any tests yet.</p>
                <Button asChild variant="link">
                  <Link href="/buy-acet">Buy the ACET Test</Link>
                </Button>
              </div>
            )}
          </CardContent>
           <CardFooter className="border-t pt-6">
             <p className="text-sm text-muted-foreground">
                Finished a test? Your results will appear in a 'Results' tab here.
             </p>
           </CardFooter>
        </Card>
      </div>
    </>
  );
}
