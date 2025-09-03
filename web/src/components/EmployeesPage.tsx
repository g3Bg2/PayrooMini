import React, { useState } from "react";
import toast from "react-hot-toast";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { usePayroll, Employee } from "./PayrollContext";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } =
    usePayroll();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    type: "Full-time" as Employee["type"],
    baseRate: "",
    superRate: "",
    bankBsb: "",
    bankAccount: "",
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      type: "Full-time",
      baseRate: "",
      superRate: "",
      bankBsb: "",
      bankAccount: "",
    });
    setEditingEmployee(null);
  };

  const openDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        type: employee.type,
        baseRate: employee.baseHourlyRate.toString(),
        superRate: employee.superRate.toString(),
        bankBsb: employee.bankBsb,
        bankAccount: employee.bankAccount,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employeeData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      type: formData.type,
      baseHourlyRate: parseFloat(formData.baseRate),
      superRate: parseFloat(formData.superRate),
      bankBsb: formData.bankBsb,
      bankAccount: formData.bankAccount,
    };

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData);
        toast.success("Employee updated successfully!");
      } else {
        await addEmployee(employeeData);
        toast.success("Employee added successfully!");
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        toast.success("Employee deleted successfully!");
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete employee");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">Employees</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog()}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type">Employee Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Employee["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseRate">Hourly Rate ($)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    step="0.01"
                    value={formData.baseRate}
                    onChange={(e) =>
                      setFormData({ ...formData, baseRate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="superRate">Super Rate (%)</Label>
                  <Input
                    id="superRate"
                    type="number"
                    step="0.1"
                    value={formData.superRate}
                    onChange={(e) =>
                      setFormData({ ...formData, superRate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankBsb">Bank BSB</Label>
                  <Input
                    id="bankBsb"
                    placeholder="000-000"
                    value={formData.bankBsb}
                    onChange={(e) =>
                      setFormData({ ...formData, bankBsb: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccount">Bank Account</Label>
                  <Input
                    id="bankAccount"
                    placeholder="12345678"
                    value={formData.bankAccount}
                    onChange={(e) =>
                      setFormData({ ...formData, bankAccount: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {editingEmployee ? "Update" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Super Rate</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.firstName}</TableCell>
                    <TableCell>{employee.lastName}</TableCell>
                    <TableCell>{employee.type}</TableCell>
                    <TableCell>${employee.baseHourlyRate.toFixed(2)}</TableCell>
                    <TableCell>{employee.superRate}%</TableCell>
                    <TableCell>
                      {employee.bankBsb} {employee.bankAccount}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(employee.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
