export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-600 text-white";
    case "ERROR":
      return "bg-red-500 text-white";
    case "WARN":
      return "bg-yellow-500 text-white";
    case "INFO":
      return "bg-blue-500 text-white";
    case "DEBUG":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
};

export const getActionColor = (action: string) => {
  switch (action) {
    case "CREATE":
      return "bg-green-500 text-white";
    case "UPDATE":
      return "bg-blue-500 text-white";
    case "DELETE":
      return "bg-red-500 text-white";
    case "APPROVE":
      return "bg-emerald-500 text-white";
    case "REJECT":
      return "bg-orange-500 text-white";
    case "VIEW":
      return "bg-gray-500 text-white";
    case "EXPORT":
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
};

export const getEventTypeColor = (eventType: string) => {
  switch (eventType) {
    case "LOGIN_SUCCESS":
      return "bg-green-500 text-white";
    case "LOGIN_FAILED":
      return "bg-red-500 text-white";
    case "LOGOUT":
      return "bg-gray-500 text-white";
    case "PASSWORD_CHANGE":
    case "PASSWORD_RESET":
      return "bg-yellow-500 text-white";
    case "PERMISSION_CHANGE":
    case "ROLE_CHANGE":
    case "ADMIN_ACTION":
      return "bg-purple-600 text-white";
    case "SUSPICIOUS_ACTIVITY":
      return "bg-red-600 text-white";
    case "ACCOUNT_LOCKED":
      return "bg-red-700 text-white";
    case "ACCOUNT_UNLOCKED":
      return "bg-green-600 text-white";
    default:
      return "bg-gray-400 text-white";
  }
};
