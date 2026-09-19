/** Where each protocol's identity provider returns the user to. */
const SSO_RETURN_PATHS = {
  saml: '/saml2/redirect' as const,
  oidc: '/sso/oidc/redirect' as const,
};

/**
 * Builds the absolute URL an identity provider sends the user back to. It has
 * to be absolute: the provider is a different origin, and the path alone would
 * resolve against theirs.
 *
 * @param protocol - Which provider is being used.
 * @returns The absolute return URL on this deployment.
 */
export const getSSOReturnUrl = <T extends keyof typeof SSO_RETURN_PATHS>(protocol: T) =>
  `${window.location.origin}${SSO_RETURN_PATHS[protocol]}` as const;
