import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { usePayroll, TimesheetEntry } from "./PayrollContext";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function TimesheetsPage() {
  const {
    employees,
    timesheets,
    fetchEmployeeTimesheets,
    addTimesheet,
    updateTimesheetEntry,
    deleteTimesheetEntry,
  } = usePayroll();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [weekEnd, setWeekEnd] = useState<Date>(getSunday(new Date()));
  const [allowance, setAllowance] = useState(0);
  const [weekTimesheets, setWeekTimesheets] = useState<TimesheetEntry[]>([]);

  function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  function getSunday(d: Date): Date {
    const monday = getMonday(d);
    return new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + 6
    );
  }

  function formatDate(d: Date): string {
    const result = new Intl.DateTimeFormat("en-CA").format(d);
    return result;
  }

  function getDayName(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
  }

  // --- Effects ---
  useEffect(() => {
    if (selectedEmployeeId && timesheets.length > 0) {
      const startStr = formatDate(weekStart);
      const endStr = formatDate(weekEnd);
      const employeeTimesheets = timesheets.filter(
        (ts) =>
          ts.employeeId === selectedEmployeeId &&
          new Date(ts.date).toISOString().split("T")[0] >= startStr &&
          new Date(ts.date).toISOString().split("T")[0] <= endStr
      );
      setWeekTimesheets(employeeTimesheets);
      setAllowance(employeeTimesheets[0]?.allowance || 0);
    } else {
      setWeekTimesheets([]);
      setAllowance(0);
    }
  }, [selectedEmployeeId, weekStart, weekEnd, timesheets]);

  const shiftWeek = (direction: "prev" | "next") => {
    const delta = direction === "prev" ? -7 : 7;
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + delta);
    const newEnd = getSunday(newStart);
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  };

  const calculateTotalHours = (
    startTime: string,
    endTime: string,
    breakMinutes: number
  ): number => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (end <= start) return 0;

    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(0, diffHours - breakMinutes / 60);
  };

  const handleTimesheetChange = (
    index: number,
    field: keyof TimesheetEntry,
    value: string | number
  ) => {
    const updated = [...weekTimesheets];
    updated[index] = { ...updated[index], [field]: value };

    if (
      field === "startTime" ||
      field === "endTime" ||
      field === "breakMinutes"
    ) {
      const ts = updated[index];
      updated[index].totalHours = calculateTotalHours(
        ts.startTime,
        ts.endTime,
        Number(ts.breakMinutes)
      );
    }

    setWeekTimesheets(updated);
  };

  const addTimesheetRow = () => {
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      weekDates.push(formatDate(d));
    }

    const existingDates = weekTimesheets.map((ts) =>
      formatDate(new Date(ts.date))
    );
    const missingDate = weekDates.find((d) => !existingDates.includes(d));

    if (!missingDate) {
      toast.error("All days for this week already added.");
      return;
    }

    const newTs: TimesheetEntry = {
      id: `temp-${Date.now()}`,
      employeeId: selectedEmployeeId,
      date: missingDate,
      startTime: "09:00",
      endTime: "17:00",
      breakMinutes: 30,
      totalHours: 7.5,
      allowance: allowance,
    };

    setWeekTimesheets([...weekTimesheets, newTs]);
  };

  const removeTimesheetRow = (index: number) => {
    const ts = weekTimesheets[index];
    if (!ts.id.startsWith("temp-")) deleteTimesheetEntry(ts.id);
    setWeekTimesheets(weekTimesheets.filter((_, i) => i !== index));
    toast.success("Timesheet row removed.");
  };

  const saveTimesheets = async () => {
    try {
      for (const ts of weekTimesheets) {
        const data = {
          employeeId: ts.employeeId,
          date: ts.date,
          startTime: ts.startTime,
          endTime: ts.endTime,
          breakMinutes: ts.breakMinutes,
          totalHours: ts.totalHours,
          allowance: Number(allowance) || 0,
          startDate: formatDate(weekStart),
          endDate: formatDate(weekEnd),
        };
        if (ts.id.startsWith("temp-")) {
          await addTimesheet(data);
        } else {
          await updateTimesheetEntry(ts.id, data);
        }
      }
      toast.success("Timesheets saved successfully!");
    } catch (error) {
      toast.error("Failed to save timesheets. Please try again.");
      console.error("Save timesheets error:", error);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const totalWeekHours = weekTimesheets.reduce(
    (sum, ts) => sum + ts.totalHours,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Timesheets</h1>

      <Card>
        <CardHeader>
          <CardTitle>Timesheet Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Employee</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={(empId) => {
                  setSelectedEmployeeId(empId);
                  fetchEmployeeTimesheets(empId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Week Start</Label>
              <Input type="date" value={formatDate(weekStart)} readOnly />
            </div>

            <div>
              <Label>Week End</Label>
              <Input type="date" value={formatDate(weekEnd)} readOnly />
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => shiftWeek("prev")}>Previous Week</Button>
              <Button onClick={() => shiftWeek("next")}>Next Week</Button>
            </div>
          </div>

          {selectedEmployee && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Break (mins)</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekTimesheets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      weekTimesheets.map((timesheet, index) => (
                        <TableRow key={`${timesheet.id}-${index}`}>
                          <TableCell className="font-medium">
                            {getDayName(timesheet.date)}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={
                                new Date(timesheet.date)
                                  .toISOString()
                                  .split("T")[0]
                              }
                              onChange={(e) =>
                                handleTimesheetChange(
                                  index,
                                  "date",
                                  e.target.value
                                )
                              }
                              className="w-40"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={timesheet.startTime}
                              onChange={(e) =>
                                handleTimesheetChange(
                                  index,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={timesheet.endTime}
                              onChange={(e) =>
                                handleTimesheetChange(
                                  index,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={timesheet.breakMinutes}
                              onChange={(e) =>
                                handleTimesheetChange(
                                  index,
                                  "breakMinutes",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-24"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {timesheet.totalHours.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeTimesheetRow(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 border-t pt-4">
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="allowance">Weekly Allowance ($)</Label>
                    <Input
                      id="allowance"
                      type="number"
                      step="0.01"
                      value={allowance}
                      onChange={(e) => setAllowance(Number(e.target.value))}
                      className="w-32"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Hours:{" "}
                    <span className="font-medium">
                      {totalWeekHours.toFixed(2)}
                    </span>
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={addTimesheetRow}
                    disabled={weekTimesheets.length >= 7}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                  <Button
                    onClick={saveTimesheets}
                    className="bg-primary hover:bg-primary/90"
                    disabled={totalWeekHours === 0}
                  >
                    Save Timesheet
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
