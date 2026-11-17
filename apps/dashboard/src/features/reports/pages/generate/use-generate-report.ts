import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ReportRequestService } from '@irene/api/services/report-request';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akNotify } from '@irene/ui/notify';

import {
  isReportRequestDone,
  reportRequestKeys,
  reportRequestOptions,
} from '@/features/reports/queries/report-requests';
import { getLunaErrorMessage } from '@/features/reports/utils';

/**
 * Asks Luna for a report and waits for it.
 *
 * The request is read every few seconds, as irene polls it, until Luna has
 * finished either way; then the report opens, where a failure or an
 * unanswerable question is explained. Cancel stops waiting here; Luna still
 * finishes the request.
 *
 * @returns generate, cancel, and whether a report is being generated.
 */
export function useGenerateReport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [requestId, setRequestId] = useState<number | null>(null);

  const create = useMutation({
    mutationFn: (query: string) => ReportRequestService.createReportRequest(query.trim()),
    onSuccess: (request) => {
      queryClient.setQueryData(reportRequestKeys.detail(request.id), request);
      setRequestId(request.id);
    },
    onError: unlessRateLimited((error) => {
      akNotify.error(getLunaErrorMessage(error));
    }),
  });

  const request = useQuery({ ...reportRequestOptions(requestId ?? 0), enabled: requestId !== null });
  const finished = request.data && isReportRequestDone(request.data) ? request.data : null;

  /* Opens the report once Luna has finished; this page goes away with the navigation. */
  useEffect(() => {
    if (requestId !== null && finished) {
      void navigate({
        to: '/dashboard/reports/preview/$reportRequestId',
        params: { reportRequestId: finished.id },
      });
    }
  }, [navigate, finished, requestId]);

  return {
    generate: (query: string) => create.mutate(query),
    cancel: () => setRequestId(null),
    isGenerating: create.isPending || requestId !== null,
  };
}
