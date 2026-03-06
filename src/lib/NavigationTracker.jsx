import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabaseClient";
import { pagesConfig } from "@/pages.config";

export default function NavigationTracker() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { Pages, mainPage } = pagesConfig;

  const mainPageKey = mainPage ?? Object.keys(Pages)[0];

  useEffect(() => {
    const logNavigation = async () => {
      const pathname = location.pathname;
      let pageName;

      if (pathname === "/" || pathname === "") {
        pageName = mainPageKey;
      } else {
        const pathSegment = pathname.replace(/^\//, "").split("/")[0];

        const pageKeys = Object.keys(Pages);

        const matchedKey = pageKeys.find(
          (key) => key.toLowerCase() === pathSegment.toLowerCase()
        );

        pageName = matchedKey || null;
      }

      if (isAuthenticated && pageName && user) {
        try {
          await supabase.from("user_activity_logs").insert([
            {
              user_id: user.id,
              page: pageName,
              path: location.pathname,
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (error) {
          console.error("Navigation logging failed:", error);
        }
      }
    };

    logNavigation();
  }, [location, isAuthenticated, user, Pages, mainPageKey]);

  return null;
}