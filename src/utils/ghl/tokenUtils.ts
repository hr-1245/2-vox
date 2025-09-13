// // utils/ghl/tokenUtils.ts


// export const tokenContent = async (): Promise<string> => {
//   const res = await fetch(`/api/token/userId`);
// console.log("res........................",res)
//   if (!res.ok) throw new Error("Failed to fetch email");
// //   const data = await res.json();
//   const data = await res.json();
  


  
//   return data;/\
// };
// utils/ghl/clientToken.ts
// utils/ghl/clientToken.ts
'use client';

export async function getClientGhlToken(): Promise<string> {
  try {
    const response = await fetch('/api/token/userId', {
      credentials: 'include', // Important for authentication cookies
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch token: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.token) {
      throw new Error('No token received from server');
    }

    return data.token;

  } catch (error) {
    console.error('Failed to get client GHL token:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('re-authenticate')) {
        throw new Error('Please reconnect your GoHighLevel account to continue sending messages.');
      }
    }
    
    throw new Error('Failed to get authentication token. Please try again.');
  }
}