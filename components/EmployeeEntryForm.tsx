'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Package, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formSchema = z.object({
  operatorName: z.string().min(2, 'Operator name is required'),
  date: z.string().min(1, 'Date is required'),
  shift: z.enum(['First', 'Second', 'Third', '12hrMng', '12hrNight']),
  machine: z.enum(['TC-1', 'TC-2', 'TC-3', 'VMC']),
  customerName: z.string().min(2, 'Customer name is required'),
  componentName: z.string().min(1, 'Component name is required'),
  qty: z.coerce.number().int().positive('Quantity must be positive'),
  additionalQty: z.coerce.number().int().nonnegative('Additional quantity must be non-negative').optional().or(z.literal('')),
  opn: z.enum(['preMC', 'first_opn', 'second_opn', 'third_opn', 'fourth_opn', 'R/W']),
  progNo: z.string().min(1, 'Program number is required'),
  settingTime: z.string().min(1, 'Setting time is required'),
  cycleTime: z.string().min(1, 'Cycle time is required'),
  handlingTime: z.string().min(1, 'Handling time is required'),
  idleTime: z.string().min(1, 'Idle time is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  remarks: z.string().optional().or(z.literal('')),
  internalJobOrder: z.string().min(1, 'Internal Job Order is required'),
});

type FormValues = z.infer<typeof formSchema>;

// Generate operator list like in React Native (emp001 to emp100)
const operatorsList = Array.from({ length: 100 }, (_, i) => {
  const num = i + 1;
  const cnt = num < 10 ? '00' : num < 100 ? '0' : '';
  return `Emp${cnt}${num}`;
});

