"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  registerOrUpdateDevice,
  getOrCreateDeviceId,
} from "@/lib/device-service";

export function DeviceSessionTracker() {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      hasRegistered.current = false;
      return;
    }

    const deviceId = getOrCreateDeviceId();

    // Register current active session
    registerOrUpdateDevice(db, user).then(() => {
      hasRegistered.current = true;
    });

    // Listen to current device doc to react to remote revocation in real-time
    const deviceRef = doc(db, "users", user.uid, "devices", deviceId);
    let isFirstEmission = true;

    const unsubscribe = onSnapshot(
      deviceRef,
      (snapshot) => {
        if (isFirstEmission) {
          isFirstEmission = false;
          return;
        }

        // If another device revoked this session
        if (!snapshot.exists() && hasRegistered.current) {
          hasRegistered.current = false;
          toast({
            variant: "destructive",
            title: "Sesi Berakhir",
            description: "Sesi login perangkat ini telah dikeluarkan dari perangkat lain.",
          });
          auth.signOut().then(() => {
            router.push("/login");
          });
        }
      },
      (err) => {
        console.warn("Device tracker listener error:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, db, auth, router, toast]);

  return null;
}
