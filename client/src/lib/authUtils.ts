// Mobile-friendly authentication utilities

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Mobile-optimized test login function
export async function performTestLogin(): Promise<boolean> {
  try {
    const mobile = isMobile();
    
    // For mobile, use a simpler approach that avoids potential timing issues
    if (mobile) {
      // First, try the simple redirect approach for mobile
      const response = await fetch('/api/test-login', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Force a full page reload to ensure session is properly set
          window.location.replace('/');
          return true;
        }
      }
    } else {
      // Desktop handling
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

// Enhanced login function for forms
export async function performLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      // For mobile, use replace to avoid navigation issues
      if (isMobile()) {
        window.location.replace('/');
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