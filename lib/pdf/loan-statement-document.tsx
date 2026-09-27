import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { formatPaymentNote } from "@/lib/payment-display";
import { getDirection } from "@/lib/locale";
import { getPdfFontFamily } from "@/lib/pdf/fonts";
import type { LoanStatementData } from "@/lib/pdf/types";

function createStyles(fontFamily: string, direction: "ltr" | "rtl") {
  return StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 10,
      padding: 40,
      color: "#111827",
      direction,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 10,
      color: "#6B7280",
    },
    section: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 8,
      color: "#374151",
    },
    metaRow: {
      flexDirection: direction === "rtl" ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 16,
    },
    metaBlock: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 9,
      color: "#6B7280",
      marginBottom: 2,
    },
    metaValue: {
      fontSize: 11,
      fontWeight: 700,
    },
    summaryGrid: {
      flexDirection: direction === "rtl" ? "row-reverse" : "row",
      flexWrap: "wrap",
      gap: 8,
    },
    summaryCard: {
      width: "48%",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 6,
      padding: 10,
      backgroundColor: "#F9FAFB",
    },
    summaryLabel: {
      fontSize: 9,
      color: "#6B7280",
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: 700,
    },
    description: {
      marginTop: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 6,
      backgroundColor: "#FFFFFF",
    },
    table: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 6,
      overflow: "hidden",
    },
    tableHeader: {
      flexDirection: direction === "rtl" ? "row-reverse" : "row",
      backgroundColor: "#F3F4F6",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    tableRow: {
      flexDirection: direction === "rtl" ? "row-reverse" : "row",
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    cellDate: {
      width: "28%",
      padding: 8,
    },
    cellAmount: {
      width: "22%",
      padding: 8,
    },
    cellNote: {
      width: "50%",
      padding: 8,
    },
    headerCell: {
      fontSize: 9,
      fontWeight: 700,
      color: "#374151",
    },
    bodyCell: {
      fontSize: 9,
      color: "#111827",
    },
    emptyPayments: {
      padding: 12,
      color: "#6B7280",
      fontSize: 9,
    },
    footer: {
      position: "absolute",
      left: 40,
      right: 40,
      bottom: 28,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingTop: 8,
    },
    disclaimer: {
      fontSize: 8,
      color: "#6B7280",
      lineHeight: 1.4,
    },
  });
}

export function LoanStatementDocument({ data }: { data: LoanStatementData }) {
  const { locale, labels } = data;
  const fontFamily = getPdfFontFamily(locale);
  const direction = getDirection(locale);
  const styles = createStyles(fontFamily, direction);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.subtitle}>
            {labels.generatedOn}: {formatDateTime(data.generatedAt, locale)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{labels.client}</Text>
            <Text style={styles.metaValue}>{data.clientName}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{labels.issuer}</Text>
            <Text style={styles.metaValue}>{data.issuer.fullName}</Text>
            <Text style={styles.subtitle}>{data.issuer.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.title}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{labels.totalAmount}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(data.totalAmount, locale)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{labels.amountPaid}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(data.amountPaid, locale)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{labels.outstanding}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(data.outstanding, locale)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{labels.loanDate}</Text>
              <Text style={styles.summaryValue}>
                {formatDate(data.loanDate, locale)}
              </Text>
            </View>
          </View>

          <View style={styles.description}>
            <Text style={styles.summaryLabel}>{labels.description}</Text>
            <Text style={styles.bodyCell}>
              {data.description?.trim() || labels.noNotes}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.paymentHistory}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.cellDate, styles.headerCell]}>
                {labels.columnDate}
              </Text>
              <Text style={[styles.cellAmount, styles.headerCell]}>
                {labels.columnAmount}
              </Text>
              <Text style={[styles.cellNote, styles.headerCell]}>
                {labels.columnNote}
              </Text>
            </View>
            {data.payments.length === 0 ? (
              <Text style={styles.emptyPayments}>{labels.noPayments}</Text>
            ) : (
              data.payments.map((payment, index) => {
                const note = formatPaymentNote(
                  payment.note,
                  labels.initialBalance
                );

                return (
                  <View
                    key={`${payment.paidAt.toISOString()}-${index}`}
                    style={styles.tableRow}
                  >
                    <Text style={[styles.cellDate, styles.bodyCell]}>
                      {formatDate(payment.paidAt, locale)}
                    </Text>
                    <Text style={[styles.cellAmount, styles.bodyCell]}>
                      {formatCurrency(payment.amount, locale)}
                    </Text>
                    <Text style={[styles.cellNote, styles.bodyCell]}>
                      {note ?? "—"}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.disclaimer}>{labels.disclaimer}</Text>
        </View>
      </Page>
    </Document>
  );
}
