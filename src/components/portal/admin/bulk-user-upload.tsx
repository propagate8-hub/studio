'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

const REQUIRED_HEADERS = ['First Name', 'Last Name', 'Email', 'Role', 'Grade'];

export function BulkUserUpload() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidFile, setIsValidFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetState = () => {
    setFile(null);
    setValidationError(null);
    setIsValidFile(false);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv') {
      setValidationError('Invalid file type. Please upload a .csv file.');
      return;
    }

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const actualHeaders = results.meta.fields || [];
        const missingHeaders = REQUIRED_HEADERS.filter(
          (header) => !actualHeaders.includes(header)
        );

        if (missingHeaders.length > 0) {
          setValidationError(`File is missing required columns: ${missingHeaders.join(', ')}.`);
          setIsValidFile(false);
          return;
        }

        if (results.data.length === 0) {
            setValidationError('The CSV file is empty or contains only a header row.');
            setIsValidFile(false);
            return;
        }
        
        for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as any;
            if (!row.Email || !/^\S+@\S+\.\S+$/.test(row.Email)) {
                setValidationError(`Invalid email format found in row ${i + 2}. Please check your data.`);
                setIsValidFile(false);
                return;
            }
        }


        setValidationError(null);
        setIsValidFile(true);
        toast({
          title: 'File ready for upload',
          description: `Validated ${results.data.length} user records.`,
        });
      },
      error: (error) => {
        setValidationError(`Error parsing CSV file: ${error.message}`);
        setIsValidFile(false);
      },
    });
  };

  const handleUpload = async () => {
    if (!file || !isValidFile || !user || !user.school_id) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Cannot start upload. File is missing, invalid, or you are not properly authenticated.',
      });
      return;
    }

    setIsUploading(true);

    try {
        const taskId = `task_${user.user_id}_${Date.now()}`;
        
        await addDoc(collection(db, "Upload_Tasks"), {
            school_id: user.school_id,
            fileName: file.name,
            status: 'pending',
            progress: 0,
            createdAt: serverTimestamp(),
            userId: user.user_id,
        });

        const storageRef = ref(storage, `pending_uploads/${user.school_id}/${taskId}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                setIsUploading(false);
                setUploadProgress(0);
                toast({
                    variant: 'destructive',
                    title: 'File Upload Failed',
                    description: 'An error occurred while uploading the file to storage.',
                });
            },
            async () => {
                setIsUploading(false);
                toast({
                    title: 'Upload Successful!',
                    description: 'The file is now being processed on the server. This may take a few minutes.',
                });
                setTimeout(resetState, 5000);
            }
        );

    } catch (error) {
        console.error("Error creating upload task:", error);
        setIsUploading(false);
        toast({
            variant: 'destructive',
            title: 'Upload Error',
            description: 'Could not create an upload task in the database.',
        });
    }

  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk User Provisioning</CardTitle>
        <CardDescription>Upload a CSV file to create multiple student and teacher accounts at once.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
               <p>Your CSV file must contain the following columns in any order:</p>
               <code className="block bg-muted p-2 rounded-md my-2 text-sm font-mono">{REQUIRED_HEADERS.join(', ')}</code>
               <p>The 'Role' column must contain either 'Student' or 'Teacher'. The 'Grade' column can be empty for teachers.</p>
            </AlertDescription>
        </Alert>

        <div className="space-y-2">
            <label htmlFor="csv-upload" className="font-medium text-sm">Step 1: Select CSV File</label>
            <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} disabled={isUploading} />
        </div>

        {validationError && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
            </Alert>
        )}

        {isValidFile && !isUploading && (
             <Alert variant="default" className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-600" />
                <AlertTitle>File is Valid</AlertTitle>
                <AlertDescription>The CSV file structure is correct. You can now proceed to upload.</AlertDescription>
            </Alert>
        )}

        {isUploading && (
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium">Uploading <span className="font-normal text-muted-foreground">{file?.name}</span>...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
            </div>
        )}

      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleUpload} disabled={!isValidFile || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload and Process
        </Button>
      </CardFooter>
    </Card>
  );
}
