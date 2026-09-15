/** What v2/sso/check returns for an email. */
export interface SsoCheck {
  is_saml: boolean;
  is_sso_enforced: boolean;
  is_oidc: boolean;
  token: string;
}
