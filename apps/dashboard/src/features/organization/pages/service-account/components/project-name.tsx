import { ENUMS } from '@irene/enums';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

interface ProjectNameProps {
  packageName: string;
  platform: number;
}

/**
 * A package under the mark of the platform it is built for.
 *
 * @param props.packageName - What the package is called.
 * @param props.platform - Which platform it is built for.
 */
export function ProjectName({ packageName, platform }: Readonly<ProjectNameProps>) {
  const isApple = platform === ENUMS.PLATFORM.IOS;

  return (
    <div className="flex min-w-0 items-center gap-2.75" data-test-service-account-project>
      <AkIcon
        name={isApple ? 'fa-brands:apple' : 'material-symbols:android'}
        size="1.2rem"
        className={isApple ? 'text-ios' : 'text-android'}
        aria-hidden
      />

      <AkTypography tag="span" noWrap title={packageName} className="min-w-0">
        {packageName}
      </AkTypography>
    </div>
  );
}
