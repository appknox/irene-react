import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { PartnerEndpoints, PartnerService } from '@irene/api/services/partner';
import { storeSession } from '@irene/api/utils/session';
import { buildPartner, buildSession } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const ORGANIZATION_ID = 42;

const partnerUrl = buildAPITestURL(PartnerEndpoints.detail(ORGANIZATION_ID));

describe('PartnerService.getPartner', () => {
  it('reads what the partner organization is allowed to do', async () => {
    storeSession(buildSession());

    const partner = buildPartner({ access: { view_analytics: true } });

    server.use(http.get(partnerUrl, () => HttpResponse.json(partner)));

    await expect(PartnerService.getPartner(ORGANIZATION_ID)).resolves.toEqual(partner);
  });
});
