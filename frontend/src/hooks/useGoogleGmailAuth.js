import { useCallback, useEffect, useRef, useState } from 'react';

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.metadata.readonly';
const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

function loadGsiScript() {
  if (document.querySelector(`script[src="${GSI_SCRIPT}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in.'));
    document.head.appendChild(script);
  });
}

export function useGoogleGmailAuth(clientId, requestedScope = GMAIL_SCOPE) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const tokenClientRef = useRef(null);
  const scope = requestedScope || GMAIL_SCOPE;

  useEffect(() => {
    if (!clientId) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.oauth2) {
          throw new Error('Google sign-in is unavailable.');
        }
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope,
          callback: () => {},
        });
        if (!cancelled) {
          setReady(true);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setReady(false);
          setError(err.message || 'Google sign-in failed to load.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, scope]);

  const requestAccessToken = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!clientId) {
        reject(new Error('Google OAuth client ID is not configured.'));
        return;
      }
      if (!tokenClientRef.current) {
        reject(new Error(error || 'Google sign-in is still loading.'));
        return;
      }

      tokenClientRef.current.callback = (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response.access_token) {
          reject(new Error('Google did not return an access token.'));
          return;
        }
        resolve(response.access_token);
      };

      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    });
  }, [clientId, error]);

  return { ready, error, requestAccessToken, scope };
}
