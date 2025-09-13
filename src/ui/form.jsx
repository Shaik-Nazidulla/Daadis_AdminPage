// src/ui/form.jsx

import * as React from 'react';
import { Controller } from 'react-hook-form';

// Basic Form wrapper component
const Form = ({ children, ...props }) => {
  return <form {...props}>{children}</form>;
};

// FormField wraps a Controller from react-hook-form for controlled inputs
const FormField = ({ control, name, render }) => {
  return <Controller control={control} name={name} render={render} />;
};

// Minimal form layout components for consistent styling

const FormItem = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div className={`mb-4 ${className}`} ref={ref} {...props}>
    {children}
  </div>
));

const FormControl = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div className={`flex flex-col ${className}`} ref={ref} {...props}>
    {children}
  </div>
));

const FormMessage = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <p
    role="alert"
    className={`mt-1 text-sm text-red-600 font-medium ${className}`}
    ref={ref}
    {...props}
  >
    {children}
  </p>
));

export { Form, FormField, FormItem, FormControl, FormMessage };
