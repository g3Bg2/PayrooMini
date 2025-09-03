import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { usePayroll, PayslipData } from "./PayrollContext";
import { DollarSign, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface RunPayPageProps {
  onNavigateToSummary?: () => void;
}

export default function RunPayPage({ onNavigateToSummary }: RunPayPageProps) {
  const { employees, generatePayrun } = usePayroll();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [payrunResults, setPayrunResults] = useState<PayslipData[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Initialize dates to current week
  React.useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setStartDate(new Intl.DateTimeFormat("en-CA").format(monday));
    setEndDate(new Intl.DateTimeFormat("en-CA").format(sunday));
    setSelectedEmployees(employees.map((emp) => emp.id));
  }, [employees]);

  const handleEmployeeToggle = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedEmployees(checked ? employees.map((emp) => emp.id) : []);
  };

  const handleGeneratePayrun = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates.");
      return;
    }

    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee.");
      return;
    }

    try {
      const results = await generatePayrun(
        startDate,
        endDate,
        selectedEmployees
      );
      setPayrunResults(results);
      toast.success("Payrun generated successfully!");
    } catch (error) {
      toast.error("Failed to generate payrun. Please try again.");
      console.error("Payrun generation error:", error);
    }
  };

  const totals = payrunResults.reduce(
    (acc, payslip) => ({
      gross: acc.gross + payslip.gross,
      tax: acc.tax + payslip.tax,
      super: acc.super + payslip.super,
      net: acc.net + payslip.net,
      allowance: acc.allowance + payslip.allowance,
    }),
    { gross: 0, tax: 0, super: 0, net: 0, allowance: 0 }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Run Pay</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pay Run Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Employee Selection */}
          <div>
            <Label>Select Employees</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll" className="font-medium">
                  Select All Employees
                </Label>
              </div>
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`employee-${employee.id}`}
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={(checked) =>
                      handleEmployeeToggle(employee.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`employee-${employee.id}`}>
                    {employee.firstName} {employee.lastName} ({employee.type})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGeneratePayrun}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!startDate || !endDate || selectedEmployees.length === 0}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Generate Payrun
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {payrunResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pay Run Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrunResults.map((payslip, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {payslip.employeeName}
                      </TableCell>
                      <TableCell>{payslip.normalHours.toFixed(2)}</TableCell>
                      <TableCell>{payslip.overtimeHours.toFixed(2)}</TableCell>
                      <TableCell>${payslip.allowance.toFixed(2)}</TableCell>
                      <TableCell>${payslip.gross.toFixed(2)}</TableCell>
                      <TableCell>${payslip.tax.toFixed(2)}</TableCell>
                      <TableCell>${payslip.super.toFixed(2)}</TableCell>
                      <TableCell className="font-medium text-success">
                        ${payslip.net.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>TOTALS</TableCell>
                    <TableCell>
                      {payrunResults
                        .reduce((sum, p) => sum + p.normalHours, 0)
                        .toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {payrunResults
                        .reduce((sum, p) => sum + p.overtimeHours, 0)
                        .toFixed(2)}
                    </TableCell>
                    <TableCell>${totals.allowance.toFixed(2)}</TableCell>
                    <TableCell>${totals.gross.toFixed(2)}</TableCell>
                    <TableCell>${totals.tax.toFixed(2)}</TableCell>
                    <TableCell>${totals.super.toFixed(2)}</TableCell>
                    <TableCell className="text-success">
                      ${totals.net.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center mt-6">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => onNavigateToSummary?.()}
              >
                <FileText className="h-5 w-5 mr-2" />
                View Payrun Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
