"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "@/lib/db";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Wifi, WifiOff, UploadCloud, Loader2 } from "lucide-react";

export function SyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const pendingLogs = useLiveQuery(() => 
    localDb.assessment_logs.where('sync_status').equals('pending').toArray()
  , []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Set initial state
    if (typeof window !== "undefined" && typeof window.navigator !== "undefined") {
      setIsOnline(window.navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline || isSyncing || !pendingLogs || pendingLogs.length === 0) return;

    setIsSyncing(true);
    toast({
      title: "Syncing data...",
      description: `Uploading ${pendingLogs.length} pending records.`,
    });

    try {
      const batch = writeBatch(db);
      const logsToUpdateLocally: string[] = [];

      for (const log of pendingLogs) {
        // Use log_id from Dexie as document ID in Firestore for idempotency
        const docRef = doc(db, "Assessment_Logs", log.log_id);
        const firestoreLog = { ...log, sync_status: "synced" as const };
        batch.set(docRef, firestoreLog);
        logsToUpdateLocally.push(log.log_id);
      }

      await batch.commit();

      // Update local logs to 'synced'
      await localDb.assessment_logs.where('log_id').anyOf(logsToUpdateLocally).modify({ sync_status: 'synced' });

      toast({
        title: "Sync Complete!",
        description: `${pendingLogs.length} records have been successfully saved to the cloud.`,
      });
    } catch (error) {
      console.error("Sync failed:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not sync data. Will retry later.",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Trigger sync when online status changes to online or when component mounts and is online
  useEffect(() => {
    if (isOnline && pendingLogs && pendingLogs.length > 0) {
      handleSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingLogs]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
       <div className="flex items-center gap-2 rounded-full border bg-card/80 px-3 py-2 text-sm font-medium text-card-foreground shadow-lg backdrop-blur">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {pendingLogs && pendingLogs.length > 0 && (
            <>
                <span className="h-4 w-px bg-border"></span>
                {isSyncing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <UploadCloud className="h-5 w-5" />
                )}
                <span>{pendingLogs.length} pending</span>
            </>
          )}
       </div>
    </div>
  );
}
