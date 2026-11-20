import { useMutation, useQuery } from '@tanstack/react-query';

import { BillingService, type ApiInvoice } from '@irene/api/services/billing';
import { akMT, getIntl } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { invoicesOptions } from '@/features/billing/queries/billing';
import { formatBillingDate, hasPassed, isWebUrl } from '@/features/billing/utils';

import { BillingSection } from './billing-section';

/**
 * Downloads one invoice. The invoice's own link answers with a short-lived
 * link to the PDF, which the browser is then sent to.
 *
 * @param props.invoice - The invoice.
 */
function InvoiceDownload({ invoice }: Readonly<{ invoice: ApiInvoice }>) {
  const download = useMutation({
    mutationFn: () => BillingService.getInvoiceDownload(invoice.download_url),

    onSuccess: ({ url }) => {
      if (isWebUrl(url)) {
        window.location.href = url;
      } else {
        akNotify.error(akMT('somethingWentWrong'));
      }
    },

    onError: () => akNotify.error(akMT('somethingWentWrong')),
  });

  return (
    <AkButton
      type="button"
      variant="outlined"
      color="neutral"
      size="sm"
      loading={download.isPending}
      leftIcon={<AkIcon name="material-symbols:download" />}
      onClick={() => download.mutate()}
      data-test-invoice-download
    >
      {akMT('download')}
    </AkButton>
  );
}

/**
 * When an invoice was paid, or when it falls due while it is not. irene says
 * "Pending" for every unpaid one; the due date says how long is left.
 *
 * @param invoice - The invoice.
 * @returns The date to show.
 */
function _invoiceDate(invoice: ApiInvoice) {
  if (invoice.is_paid) {
    return formatBillingDate(invoice.paid_on);
  }

  const dueDate = formatBillingDate(invoice.due_date);

  return dueDate ? akMT('invoiceDueOn', { date: dueDate }) : akMT('pending');
}

/**
 * Whether an invoice is paid, unpaid, or unpaid past its due date.
 *
 * @param props.invoice - The invoice.
 */
function InvoiceStatus({ invoice }: Readonly<{ invoice: ApiInvoice }>) {
  if (invoice.is_paid) {
    return <AkChip variant="semi-filled" size="small" color="success" label={akMT('paid')} />;
  }

  return hasPassed(invoice.due_date) ? (
    <AkChip variant="semi-filled" size="small" color="error" label={akMT('invoiceOverdue')} />
  ) : (
    <AkChip variant="semi-filled" size="small" color="warn" label={akMT('unpaid')} />
  );
}

const invoiceColumn = createAkTableColumns<ApiInvoice>();

const INVOICE_COLUMNS = invoiceColumn.columns([
  invoiceColumn.accessor('invoice_id', {
    header: () => akMT('invoiceId'),
    cell: ({ getValue }) => (
      <AkTypography tag="span" className="font-mono">
        {getValue()}
      </AkTypography>
    ),
  }),

  invoiceColumn.accessor('plan_name', {
    header: () => akMT('planName'),
    cell: ({ getValue }) => (
      <AkTypography tag="span" title={getValue()} noWrap>
        {getValue()}
      </AkTypography>
    ),
  }),

  invoiceColumn.accessor('amount', {
    header: () => akMT('amountPaid'),
    cell: ({ getValue }) => (
      <AkTypography tag="span">
        {getIntl().formatNumber(Number(getValue()), { format: 'USD' })}
      </AkTypography>
    ),
  }),

  invoiceColumn.display({
    id: 'date',
    header: () => akMT('date'),
    cell: ({ row }) => (
      <AkTypography tag="span" noWrap>
        {_invoiceDate(row.original)}
      </AkTypography>
    ),
  }),

  invoiceColumn.display({
    id: 'status',
    header: () => akMT('status'),
    cell: ({ row }) => <InvoiceStatus invoice={row.original} />,
  }),

  invoiceColumn.display({
    id: 'download',
    header: () => akMT('invoice'),
    cell: ({ row }) => <InvoiceDownload invoice={row.original} />,
  }),
]);

/**
 * The organization's invoices, each with its PDF a click away. irene hides the
 * block until there is one; it says there are none instead, so an owner can
 * tell an empty history from a page that did not load.
 *
 * @param props.organizationId - The organization.
 */
export function InvoiceList({ organizationId }: Readonly<{ organizationId: string }>) {
  const invoices = useQuery(invoicesOptions(organizationId));

  if (!invoices.isSuccess) {
    return null;
  }

  return (
    <BillingSection title={akMT('invoices')}>
      {invoices.data.length === 0 ? (
        <div
          className="
            flex flex-col items-center gap-2.5 rounded-sm bg-background-subtle px-5.25 py-7
          "
          data-test-invoices-empty
        >
          <AkIcon name="material-symbols:receipt-long" className="size-6 text-foreground-muted" />

          <AkTypography color="textSecondary">{akMT('noInvoicesYet')}</AkTypography>
        </div>
      ) : (
        <AkTable
          columns={INVOICE_COLUMNS}
          data={invoices.data}
          dense
          borderColor="dark"
          caption={akMT('invoices')}
          getRowId={(invoice) => invoice.id}
        />
      )}
    </BillingSection>
  );
}
