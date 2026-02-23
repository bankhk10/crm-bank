/**
 * Employee Feature - Types
 */

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  companyId: string;
  employeeCode?: string;
  status?: string;
  position?: {
    id: string;
    name: string;
  };
  positionId?: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface EmployeeFormProps {
  initial?: any; // To allow Partial<EmployeeFormValues>
  initialData?: Employee; // For backward compatibility if needed
  employeeId?: string;
  isEdit?: boolean;
  // Make onSubmit flexible to handle the Promise return type used in the form
  onSubmit?: (payload: any) => Promise<{
    success: boolean;
    issues?: Record<string, string[]>;
    error?: string;
  }>; 
  onCancel?: () => void;
  registerRandomize?: (fn: () => void) => void;
}

export type DeleteRequestCallback = (employee: Employee) => void;
