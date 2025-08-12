import Swal from 'sweetalert2';

// Brand colors
const brandColors = {
  primary: '#dc2626', // Red
  secondary: '#2563eb', // Blue
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
};

// Custom SweetAlert configurations
export const swalConfig = {
  customClass: {
    popup: 'rounded-xl shadow-2xl',
    title: 'text-xl font-bold text-gray-800',
    content: 'text-gray-600',
    confirmButton: 'bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transform transition hover:scale-105',
    cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transform transition hover:scale-105',
    denyButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transform transition hover:scale-105',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInDown animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp animate__faster'
  }
};

// Success Alert
export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    ...swalConfig,
    icon: 'success',
    title,
    text,
    confirmButtonText: 'Great!',
    timer: 3000,
    timerProgressBar: true,
  });
};

// Error Alert
export const showError = (title: string, text?: string) => {
  return Swal.fire({
    ...swalConfig,
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Try Again',
  });
};

// Warning Alert
export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    ...swalConfig,
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Understood',
  });
};

// Info Alert
export const showInfo = (title: string, text?: string) => {
  return Swal.fire({
    ...swalConfig,
    icon: 'info',
    title,
    text,
    confirmButtonText: 'Got it',
  });
};

// Confirmation Dialog
export const showConfirmation = (
  title: string,
  text?: string,
  confirmText: string = 'Yes, proceed',
  cancelText: string = 'Cancel'
) => {
  return Swal.fire({
    ...swalConfig,
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

// Delete Confirmation
export const showDeleteConfirmation = (itemName?: string) => {
  return Swal.fire({
    ...swalConfig,
    icon: 'warning',
    title: 'Are you sure?',
    text: itemName 
      ? `You won't be able to recover ${itemName}!`
      : "You won't be able to recover this item!",
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    customClass: {
      ...swalConfig.customClass,
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transform transition hover:scale-105',
    }
  });
};

// Loading Alert
export const showLoading = (title: string = 'Processing...', text?: string) => {
  return Swal.fire({
    ...swalConfig,
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Toast notification
export const showToast = (
  icon: 'success' | 'error' | 'warning' | 'info',
  title: string,
  position: 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start' = 'top-end'
) => {
  return Swal.fire({
    icon,
    title,
    toast: true,
    position,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-lg shadow-lg',
    }
  });
};

// Input Dialog
export const showInputDialog = (
  title: string,
  inputPlaceholder: string,
  inputType: 'text' | 'email' | 'password' | 'number' = 'text'
) => {
  return Swal.fire({
    ...swalConfig,
    title,
    input: inputType,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    inputValidator: (value) => {
      if (!value) {
        return 'This field is required!';
      }
    }
  });
};
