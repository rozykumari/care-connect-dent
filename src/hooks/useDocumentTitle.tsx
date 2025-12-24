import { useEffect } from "react";

const APP_NAME = "DentaCare";

/**
 * Custom hook to update document title
 * @param title - Page-specific title (will be appended with app name)
 * @param restoreOnUnmount - Whether to restore previous title on unmount
 */
export const useDocumentTitle = (title?: string, restoreOnUnmount = true) => {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
    
    document.title = fullTitle;

    return () => {
      if (restoreOnUnmount) {
        document.title = previousTitle;
      }
    };
  }, [title, restoreOnUnmount]);
};
