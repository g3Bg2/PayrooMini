import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { usePayroll } from "./PayrollContext";
import { FileText, Download } from "lucide-react";

interface PayrunSummaryPageProps {
  onViewPayslip: (employeeId: string) => void;
}

export default function PayrunSummaryPage({
  onViewPayslip,
}: PayrunSummaryPageProps) {
  const { payslips } = usePayroll();

  if (payslips.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Pay Run Summary</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pay Run Data</h3>
            <p className="text-muted-foreground text-center">
              Generate a pay run first to see the summary here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = payslips.reduce(
    (acc, payslip) => ({
      gross: acc.gross + payslip.gross,
      tax: acc.tax + payslip.tax,
      super: acc.super + payslip.super,
      net: acc.net + payslip.net,
      normalHours: acc.normalHours + payslip.normalHours,
      overtimeHours: acc.overtimeHours + payslip.overtimeHours,
    }),
    { gross: 0, tax: 0, super: 0, net: 0, normalHours: 0, overtimeHours: 0 }
  );

  const periodStart = payslips[0]?.periodStart;
  const periodEnd = payslips[0]?.periodEnd;

  const exportSummary = () => {
    const header = [
      "Employee",
      "Normal Hours",
      "Overtime Hours",
      "Gross",
      "Tax",
      "Super",
      "Net",
    ];
    const rows = payslips.map((p) => [
      p.employeeName,
      p.normalHours.toFixed(2),
      p.overtimeHours.toFixed(2),
      p.gross.toFixed(2),
      p.tax.toFixed(2),
      p.super.toFixed(2),
      p.net.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payrun-summary-${periodStart}-${periodEnd}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Pay Run Summary</h1>
          {periodStart && periodEnd && (
            <p className="text-muted-foreground mt-1">
              Pay Period: {new Date(periodStart).toLocaleDateString()} -{" "}
              {new Date(periodEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gross Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${totals.gross.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.normalHours.toFixed(1)}h normal +{" "}
              {totals.overtimeHours.toFixed(1)}h overtime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              ${totals.tax.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totals.tax / totals.gross) * 100).toFixed(1)}% of gross
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Superannuation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">
              ${totals.super.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totals.super / totals.gross) * 100).toFixed(1)}% of gross
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Net Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-success">
              ${totals.net.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payslips.length} employee{payslips.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Normal Hours</TableHead>
                <TableHead>Overtime Hours</TableHead>
                <TableHead>Allowance</TableHead>
                <TableHead>Gross Pay</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Super</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((payslip, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {payslip.employeeName}
                  </TableCell>
                  <TableCell>{payslip.normalHours.toFixed(2)}</TableCell>
                  <TableCell>{payslip.overtimeHours.toFixed(2)}</TableCell>
                  <TableCell>{payslip.allowance.toFixed(2)}</TableCell>
                  <TableCell>${payslip.gross.toFixed(2)}</TableCell>
                  <TableCell className="text-destructive">
                    ${payslip.tax.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-warning">
                    ${payslip.super.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-medium text-success">
                    ${payslip.net.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewPayslip(payslip.employeeId)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Payslip
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-4 py-6">
          <Button size="lg" variant="outline" onClick={exportSummary}>
            <Download className="h-5 w-5 mr-2" />
            Export Pay Run Summary
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
