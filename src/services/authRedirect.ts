const REDIRECT_KEY = "brain_auth_redirect";

const canUseWindow = () => typeof window !== "undefined";

export const storeAuthRedirect = (url?: string) => {
  if (!canUseWindow()) return;

  const redirectUrl = url || window.location.href;

  window.localStorage.setItem(REDIRECT_KEY, redirectUrl);
};

export const getStoredAuthRedirect = () => {
  if (!canUseWindow()) return null;

  const redirectUrl = window.localStorage.getItem(REDIRECT_KEY);
  if (!redirectUrl) return null;

  try {
    const parsedUrl = new URL(redirectUrl, window.location.origin);
    if (parsedUrl.origin !== window.location.origin) return null;

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return redirectUrl.startsWith("/") ? redirectUrl : null;
  }
};

export const consumeAuthRedirect = () => {
  const redirectUrl = getStoredAuthRedirect();

  if (canUseWindow()) {
    window.localStorage.removeItem(REDIRECT_KEY);
  }

  return redirectUrl;
};
