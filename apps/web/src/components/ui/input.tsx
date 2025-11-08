import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Define input size variants
const inputVariants = cva(
  `
    flex w-full bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400
    transition-all duration-200 ease-in-out
    focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100
    hover:border-gray-300
    disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50
    [&[readonly]]:bg-gray-50 [&[readonly]]:cursor-not-allowed
    file:h-full [&[type=file]]:py-0 file:border-solid file:border-input file:bg-transparent 
    file:font-medium file:not-italic file:text-foreground file:p-0 file:border-0 file:border-e
    aria-invalid:border-red-500 aria-invalid:ring-red-100 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-100
    dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400 
    dark:focus:border-blue-400 dark:focus:ring-blue-900/20 dark:hover:border-gray-500
    dark:disabled:bg-gray-900 dark:aria-invalid:border-red-400
  `,
  {
    variants: {
      variant: {
        lg: 'h-12 px-4 text-base rounded-lg file:pe-4 file:me-4',
        md: 'h-10 px-3 text-sm rounded-lg file:pe-3 file:me-3',
        sm: 'h-8 px-2.5 text-xs rounded-md file:pe-2.5 file:me-2.5',
      },
    },
    defaultVariants: {
      variant: 'md',
    },
  },
);

const inputAddonVariants = cva(
  'flex items-center shrink-0 justify-center bg-gray-50 border-2 border-gray-200 text-gray-600 transition-colors duration-200 [&_svg]:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:[&_svg]:text-gray-400',
  {
    variants: {
      variant: {
        sm: 'rounded-md h-8 min-w-8 text-xs px-2.5 [&_svg:not([class*=size-])]:size-3.5',
        md: 'rounded-lg h-10 min-w-10 px-3 text-sm [&_svg:not([class*=size-])]:size-4',
        lg: 'rounded-lg h-12 min-w-12 px-4 text-base [&_svg:not([class*=size-])]:size-5',
      },
      mode: {
        default: '',
        icon: 'px-0 justify-center',
      },
    },
    defaultVariants: {
      variant: 'md',
      mode: 'default',
    },
  },
);

const inputGroupVariants = cva(
  `
    flex items-stretch
    [&_[data-slot=input]]:grow
    [&_[data-slot=input-addon]:has(+[data-slot=input])]:rounded-e-none [&_[data-slot=input-addon]:has(+[data-slot=input])]:border-e-0
    [&_[data-slot=input-addon]:has(+[data-slot=datefield])]:rounded-e-none [&_[data-slot=input-addon]:has(+[data-slot=datefield])]:border-e-0 
    [&_[data-slot=input]+[data-slot=input-addon]]:rounded-s-none [&_[data-slot=input]+[data-slot=input-addon]]:border-s-0
    [&_[data-slot=input-addon]:has(+[data-slot=button])]:rounded-e-none
    [&_[data-slot=input]+[data-slot=button]]:rounded-s-none
    [&_[data-slot=button]+[data-slot=input]]:rounded-s-none
    [&_[data-slot=input-addon]+[data-slot=input]]:rounded-s-none
    [&_[data-slot=input-addon]+[data-slot=datefield]]:[&_[data-slot=input]]:rounded-s-none
    [&_[data-slot=datefield]:has(+[data-slot=input-addon])]:[&_[data-slot=input]]:rounded-e-none
    [&_[data-slot=input]:has(+[data-slot=button])]:rounded-e-none
    [&_[data-slot=input]:has(+[data-slot=input-addon])]:rounded-e-none
    [&_[data-slot=datefield]]:grow
    [&_[data-slot=datefield]+[data-slot=input-addon]]:rounded-s-none [&_[data-slot=datefield]+[data-slot=input-addon]]:border-s-0
  `,
  {
    variants: {},
    defaultVariants: {},
  },
);

const inputWrapperVariants = cva(
  `
    flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg transition-all duration-200
    focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100
    hover:border-gray-300
    has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-gray-50
    dark:bg-gray-800 dark:border-gray-600 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900/20
    dark:hover:border-gray-500 dark:has-[:disabled]:bg-gray-900

    [&_[data-slot=datefield]]:grow 
    [&_[data-slot=input]]:flex 
    [&_[data-slot=input]]:w-full 
    [&_[data-slot=input]]:outline-none 
    [&_[data-slot=input]]:bg-transparent
    [&_[data-slot=input]]:border-0 
    [&_[data-slot=input]]:p-0
    [&_[data-slot=input]]:text-gray-900
    [&_[data-slot=input]]:placeholder:text-gray-400
    [&_[data-slot=input]]:focus:ring-0 
    [&_[data-slot=input]]:focus:outline-none
    [&_[data-slot=input]]:disabled:cursor-not-allowed
    dark:[&_[data-slot=input]]:text-gray-100
    dark:[&_[data-slot=input]]:placeholder:text-gray-400

    [&_svg]:text-gray-400 
    [&_svg]:shrink-0
  `,
  {
    variants: {
      variant: {
        sm: 'gap-1.5 h-8 px-2.5 [&_svg:not([class*=size-])]:size-3.5',
        md: 'gap-2 h-10 px-3 [&_svg:not([class*=size-])]:size-4',
        lg: 'gap-2 h-12 px-4 [&_svg:not([class*=size-])]:size-5',
      },
    },
    defaultVariants: {
      variant: 'md',
    },
  },
);

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

function InputAddon({
  className,
  variant,
  mode,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputAddonVariants>) {
  return (
    <div
      data-slot="input-addon"
      className={cn(inputAddonVariants({ variant, mode }), className)}
      {...props}
    />
  );
}

function InputGroup({
  className,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      data-slot="input-group"
      className={cn(inputGroupVariants(), className)}
      {...props}
    />
  );
}

function InputWrapper({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputWrapperVariants>) {
  return (
    <div
      data-slot="input-wrapper"
      className={cn(
        inputVariants({ variant }),
        inputWrapperVariants({ variant }),
        className,
      )}
      {...props}
    />
  );
}

export {
  Input,
  InputAddon,
  InputGroup,
  InputWrapper,
  inputVariants,
  inputAddonVariants,
};
