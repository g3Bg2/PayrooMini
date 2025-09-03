import { useState} from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { PayrollProvider } from "./components/PayrollContext";
import LoginPage from "./components/LoginPage";
import Layout from "./components/Layout";
import EmployeesPage from "./components/EmployeesPage";
import TimesheetsPage from "./components/TimesheetsPage";
import RunPayPage from "./components/RunPayPage";
import PayrunSummaryPage from "./components/PayrunSummaryPage";
import PayslipPage from "./components/PayslipPage";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState("employees");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const handleViewPayslip = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setCurrentPage("payslip");
  };

  const handleBackFromPayslip = () => {
    setSelectedEmployeeId("");
    setCurrentPage("summary");
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "employees":
        return <EmployeesPage />;
      case "timesheets":
        return <TimesheetsPage />;
      case "runpay":
        return (
          <RunPayPage onNavigateToSummary={() => setCurrentPage("summary")} />
        );
      case "summary":
        return <PayrunSummaryPage onViewPayslip={handleViewPayslip} />;
      case "payslip":
        return (
          <PayslipPage
            employeeId={selectedEmployeeId}
            onBack={handleBackFromPayslip}
          />
        );
      default:
        return <EmployeesPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PayrollProvider>
        <AppContent />
        <Toaster
          position="bottom-center"
          toastOptions={{
            // Default style for all toasts
            style: {
              fontWeight: 500,
              borderRadius: "0.625rem",
              padding: "0.75rem 1rem",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            },
            success: {
              style: {
                background: "hsl(var(--success))",
                color: "hsl(var(--success-foreground))",
              },
            },
            error: {
              style: {
                background: "hsl(var(--destructive))",
                color: "hsl(var(--destructive-foreground))",
              },
            },
            loading: {
              style: {
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              },
            },
          }}
        />
      </PayrollProvider>
    </AuthProvider>
  );
}
