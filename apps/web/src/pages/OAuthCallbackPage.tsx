import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (code) {
      // Send the code to the parent window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GMAIL_AUTH_SUCCESS', code },
          window.location.origin
        );
        setStatus('success');
        setMessage('Authorization successful! This window will close automatically.');
        
        // Close the window after a short delay
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Unable to communicate with the parent window. Please close this window and try again.');
      }
    } else {
      setStatus('error');
      setMessage('No authorization code received.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-sky-500 animate-spin mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing</h1>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-500 mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
