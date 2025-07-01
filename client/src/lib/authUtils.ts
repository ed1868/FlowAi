// Mobile-friendly authentication utilities

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Mobile-optimized test login function with improved session handling
export async function performTestLogin(): Promise<boolean> {
  try {
    const mobile = isMobile();
    
    // Use direct server-side redirect for mobile to ensure proper session handling
    if (mobile) {
      // Direct server redirect - most reliable for mobile
      window.location.href = '/api/test-login';
      return true;
    } else {
      // Desktop handling with JSON response
      const response = await fetch('/api/test-login', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          window.location.href = data.redirect || '/';
          return true;
        }
      }
    }
    
    // Fallback - direct navigation
    window.location.href = '/api/test-login';
    return false;
  } catch (error) {
    console.error('Test login error:', error);
    // Fallback - direct navigation
    window.location.href = '/api/test-login';
    return false;
  }
}

// Enhanced login function for forms with mobile-specific handling
export async function performLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const mobile = isMobile();
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      // For mobile, wait a bit then use location.replace for better session handling
      if (mobile) {
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      } else {
        window.location.href = '/';
      }
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error occurred' };
  }
}