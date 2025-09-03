import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import client from "../api/client";
import { useAuth } from "./AuthContext";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  type: "Full-time" | "Part-time" | "Casual";
  baseHourlyRate: number;
  superRate: number;
  bankBsb: string;
  bankAccount: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalHours: number;
  allowance?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PayslipData {
  employeeId: string;
  employeeName: string;
  allowance: number;
  payrunId: string;
  normalHours: number;
  overtimeHours: number;
  gross: number;
  tax: number;
  super: number;
  net: number;
  periodStart: string;
  periodEnd: string;
}

export interface PayslipCreateData {
  id: string;
  periodStart: string;
  periodEnd: string;
  gross: number;
  tax: number;
  net: number;
  super: number;
  createdAt: string;
  payslips: PayslipData[];
}

interface PayrollContextType {
  employees: Employee[];
  timesheets: TimesheetEntry[];
  payslips: PayslipData[];
  fetchEmployeeTimesheets: (employeeId: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, "id">) => Promise<void>;
  updateEmployee: (id: string, employee: Omit<Employee, "id">) => Promise<void>;
  updateTimesheetEntry: (
    id: string,
    timesheet: Omit<TimesheetEntry, "id">
  ) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  deleteTimesheetEntry: (entryId: string) => Promise<void>;
  addTimesheet: (timesheet: Omit<TimesheetEntry, "id">) => Promise<void>;
  updateTimesheet: (
    id: string,
    timesheet: Omit<TimesheetEntry, "id">
  ) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
  generatePayrun: (
    startDate: string,
    endDate: string,
    employeeIds?: string[]
  ) => Promise<PayslipData[]>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

function flattenTimesheet(apiTs: any): TimesheetEntry[] {
  return apiTs.entries.map((e: any) => {
    const start = parseTime(e.start);
    const end = parseTime(e.end);
    const workedMins =
      (end.getTime() - start.getTime()) / (1000 * 60) - e.unpaidBreakMins;
    return {
      id: e.id,
      employeeId: apiTs.employeeId,
      date: e.date,
      startTime: e.start,
      endTime: e.end,
      breakMinutes: e.unpaidBreakMins,
      totalHours: workedMins / 60,
      allowance: apiTs.allowances ?? 0,
    };
  });
}

function parseTime(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function PayrollProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchEmployees();
    fetchTimesheets();
  }, [isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      const { data } = await client.get<Employee[]>("/employees");
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchTimesheets = async () => {
    try {
      const { data } = await client.get("/timesheets");

      const normalized: TimesheetEntry[] = data.flatMap((ts: any) =>
        ts.entries.map((entry: any) => ({
          id: entry.id,
          employeeId: ts.employeeId,
          date: entry.date.split("T")[0],
          startTime: entry.start,
          endTime: entry.end,
          breakMinutes: entry.unpaidBreakMins,
          totalHours:
            (new Date(`2000-01-01T${entry.end}`).getTime() -
              new Date(`2000-01-01T${entry.start}`).getTime()) /
              (1000 * 60 * 60) -
            entry.unpaidBreakMins / 60,
          allowance: ts.allowances ?? 0,
        }))
      );

      setTimesheets(normalized);
    } catch (err) {
      console.error("Error fetching timesheets:", err);
    }
  };

  const addEmployee = async (employee: Omit<Employee, "id">) => {
    try {
      const { data } = await client.post<Employee>("/employees", employee);
      setEmployees((prev) => [...prev, data]);
    } catch (err) {
      console.error("Error adding employee:", err);
    }
  };

  const updateEmployee = async (id: string, employee: Omit<Employee, "id">) => {
    try {
      const { data } = await client.put<Employee>(`/employees/${id}`, employee);
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? data : emp)));
    } catch (err) {
      console.error("Error updating employee:", err);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await client.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      setTimesheets((prev) => prev.filter((ts) => ts.employeeId !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  const fetchEmployeeTimesheets = async (employeeId: string) => {
    try {
      const { data } = await client.get<any>(`/employees/${employeeId}`);
      const flat = data.flatMap((ts: any) => flattenTimesheet(ts));
      setTimesheets(flat);
    } catch (err) {
      console.error("Error fetching employee timesheets:", err);
    }
  };

  const addTimesheet = async (timesheet: Omit<TimesheetEntry, "id">) => {
    try {
      const payload = {
        employeeId: timesheet.employeeId,
        date: timesheet.date,
        startTime: timesheet.startTime,
        endTime: timesheet.endTime,
        breakMinutes: timesheet.breakMinutes,
        allowance: timesheet.allowance ?? 0,
        startDate: timesheet.startDate,
        endDate: timesheet.endDate,
      };
      await client.post<any>("/timesheets", payload);
    } catch (err) {
      console.error("Error adding timesheet:", err);
    }
  };

  const updateTimesheet = async (
    id: string,
    timesheet: Omit<TimesheetEntry, "id">
  ) => {
    try {
      const payload = {
        entries: [
          {
            date: timesheet.date,
            start: timesheet.startTime,
            end: timesheet.endTime,
            unpaidBreakMins: timesheet.breakMinutes,
          },
        ],
        allowances: timesheet.allowance ?? 0,
      };
      const { data } = await client.put<any>(`/timesheets/${id}`, payload);
      const flat = flattenTimesheet(data);
      setTimesheets((prev) => prev.map((ts) => (ts.id === id ? flat[0] : ts)));
    } catch (err) {
      console.error("Error updating timesheet:", err);
    }
  };

  const updateTimesheetEntry = async (
    id: string,
    timesheet: Omit<TimesheetEntry, "id">
  ) => {
    try {
      const payload = {
        date: timesheet.date,
        start: timesheet.startTime,
        end: timesheet.endTime,
        unpaidBreakMins: timesheet.breakMinutes,
        allowance: timesheet.allowance ?? 0,
      };
      await client.put<any>(`/timesheets/entries/${id}`, payload);
      fetchEmployeeTimesheets(timesheet.employeeId);
    } catch (err) {
      console.error("Error updating timesheet entry:", err);
    }
  };

  const deleteTimesheet = async (id: string) => {
    try {
      await client.delete(`/timesheets/${id}`);
      setTimesheets((prev) => prev.filter((ts) => ts.id !== id));
    } catch (err) {
      console.error("Error deleting timesheet:", err);
    }
  };

  const deleteTimesheetEntry = async (entryId: string) => {
    try {
      await client.delete(`/timesheets/entries/${entryId}`);
      setTimesheets((prev) => prev.filter((ts) => ts.id !== entryId));
    } catch (err) {
      console.error("Error deleting timesheet entry:", err);
    }
  };

  const generatePayrun = async (
    startDate: string,
    endDate: string,
    employeeIds?: string[]
  ): Promise<PayslipData[]> => {
    try {
      const payload = {
        periodStart: startDate,
        periodEnd: endDate,
        employees:
          employeeIds && employeeIds.length > 0
            ? employeeIds
            : employees.map((e) => e.id),
      };

      const { data } = await client.post<PayslipCreateData>(
        "/payruns/generate",
        payload
      );

      data.payslips.forEach((ps) => {
        ps.allowance =
          timesheets.find(
            (t) =>
              t.employeeId === ps.employeeId &&
              t.date >= startDate &&
              t.date <= endDate
          )?.allowance ?? 0;
      });
      data.payslips.forEach((ps) => {
        ps.periodStart = startDate;
        ps.periodEnd = endDate;
        ps.employeeName =
          (employees.find((e) => e.id === ps.employeeId)?.firstName ?? "") +
          " " +
          (employees.find((e) => e.id === ps.employeeId)?.lastName ?? "");
      });

      setPayslips(data.payslips);
      return data.payslips;
    } catch (err) {
      console.error("Error generating payrun:", err);
      return [];
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <PayrollContext.Provider
      value={{
        employees,
        timesheets,
        payslips,
        fetchEmployeeTimesheets,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTimesheet,
        updateTimesheet,
        updateTimesheetEntry,
        deleteTimesheet,
        deleteTimesheetEntry,
        generatePayrun,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
}

export function usePayroll() {
  const context = useContext(PayrollContext);
  if (context === undefined) {
    throw new Error("usePayroll must be used within a PayrollProvider");
  }
  return context;
}
