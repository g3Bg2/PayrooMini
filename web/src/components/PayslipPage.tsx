import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { usePayroll } from "./PayrollContext";
import { Download, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";

interface PayslipPageProps {
  employeeId: string;
  onBack: () => void;
}

export default function PayslipPage({ employeeId, onBack }: PayslipPageProps) {
  const { employees, payslips } = usePayroll();
  const payslipRef = useRef<HTMLDivElement>(null);

  const employee = employees.find((emp) => emp.id === employeeId);
  const payslip = payslips.find((ps) => ps.employeeId === employeeId);

  if (!employee || !payslip) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl">Payslip Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No payslip data found for the selected employee.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDownload = async () => {
    if (!payslipRef.current) return;

    const canvas = await html2canvas(payslipRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // extra pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // shift up remaining part
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Payslip_${employee.firstName}_${employee.lastName}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl">
            Payslip — {employee.firstName} {employee.lastName}
          </h1>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="max-w-2xl mx-auto" ref={payslipRef}>
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-center text-xl">PAYSLIP</CardTitle>
            <p className="text-center text-primary-foreground/80">
              Pay Period: {formatDate(payslip.periodStart)} -{" "}
              {formatDate(payslip.periodEnd)}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Employee Details */}
            <div>
              <h3 className="font-semibold mb-3">Employee Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Employee Type:</span>
                  <p className="font-medium">{employee.type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bank Details:</span>
                  <p className="font-medium">
                    {employee.bankBsb} {employee.bankAccount}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Base Rate:</span>
                  <p className="font-medium">
                    ${employee.baseHourlyRate.toFixed(2)}/hour
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Hours and Earnings */}
            <div>
              <h3 className="font-semibold mb-3">Hours and Earnings</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>
                    Normal Hours ({payslip.normalHours.toFixed(2)} hrs @ $
                    {employee.baseHourlyRate.toFixed(2)})
                  </span>
                  <span className="font-medium">
                    $
                    {(payslip.normalHours * employee.baseHourlyRate).toFixed(2)}
                  </span>
                </div>

                {payslip.overtimeHours > 0 && (
                  <div className="flex justify-between items-center">
                    <span>
                      Overtime Hours ({payslip.overtimeHours.toFixed(2)} hrs @ $
                      {(employee.baseHourlyRate * 1.5).toFixed(2)})
                    </span>
                    <span className="font-medium">
                      $
                      {(
                        payslip.overtimeHours *
                        employee.baseHourlyRate *
                        1.5
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                {payslip.allowance > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Allowance</span>
                    <span className="font-medium">
                      ${payslip.allowance.toFixed(2)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center font-semibold">
                  <span>Gross Pay</span>
                  <span>${payslip.gross.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Deductions */}
            <div>
              <h3 className="font-semibold mb-3">Deductions</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-destructive">
                  <span>PAYG Tax</span>
                  <span className="font-medium">
                    -${payslip.tax.toFixed(2)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-semibold text-success text-lg">
                  <span>Net Pay</span>
                  <span>${payslip.net.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Employer Contributions */}
            <div>
              <h3 className="font-semibold mb-3">Employer Contributions</h3>
              <div className="flex justify-between items-center text-warning">
                <span>Superannuation ({employee.superRate}%)</span>
                <span className="font-medium">${payslip.super.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Hours:</span>
                  <p className="font-medium">
                    {(payslip.normalHours + payslip.overtimeHours).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gross Pay:</span>
                  <p className="font-medium">${payslip.gross.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Total Deductions:
                  </span>
                  <p className="font-medium text-destructive">
                    -${payslip.tax.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Net Pay:</span>
                  <p className="font-medium text-success text-lg">
                    ${payslip.net.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-muted-foreground text-center border-t pt-4">
              This payslip is generated by Payroo Mini Payrun. Please retain for
              your records.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