// Add time formatting helpers (from ProductionRecordModal)
function toAmPmString(dateStr: string, timeStr: string) {
  // dateStr: 'YYYY-MM-DD', timeStr: 'HH:MM' (24h)
  if (!dateStr || !timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  let period = 'AM';
  if (hour >= 12) {
    period = 'PM';
    if (hour > 12) hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }
  return `${hour.toString().padStart(2, '0')}:${minute}:${period}`;
}

function fromAmPmString(dateStr: string, ampmStr: string) {
  // ampmStr: 'HH:MM:AM' or 'HH:MM:PM', returns 'YYYY-MM-DDTHH:MM'
  if (!dateStr || !ampmStr) return '';
  const [hourStr, minuteStr, period] = ampmStr.split(':');
  let hour = parseInt(hourStr, 10);
  if (period?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return `${dateStr}T${hour.toString().padStart(2, '0')}:${minuteStr}`;
}

export default function EmployeeEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerAdminEntry, setCustomerList] = useState<any[]>([]);
  const [totalQtySave, setTotalQty] = useState<any>({});
  const [showUpdateBtn, setShowUpdateBtn] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loader, setLoader] = useState(false);
  const [totalProductionHr, setTotalProductionHr] = useState('');
  const [totalWorkingHrs, setTotalWorkingHrs] = useState('');
  const [isCheckingQty, setIsCheckingQty] = useState(false);
  const [formValues, setFormValues] = useState<any>({});
  const router = useRouter();
  const { toast } = useToast();

  // Add state for time pickers
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');

  const defaultValues: FormValues = {
    operatorName: 'Emp001',
    date: new Date().toISOString().slice(0, 10),
    shift: 'First',
    machine: 'TC-1',
    customerName: '',
    componentName: '',
    qty: 0,
    additionalQty: undefined,
    opn: 'preMC',
    progNo: '',
    settingTime: '00:00:00',
    cycleTime: '00:00:00',
    handlingTime: '00:00:00',
    idleTime: '00:00:00',
    startTime: '01:00:AM',
    endTime: '01:00:PM',
    remarks: '',
    internalJobOrder: '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const watchedCustomer = form.watch('customerName');
  const watchedComponent = form.watch('componentName');
  const watchedQty = form.watch('qty');

  useEffect(() => {
    fetchCustomer();
  }, []);

  // Reset component name when customer changes
  useEffect(() => {
    if (watchedCustomer) {
      const customerComponents = customerAdminEntry.filter(
        (entry: any) => entry.customerName === watchedCustomer
      );
      
      if (customerComponents.length > 0 && !form.getValues('componentName')) {
        const firstComponent = customerComponents[0];
        form.setValue('componentName', firstComponent.componentName);
        setTotalQty(firstComponent);
      }
    }
  }, [watchedCustomer, customerAdminEntry, form]);

  // On form load, set picker values from defaultValues
  useEffect(() => {
    const date = form.getValues('date');
    setStartTimeInput(fromAmPmString(date, form.getValues('startTime')));
    setEndTimeInput(fromAmPmString(date, form.getValues('endTime')));
  }, []);

  // When date changes, update time pickers
  useEffect(() => {
    const date = form.getValues('date');
    setStartTimeInput(fromAmPmString(date, form.getValues('startTime')));
    setEndTimeInput(fromAmPmString(date, form.getValues('endTime')));
  }, [form.watch('date')]);

  // Check if entered quantity exceeds available quantity
  useEffect(() => {
    if (watchedQty > 0 && Object.keys(totalQtySave).length && totalQtySave.qty < watchedQty) {
      toast({
        title: 'Warning',
        description: `Entered quantity (${watchedQty}) exceeds available quantity (${totalQtySave.qty})`,
        variant: 'destructive',
      });
    }
  }, [watchedQty, totalQtySave, toast]);

  const fetchCustomer = async () => {
    try {
      console.log('Fetching customer data...');
      // Use proxy in development, production API in production
      const response = await fetch('/api/getCustomerList');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch customer list: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Customer data received:', data.length, 'items');
      
      if (data.length) {
        setCustomerList(data);
        
        // Get unique customer names and select first one
        const uniqueCustomers = [...new Set(data.map((item: any) => item.customerName))];
        const customerName = uniqueCustomers[0];
        console.log('Selected customer:', customerName);
        
        // Get the most recent component for this customer
        const customerComponents = data.filter((item: any) => item.customerName === customerName);
        const componentCur = customerComponents.reduce((a: any, b: any) => 
          new Date(a.created || a.createdAt) > new Date(b.created || b.createdAt) ? a : b
        );
        const componentName = componentCur.componentName;
        console.log('Selected component:', componentName);
        
        // Set the quantity object
        setTotalQty(componentCur);
        
        // Update form values
        form.setValue('customerName', customerName as string);
        form.setValue('componentName', componentName as string);
        console.log('Form values updated successfully');
      } else {
        console.log('No customer data available');
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customer data',
        variant: 'destructive',
      });
    }
  };

  const fetchNewQty = async (customerName: string, componentName: string) => {
    if (!customerName || !componentName) {
      toast({
        title: 'Error',
        description: 'Please select customer and component first',
        variant: 'destructive',
      });
      return;
    }

    setIsCheckingQty(true);
    
    try {
      // Use proxy in development, production API in production
      const response = await fetch('/api/getCustomerList');
      if (!response.ok) {
        throw new Error('Failed to fetch customer list');
      }
      const data = await response.json();
      
      if (data.length) {
        const qtyObj = data.filter((cus: any) => 
          cus.customerName === customerName && cus.componentName === componentName
        );
        
        let newQtyObj = qtyObj[0];
        if (qtyObj.length > 1) {
          const getLatestComp = qtyObj.reduce((a: any, b: any) => 
            new Date(a.created || a.createdAt) > new Date(b.created || b.createdAt) ? a : b
          );
          if (Object.keys(getLatestComp).length) {
            newQtyObj = getLatestComp;
          }
        }
        
        setTotalQty(newQtyObj);
        toast({
          title: 'Quantity Updated',
          description: `Available quantity for ${componentName}: ${newQtyObj.qty}`,
        });
      }
    } catch (error) {
      console.error('Error fetching quantity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch quantity data',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingQty(false);
    }
  };

  // Utility functions (these would come from util file)
  const addTimes = (time1: string, time2: string): string => {
    const [h1, m1, s1] = time1.split(':').map(Number);
    const [h2, m2, s2] = time2.split(':').map(Number);
    
    let totalSeconds = (h1 * 3600 + m1 * 60 + s1) + (h2 * 3600 + m2 * 60 + s2);
    
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getWorkingHrDiff = (date: string, startTime: string, endTime: string): string => {
    // Parse 12h format "HH:MM:AM" or "HH:MM:PM" to minutes since midnight
    const toMinutes = (ampmTime: string): number => {
      const parts = ampmTime.split(':');
      let hour = parseInt(parts[0], 10) || 0;
      const minute = parseInt(parts[1], 10) || 0;
      const period = (parts[2] || '').toUpperCase();
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour * 60 + minute;
    };

    let startMins = toMinutes(startTime);
    let endMins = toMinutes(endTime);
    if (endMins <= startMins) endMins += 24 * 60; // end is next day (e.g. 8 PM → 8 AM)

    const diffMins = endMins - startMins;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      console.log('Form values being submitted:', values);
      console.log('Form is valid:', form.formState.isValid);
      console.log('Form errors:', form.formState.errors);
      
      // Validate required fields
      if (!values.operatorName || !values.date || !values.customerName || !values.componentName || !values.internalJobOrder) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Check quantity validation
      if (Object.keys(totalQtySave).length && totalQtySave.qty < parseInt(values.qty.toString())) {
        toast({
          title: 'Error',
          description: 'Entered Qty is higher than the available qty',
          variant: 'destructive',
        });
        setFormValues(values);
        return;
      }

      setModalVisible(true);
      setFormValues(values);
      console.log('Modal should be visible now, formValues set:', values);
      
      // Calculate production hours
      const addedCycleHandleTime = addTimes(values.cycleTime, values.handlingTime);
      const totalQty = values.additionalQty && values.additionalQty > 0 ? values.qty + values.additionalQty : values.qty;
      const qtyFilledArray = Array(totalQty).fill(addedCycleHandleTime);
      
      const totalCycleHandleTimeWithQty = qtyFilledArray.reduce((acc, obj) => {
        return addTimes(acc, obj);
      }, '00:00:00');
      
      const totalProductionHrWithSettingTime = addTimes(totalCycleHandleTimeWithQty, values.settingTime);
      setTotalProductionHr(totalProductionHrWithSettingTime);
      
      // Calculate working hours
      const startEndTimeDiff = getWorkingHrDiff(values.date, values.startTime, values.endTime);
      const [idleHours, idleMinutes] = values.idleTime.split(':').map(Number);
      const idleTotalMinutes = idleHours * 60 + idleMinutes;
      const [diffHours, diffMinutes] = startEndTimeDiff.split(':').map(Number);
      const diffTotalMinutes = diffHours * 60 + diffMinutes;
      const workingMinutes = diffTotalMinutes - idleTotalMinutes;
      const workingHours = Math.floor(workingMinutes / 60);
      const remainingMinutes = workingMinutes % 60;
      const totalWrkHr = `${workingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
      setTotalWorkingHrs(totalWrkHr);
      
    } catch (err) {
      console.error('Error in form submission:', err);
      toast({
        title: 'Error',
        description: 'Failed to process form data',
        variant: 'destructive',
      });
    }
  };

  const saveFormData = async () => {
    setLoader(true);
    
    try {
      console.log('Starting save process...');
      console.log('Form values:', formValues);
      
      // Convert date to ISO format
      const isoDate = new Date(formValues.date).toISOString();
      console.log('Converted date:', isoDate);

      // Prepare payload (include calculated fields from modal state)
      const payload = {
        ...formValues,
        date: isoDate,
        ...(totalProductionHr ? { totalProductionHr } : {}),
        ...(totalWorkingHrs ? { totalWorkingHrs } : {}),
        ...(showUpdateBtn ? { id: showUpdateBtn } : {}),
      };
      
      console.log('Payload being sent:', payload);
      console.log('Request method:', showUpdateBtn ? 'PUT' : 'POST');

      const response = await fetch('/api/employeeForm', {
        method: showUpdateBtn ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), 
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Failed to save employee entry: ${response.status} - ${errorText}`);
      }

      const res = await response.json();
      console.log('Response data:', res);
      
      if (res && res.status === 'ok') {
        setLoader(false);
        setModalVisible(false);
        
        // Show success dialog like in React Native
        const shouldEdit = window.confirm(
          'Data saved successfully!!! Click Edit if you need to edit the saved data, Click Ok to create new entry.'
        );
        
        if (!shouldEdit) {
          // Edit mode
          setShowUpdateBtn(res.response._id);
          toast({
            title: 'Success',
            description: 'Entry saved successfully. You can now edit it.',
          });
        } else {
          // Create new entry
          setShowUpdateBtn(false);
          form.reset(defaultValues);
          setTotalProductionHr('');
          setTotalWorkingHrs('');
          setTotalQty({});
          fetchCustomer();
          
          toast({
            title: 'Success',
            description: 'Entry saved successfully. Form reset for new entry.',
          });
        }
      } else {
        console.error('Response status not ok:', res);
        throw new Error(`Server returned status: ${res.status || 'unknown'}`);
      }
    } catch (error) {
      setLoader(false);
      console.error('Error saving employee entry:', error);
      toast({
        title: 'Error',
        description: `Failed to save employee entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const editFormDataBeforeSave = () => {
    setLoader(false);
    setModalVisible(false);
  };

  const handleCustomerChange = (customerName: string) => {
    form.setValue('customerName', customerName);
    form.setValue('componentName', ''); // Clear component name
  };

  // Get available quantity display
  const getAvailableQty = () => {
    if (customerAdminEntry.length && watchedComponent) {
      if (totalQtySave && Object.keys(totalQtySave).length) {
        return totalQtySave.componentName === watchedComponent 
          ? totalQtySave.qty 
          : customerAdminEntry.reduce((a: any, b: any) => 
              new Date(a.created || a.createdAt) > new Date(b.created || b.createdAt) ? a : b
            ).qty;
      } else {
        return customerAdminEntry.reduce((a: any, b: any) => 
          new Date(a.created || a.createdAt) > new Date(b.created || b.createdAt) ? a : b
        ).qty;
      }
    }
    return Object.keys(totalQtySave).length 
      ? (totalQtySave.componentName === watchedComponent ? totalQtySave.qty : 0) 
      : 0;
  };

  const availableQty = getAvailableQty();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Employee Production Entry</CardTitle>
          <p className="text-center text-muted-foreground">Fill in the production details below</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => {
              console.log('Form submitted successfully with values:', values);
              onSubmit(values);
            }, (errors) => {
              console.error('Form validation errors:', errors);
              toast({
                title: 'Validation Error',
                description: 'Please check all required fields and try again.',
                variant: 'destructive',
              });
            })} className="space-y-6">
              {/* Operator Name */}
              <FormField
                control={form.control}
                name="operatorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Operator Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {operatorsList.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12" {...field} />
                    </FormControl>
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
                    <FormLabel className="text-base font-semibold">Shift</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="First">First - 8:00 AM TO 4:30 PM</SelectItem>
                        <SelectItem value="Second">Second - 4:30 PM TO 1:00 AM</SelectItem>
                        <SelectItem value="Third">Third - 1:00 AM TO 8:00 AM</SelectItem>
                        <SelectItem value="12hrMng">12hr Shift - 8:00 AM TO 8:00 PM</SelectItem>
                        <SelectItem value="12hrNight">12hr Shift - 8:00 PM TO 8:00 AM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Machine */}
              <FormField
                control={form.control}
                name="machine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Machine</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select machine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TC-1">TC-1</SelectItem>
                        <SelectItem value="TC-2">TC-2</SelectItem>
                        <SelectItem value="TC-3">TC-3</SelectItem>
                        <SelectItem value="VMC">VMC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Customer Name</FormLabel>
                    <Select onValueChange={handleCustomerChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...new Set(customerAdminEntry.map((item: any) => item.customerName))].map((customer: any) => (
                          <SelectItem key={customer} value={customer}>
                            {customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Component Name */}
              <FormField
                control={form.control}
                name="componentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Component Name</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        try {
                          field.onChange(value);
                          // Update quantity when component changes
                          if (value && watchedCustomer) {
                            const componentEntry = customerAdminEntry.find(
                              (entry: any) => entry.customerName === watchedCustomer && entry.componentName === value
                            );
                            if (componentEntry) {
                              setTotalQty(componentEntry);
                            }
                          }
                        } catch (error) {
                          console.error('Error updating component:', error);
                        }
                      }} 
                      defaultValue={field.value}
                      disabled={!watchedCustomer || customerAdminEntry.filter((entry: any) => entry.customerName === watchedCustomer).length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={!watchedCustomer ? "Select customer first" : "Select component"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {watchedCustomer && [...new Set(
                          customerAdminEntry
                            .filter((entry: any) => entry.customerName === watchedCustomer)
                            .map((entry: any) => entry.componentName)
                        )].map((componentName: string) => (
                          <SelectItem key={componentName} value={componentName}>
                            {componentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity with Available Qty Display */}
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base font-semibold">
                        Qty - Available Qty: {availableQty}
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        {watchedCustomer && watchedComponent && (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Available:</span>
                            <Badge variant={availableQty > 0 ? "default" : "destructive"}>
                              {availableQty}
                            </Badge>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fetchNewQty(watchedCustomer, watchedComponent)}
                          disabled={isCheckingQty || !watchedCustomer || !watchedComponent}
                        >
                          {isCheckingQty ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Check Qty
                        </Button>
                      </div>
                    </div>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        maxLength={7}
                        className={`h-12 ${watchedQty > availableQty && availableQty > 0 ? 'border-red-500' : ''}`}
                        {...field} 
                      />
                    </FormControl>
                    {watchedQty > availableQty && availableQty > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        Quantity exceeds available stock ({availableQty})
                      </div>
                    )}
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
                    <FormLabel className="text-base font-semibold">Additional Qty: Enter if available</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        maxLength={7} 
                        className="h-12" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseInt(value, 10));
                        }}
                      />
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
                    <FormLabel className="text-base font-semibold">OPN</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select OPN" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="preMC">Pre M/C</SelectItem>
                        <SelectItem value="first_opn">First_opn</SelectItem>
                        <SelectItem value="second_opn">Second_opn</SelectItem>
                        <SelectItem value="third_opn">Third_opn</SelectItem>
                        <SelectItem value="fourth_opn">Fourth_opn</SelectItem>
                        <SelectItem value="R/W">R/W</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormLabel className="text-base font-semibold">Prog No.</FormLabel>
                    <FormControl>
                      <Input className="h-12" {...field} />
                    </FormControl>
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
                    <FormLabel className="text-base font-semibold">Internal Job Order</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!watchedCustomer || customerAdminEntry.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={!watchedCustomer ? "Select customer first" : "Select job order"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...new Set(
                          customerAdminEntry
                            .filter((entry: any) => 
                              entry.internalJobOrder // Ensure internalJobOrder exists
                            )
                            .map((entry: any) => entry.internalJobOrder)
                        )].map((jobOrder: string) => (
                          <SelectItem key={jobOrder} value={jobOrder}>
                            {jobOrder}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Fields in a Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cycle Time */}
                <FormField
                  control={form.control}
                  name="cycleTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Cycle Time - "HH:MM:SS"</FormLabel>
                      <FormControl>
                        <Input placeholder="00:00:00" className="h-12" {...field} />
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
                      <FormLabel className="text-base font-semibold">Setting Time - "HH:MM:SS"</FormLabel>
                      <FormControl>
                        <Input placeholder="00:00:00" className="h-12" {...field} />
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
                      <FormLabel className="text-base font-semibold">Handling Time - "HH:MM:SS"</FormLabel>
                      <FormControl>
                        <Input placeholder="00:00:00" className="h-12" {...field} />
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
                      <FormLabel className="text-base font-semibold">Idle Time - "HH:MM:SS"</FormLabel>
                      <FormControl>
                        <Input placeholder="00:00:00" className="h-12" {...field} />
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
                      <FormLabel className="text-base font-semibold">Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={startTimeInput.split('T')[1] || ''}
                          onChange={e => {
                            setStartTimeInput(`${form.getValues('date')}T${e.target.value}`);
                            field.onChange(toAmPmString(form.getValues('date'), e.target.value));
                          }}
                          className="h-12"
                        />
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
                      <FormLabel className="text-base font-semibold">End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={endTimeInput.split('T')[1] || ''}
                          onChange={e => {
                            setEndTimeInput(`${form.getValues('date')}T${e.target.value}`);
                            field.onChange(toAmPmString(form.getValues('date'), e.target.value));
                          }}
                          className="h-12"
                        />
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
                    <FormLabel className="text-base font-semibold">Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional remarks or notes..."
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || modalVisible}
                  className="w-full md:w-auto px-12 py-3 text-lg font-semibold bg-[#84c225] hover:bg-[#6fa01c]"
                  size="lg"
                  onClick={() => {
                    console.log('Submit button clicked');
                    console.log('Form state:', form.formState);
                    console.log('Form values:', form.getValues());
                  }}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {showUpdateBtn ? 'UPDATE' : 'SUBMIT'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Form Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><strong>Date:</strong> {formValues.date}</div>
            <div><strong>Operator Name:</strong> {formValues.operatorName}</div>
            <div><strong>Shift:</strong> {formValues.shift}</div>
            <div><strong>Machine:</strong> {formValues.machine}</div>
            <div><strong>Customer Name:</strong> {formValues.customerName}</div>
            <div><strong>Component Name:</strong> {formValues.componentName}</div>
            <div><strong>Internal Job Order:</strong> {formValues.internalJobOrder}</div>
            <div><strong>Qty:</strong> {formValues.qty}</div>
            {formValues.additionalQty && formValues.additionalQty > 0 && (
              <div><strong>Additional Qty:</strong> {formValues.additionalQty}</div>
            )}
            <div><strong>OPN:</strong> {formValues.opn}</div>
            <div><strong>Prog No:</strong> {formValues.progNo}</div>
            <div><strong>Setting Time:</strong> {formValues.settingTime || '00:00:00'}</div>
            <div><strong>Cycle Time:</strong> {formValues.cycleTime}</div>
            <div><strong>Handling Time:</strong> {formValues.handlingTime}</div>
            <div><strong>Idle Time:</strong> {formValues.idleTime || '00:00:00'}</div>
            <div><strong>Start Time:</strong> {formValues.startTime}</div>
            <div><strong>End Time:</strong> {formValues.endTime}</div>
            <div><strong>Remarks:</strong> {formValues.remarks || 'none'}</div>
            <div><strong>Total Production Hour:</strong> {totalProductionHr}</div>
            <div><strong>Total Working Hour:</strong> {totalWorkingHrs}</div>
          </div>
          <div className="flex justify-center gap-4 pt-6">
            <Button
              onClick={() => {
                console.log('Save button clicked');
                saveFormData();
              }}
              disabled={loader}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loader && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button
              variant="outline"
              onClick={editFormDataBeforeSave}
              disabled={loader}
            >
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}