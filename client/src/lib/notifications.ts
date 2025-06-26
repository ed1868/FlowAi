export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const showNotification = (
  title: string,
  body: string,
  redirectUrl?: string
): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'flow-productivity',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
    });

    if (redirectUrl) {
      notification.onclick = () => {
        window.focus();
        window.location.href = redirectUrl;
        notification.close();
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

export const scheduleNotification = (
  title: string,
  body: string,
  delayMs: number,
  redirectUrl?: string
): NodeJS.Timeout => {
  return setTimeout(() => {
    showNotification(title, body, redirectUrl);
  }, delayMs);
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  return Notification.permission;
};
