import { Fragment, useMemo, type ComponentProps } from 'react';
import { useStore } from 'zustand';

import {
  AkMenu,
  AkMenuContent,
  AkMenuItem,
  AkMenuSeparator,
  AkMenuTrigger,
} from '@irene/ui/ak-menu';

import { configurationStore } from '@irene/api/stores/configuration';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import type { IconName } from '@irene/ui/icons/sets';

import { useLogout } from '@/features/auth/hooks/use-logout';
import { toggleFreshchat } from '@/scripts/freshchat';

interface ProfileMenuProps {
  username: string;
  email: string;
}

/** One row of the account's menu. A row with no `onSelect` states something rather than acting. */
interface ProfileMenuItem {
  id: string;
  label: string;
  icon: IconName;
  onSelect?: () => void;
  color?: ComponentProps<typeof AkMenuItem>['color'];
  hasSeperator?: boolean;
}

/**
 * The account's own menu: who is signed in, how to reach support, how to leave.
 *
 * @param props.username - The name the account signs in with.
 * @param props.email - The address it signs in with.
 */
export function ProfileMenu({ username, email }: Readonly<ProfileMenuProps>) {
  const logout = useLogout();
  const hasChatSupport = useStore(configurationStore, (config) => Boolean(config.freshchatKey()));

  const items: Array<ProfileMenuItem | false> = useMemo(
    () => [
      { id: 'username', label: username, icon: 'material-symbols:account-circle' },
      { id: 'email', label: email, icon: 'material-symbols:mail' },

      hasChatSupport && {
        id: 'support',
        label: akMT('support'),
        icon: 'material-symbols:support',
        onSelect: toggleFreshchat,
        hasSeperator: true,
      },

      {
        id: 'logout',
        label: akMT('logout'),
        icon: 'material-symbols:logout',
        color: 'primary',
        onSelect: logout.mutate,
      },
    ],
    [username, email, hasChatSupport, logout]
  );

  const menuItems = items.filter((item) => item !== false);

  return (
    <AkMenu>
      <AkMenuTrigger asChild>
        <AkButton
          variant="text"
          color="textPrimary"
          aria-label={username}
          className="
            min-w-20 px-2.5 py-1.25 no-underline
            hover:no-underline
            focus-visible:no-underline
          "
          leftIcon={<AkIcon name="material-symbols:account-circle" className="size-5.25" />}
          rightIcon={<AkIcon name="material-symbols:arrow-drop-down" className="size-5.25" />}
          data-test-top-nav-profile
        >
          <AkTypography>{username}</AkTypography>
        </AkButton>
      </AkMenuTrigger>

      {/* 11px clears the arrow, which is the 0.8em irene puts between the two. */}
      <AkMenuContent arrow sideOffset={0}>
        {menuItems.map((item) => (
          <Fragment key={item.id}>
            <AkMenuItem
              color={item.color}
              onSelect={item.onSelect}
              data-test-profile-item={item.id}
            >
              <AkIcon name={item.icon} className="size-5.25" />

              <AkTypography>{item.label}</AkTypography>
            </AkMenuItem>

            {item.hasSeperator && <AkMenuSeparator />}
          </Fragment>
        ))}
      </AkMenuContent>
    </AkMenu>
  );
}
