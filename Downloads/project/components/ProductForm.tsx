'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AdminEntry } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  componentName: z.string().min(2, 'Component name must be at least 2 characters'),
  qty: z.coerce.number().int().positive('Quantity must be positive'),
  dcno: z.string().min(1, 'DC number is required'),
  internalJobOrder: z.string().optional(),
  machineName: z.string().min(1, 'Machine name is required'),
  operatorName: z.string().min(2, 'Operator name must be at least 2 characters'),
  shift: z.enum(['Day', 'Night', 'General']),
  additionalQty: z.coerce.number().int().nonnegative('Additional quantity must be non-negative').optional(),
  opn: z.string().min(1, 'OPN is required'),
  progNo: z.string().min(1, 'Program number is required'),
  settingTime: z.coerce.number().nonnegative('Setting time must be positive'),
  cycleTime: z.coerce.number().nonnegative('Cycle time must be positive'),
  handlingTime: z.coerce.number().nonnegative('Handling time must be positive'),
  idleTime: z.coerce.number().nonnegative('Idle time must be positive'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  remarks: z.string().optional(),
  dateOfEntry: z.string().min(1, 'Date of entry is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: AdminEntry;
}

// Data will be fetched from API

export default function ProductForm({ initialData }: ProductFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [componentOpen, setComponentOpen] = useState(false);
  const [machineOpen, setMachineOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<string[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<string[]>([]);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<string[]>([]);
  const [componentsList, setComponentsList] = useState<string[]>([]);
  const [machinesList] = useState(['TC-1', 'TC-2', 'TC-3', 'VMC']);
  const [operatorsList, setOperatorsList] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues: FormValues = {
    customerName: initialData?.customerName || '',
    componentName: initialData?.componentName || '',
    qty: initialData?.qty || 0,
    dcno: initialData?.dcno || '',
    internalJobOrder: initialData?.internalJobOrder || '',
    machineName: initialData?.machineName || '',
    operatorName: initialData?.operatorName || '',
    shift: (initialData?.shift as 'Day' | 'Night' | 'General') || 'Day',
    additionalQty: initialData?.additionalQty || 0,
    opn: initialData?.opn || '',
    progNo: initialData?.progNo || '',
    settingTime: initialData?.settingTime || 0,
    cycleTime: initialData?.cycleTime || 0,
    handlingTime: initialData?.handlingTime || 0,
    idleTime: initialData?.idleTime || 0,
    startTime: initialData?.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
    endTime: initialData?.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
    remarks: initialData?.remarks || '',
    dateOfEntry: initialData?.dateOfEntry ? new Date(initialData.dateOfEntry).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
              // Use proxy in development, production API in production
        const response = await fetch('/api/getCustomerList');
      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }
      
      const data = await response.json();
      
      // Extract unique customers and components
      const uniqueCustomers = [...new Set(data.map((item: any) => item.customerName as string))];
      const uniqueComponents = [...new Set(data.map((item: any) => item.componentName as string))];
      
      // Generate operators list (Emp001 to Emp100)
      const operators = Array.from({ length: 100 }, (_, i) => {
        const num = i + 1;
        const cnt = num < 10 ? '00' : num < 100 ? '0' : '';
        return `Emp${cnt}${num}`;
      });
      
      setCustomersList(uniqueCustomers);
      setComponentsList(uniqueComponents);
      setOperatorsList(operators);
      setFilteredCustomers(uniqueCustomers);
      setFilteredComponents(uniqueComponents);
      setCustomerData(data);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customer data',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const serverURL = 'https://axis-precision-app.onrender.com/';
      const url = initialData?._id
        ? `${serverURL}api/admin/${initialData._id}`
        : `${serverURL}api/admin`;

      const method = initialData?._id ? 'PUT' : 'POST';

      const payload = {
        ...values,
        startTime: new Date(values.startTime),
        endTime: new Date(values.endTime),
        dateOfEntry: new Date(values.dateOfEntry),
        totalQty: values.qty + (values.additionalQty || 0),
      };

              const response = await fetch(initialData?._id ? `/api/admin/${initialData._id}` : '/api/admin', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save entry');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: initialData?._id ? 'Entry updated successfully' : 'Entry added successfully',
      });

      // Show edit option like in React Native version
      if (!initialData?._id) {
        const shouldEdit = window.confirm(
          'Data saved successfully! Click OK to create new entry, or Cancel to edit the saved data.'
        );
        
        if (!shouldEdit) {
          router.push(`/data/${result._id}`);
          return;
        }
      }

      router.push('/data');
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to save entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const findCustomer = (query: string) => {
    if (query) {
      const regex = new RegExp(query.trim(), 'i');
      const filtered = customersList.filter(customer => customer.search(regex) >= 0);
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customersList);
    }
  };

  const findComponent = (query: string, customerName: string) => {
    if (query) {
      const regex = new RegExp(query.trim(), 'i');
      let data = componentsList;
      
      // Filter components based on selected customer
      if (customerName) {
        const customerComponents = customerData.filter(obj => 
          obj.customerName.toUpperCase().includes(customerName.toUpperCase())
        );
        if (customerComponents.length) {
          data = customerComponents.map(item => item.componentName);
        }
      }
      
      const filtered = data.filter(component => component.search(regex) >= 0);
      setFilteredComponents(filtered);
    } else {
      setFilteredComponents(componentsList);
    }
  };

  const handleCustomerSelect = (customer: string) => {
    form.setValue('customerName', customer);
    setCustomerOpen(false);
    
    // Filter components based on selected customer
    const customerComponents = customerData.filter(obj => 
      obj.customerName.toUpperCase().includes(customer.toUpperCase())
    );
    if (customerComponents.length) {
      setFilteredComponents(customerComponents.map(item => item.componentName));
    }
  };

  const handleComponentSelect = (component: string) => {
    form.setValue('componentName', component);
    setComponentOpen(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer Name</FormLabel>
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value || 'Enter the customer name'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Enter the customer name"
                            onValueChange={(value) => {
                              field.onChange(value);
                              findCustomer(value);
                            }}
                          />
                          <CommandEmpty>
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => {
                                const input = document.querySelector('[placeholder="Enter the customer name"]') as HTMLInputElement;
                                if (input?.value) {
                                  handleCustomerSelect(input.value);
                                }
                              }}
                            >
                              Add "{field.value}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {filteredCustomers.map((customer) => (
                              <CommandItem
                                key={customer}
                                onSelect={() => handleCustomerSelect(customer)}
                                className="uppercase"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === customer ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {customer}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Component Name */}
              <FormField
                control={form.control}
                name="componentName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Component Name</FormLabel>
                    <Popover open={componentOpen} onOpenChange={setComponentOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value || 'Enter the componentName'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Enter the componentName"
                            onValueChange={(value) => {
                              field.onChange(value);
                              findComponent(value, form.watch('customerName'));
                            }}
                          />
                          <CommandEmpty>
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => {
                                const input = document.querySelector('[placeholder="Enter the componentName"]') as HTMLInputElement;
                                if (input?.value) {
                                  handleComponentSelect(input.value);
                                }
                              }}
                            >
                              Add "{field.value}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup className="max-h-[150px] overflow-auto">
                            {filteredComponents.map((component) => (
                              <CommandItem
                                key={component}
                                onSelect={() => handleComponentSelect(component)}
                                className="uppercase"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === component ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {component}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Internal Job Order */}
              <FormField
                control={form.control}
                name="internalJobOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Job Order</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity */}
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        maxLength={5}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DC Number */}
              <FormField
                control={form.control}
                name="dcno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DC NO</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Machine Name */}
              <FormField
                control={form.control}
                name="machineName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select machine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machinesList.map((machine) => (
                          <SelectItem key={machine} value={machine}>
                            {machine}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Operator Name */}
              <FormField
                control={form.control}
                name="operatorName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Operator Name</FormLabel>
                    <Popover open={operatorOpen} onOpenChange={setOperatorOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value || 'Select operator'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search operator..." />
                          <CommandEmpty>No operator found.</CommandEmpty>
                          <CommandGroup>
                            {operatorsList.map((operator) => (
                              <CommandItem
                                key={operator}
                                onSelect={() => {
                                  field.onChange(operator);
                                  setOperatorOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === operator ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {operator}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Shift */}
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Day">Day</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Quantity */}
              <FormField
                control={form.control}
                name="additionalQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* OPN */}
              <FormField
                control={form.control}
                name="opn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OPN</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Program Number */}
              <FormField
                control={form.control}
                name="progNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Setting Time */}
              <FormField
                control={form.control}
                name="settingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setting Time (min)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cycle Time */}
              <FormField
                control={form.control}
                name="cycleTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Time (min)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Handling Time */}
              <FormField
                control={form.control}
                name="handlingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handling Time (min)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Idle Time */}
              <FormField
                control={form.control}
                name="idleTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idle Time (min)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Entry */}
              <FormField
                control={form.control}
                name="dateOfEntry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Entry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/data')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#84c225] hover:bg-[#6fa01c] text-white font-bold"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData?._id ? 'UPDATE' : 'SUBMIT'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}