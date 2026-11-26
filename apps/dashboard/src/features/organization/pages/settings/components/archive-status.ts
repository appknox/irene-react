import dayjs from 'dayjs';
import type { ApiOrganizationArchive } from '@irene/api/services/organization';

/**
 * Where an export stands.
 *
 * Expiry is read before progress, so an export whose file has gone never reads
 * as ready — which is the order irene reads them in.
 *
 * @param archive - The export to place.
 * @returns Which of the four states it is in.
 */
export function archiveStatus(archive: ApiOrganizationArchive) {
  if (dayjs().isAfter(archive.available_until)) {
    return 'expired';
  }

  if (archive.progress_percent < 100) {
    return 'inProgress';
  }

  return archive.progress_percent === 100 ? 'available' : 'errored';
}
