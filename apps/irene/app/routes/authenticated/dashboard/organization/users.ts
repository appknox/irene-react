import AkBreadcrumbsRoute from 'irene/utils/ak-breadcrumbs-route';
import { ScrollToTop } from 'irene/utils/scroll-to-top';

export interface OrganizationMembersRouteQueryParams {
  user_limit: number;
  user_offset: number;
  user_query: string;
  show_inactive_user: boolean;
  invite_limit: number;
  invite_offset: number;
}

export default class AuthenticatedOrganizationMembersRoute extends ScrollToTop(
  AkBreadcrumbsRoute
) {}
