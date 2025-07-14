'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AdminEntry } from '@/types';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCustomerList, saveAdminEntryForm, updateAdmitEntryForm } from '@/lib/utils';

const formSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  componentName: z.string().min(2, 'Component name must be at least 2 characters'),
  qty: z.coerce.number().int().positive('Quantity must be positive'),
  dcno: z.string().min(1, 'DC number is required'),
  internalJobOrder: z.string().min(1, 'Internal Job Order is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface AdminEntryFormProps {
  initialData?: AdminEntry;
}

export default function AdminEntryForm({ initialData }: AdminEntryFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [componentOpen, setComponentOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [componentSearch, setComponentSearch] = useState('');
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<string[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<string[]>([]);
  const [showUpdateBtn, setShowUpdateBtn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues: FormValues = {
    customerName: initialData?.customerName || '',
    componentName: initialData?.componentName || '',
    qty: initialData?.qty || 0,
    dcno: initialData?.dcno || '',
    internalJobOrder: initialData?.internalJobOrder || '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    fetchCustomer();
    if (initialData?._id) {
      setShowUpdateBtn(true);
    }
  }, [initialData]);

  // Replicate the fetchCustomer function from React Native
  const fetchCustomer = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomerList();
      
      if (data.length) {
        setCustomerData(data);
        
        // Get unique customer names
        const uniqueCustomers = [...new Set<string>(data.map((item: any) => item.customerName as string))];
        setFilteredCustomers(uniqueCustomers);
        
        // Get unique component names
        const uniqueComponents = [...new Set<string>(data.map((item: any) => item.componentName as string))];
        setFilteredComponents(uniqueComponents);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customer data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter customers based on search
  const findCustomer = (query: string) => {
    if (query) {
      const regex = new RegExp(query.trim(), 'i');
      const filtered = customerData
        .map(item => item.customerName as string)
        .filter(customer => customer.search(regex) >= 0);
      setFilteredCustomers([...new Set<string>(filtered)]);
    } else {
      const uniqueCustomers = [...new Set<string>(customerData.map((item: any) => item.customerName as string))];
      setFilteredCustomers(uniqueCustomers);
    }
  };

  // Filter components based on search and selected customer
  const findComponent = (query: string, customerNameParam?: string) => {
    if (query) {
      const regex = new RegExp(query.trim(), 'i');
      let data = customerData;
      
      // Filter components based on selected customer
      if (customerNameParam) {
        data = customerData.filter(obj => 
          obj.customerName.toUpperCase().includes(customerNameParam.toUpperCase())
        );
      }
      
      const filtered = data
        .map(item => item.componentName as string)
        .filter(component => component.search(regex) >= 0);
      setFilteredComponents([...new Set<string>(filtered)]);
    } else {
      if (customerNameParam) {
        // Show components for selected customer
        const customerComponents = customerData.filter(obj => 
          obj.customerName.toUpperCase().includes(customerNameParam.toUpperCase())
        );
        const uniqueComponents = [...new Set<string>(customerComponents.map(item => item.componentName as string))];
        setFilteredComponents(uniqueComponents);
      } else {
        // Show all components
        const uniqueComponents = [...new Set<string>(customerData.map((item: any) => item.componentName as string))];
        setFilteredComponents(uniqueComponents);
      }
    }
  };

  // Replicate the onSubmit function from React Native
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      let res;
      if (showUpdateBtn && initialData?._id) {
        // Update existing entry
        res = await updateAdmitEntryForm(values, initialData._id, 'admin');
      } else {
        // Save new entry
        res = await saveAdminEntryForm(values, 'saveAdminForm');
      }

      if (res && res.status === 'ok') {
        toast({
          title: 'Success',
          description: showUpdateBtn ? 'Admin entry updated successfully' : 'Admin entry added successfully',
        });

        if (!showUpdateBtn) {
          // Show edit option like in React Native version
          const shouldEdit = window.confirm(
            'Data saved successfully! Click OK to create new entry, or Cancel to edit the saved data.'
          );
          
          if (!shouldEdit) {
            // Edit mode - set the update button with the new entry ID
            setShowUpdateBtn(res.response._id);
            toast({
              title: 'Info',
              description: 'Entry saved. You can now edit it.',
            });
            return;
          }
          
          // Reset form for new entry
          form.reset(defaultValues);
          setCustomerSearch('');
          setComponentSearch('');
          fetchCustomer();
        } else {
          router.push('/admin');
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save admin entry',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving admin entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save admin entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSelect = (customer: string) => {
    form.setValue('customerName', customer);
    setCustomerSearch('');
    setCustomerOpen(false);
    
    // Filter components based on selected customer
    const customerComponents = customerData.filter(obj => 
      obj.customerName.toUpperCase().includes(customer.toUpperCase())
    );
    if (customerComponents.length) {
      const uniqueComponents = [...new Set<string>(customerComponents.map(item => item.componentName as string))];
      setFilteredComponents(uniqueComponents);
    }
  };

  const handleComponentSelect = (component: string) => {
    form.setValue('componentName', component);
    setComponentSearch('');
    setComponentOpen(false);
  };

  const handleAddNewCustomer = () => {
    if (customerSearch.trim()) {
      form.setValue('customerName', customerSearch.trim());
      setCustomerOpen(false);
      toast({
        title: 'New Customer Added',
        description: `"${customerSearch.trim()}" has been added as a new customer`,
      });
    }
  };

  const handleAddNewComponent = () => {
    if (componentSearch.trim()) {
      form.setValue('componentName', componentSearch.trim());
      setComponentOpen(false);
      toast({
        title: 'New Component Added',
        description: `"${componentSearch.trim()}" has been added as a new component`,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Admin Entry Form</CardTitle>
          <p className="text-center text-muted-foreground">
            {initialData ? 'Update existing entry' : 'Add new customer and component data'}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-base font-semibold">Customer Name</FormLabel>
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'h-12 justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading customers...
                              </>
                            ) : (
                              <>
                                {field.value || 'Enter the customer name'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search or type new customer name..."
                            value={customerSearch}
                            onValueChange={(value) => {
                              setCustomerSearch(value);
                              findCustomer(value);
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {customerSearch.trim() ? (
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={handleAddNewCustomer}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add "{customerSearch.trim()}"
                                  </Button>
                                </div>
                              ) : (
                                <div className="p-2 text-sm text-muted-foreground">
                                  Type to search or add new customer
                                </div>
                              )}
                            </CommandEmpty>
                            <CommandGroup>
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
                          </CommandList>
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
                    <FormLabel className="text-base font-semibold">Component Name</FormLabel>
                    <Popover open={componentOpen} onOpenChange={setComponentOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'h-12 justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading components...
                              </>
                            ) : (
                              <>
                                {field.value || 'Enter the component name'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search or type new component name..."
                            value={componentSearch}
                            onValueChange={(value) => {
                              setComponentSearch(value);
                              findComponent(value, form.watch('customerName'));
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {componentSearch.trim() ? (
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={handleAddNewComponent}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add "{componentSearch.trim()}"
                                  </Button>
                                </div>
                              ) : (
                                <div className="p-2 text-sm text-muted-foreground">
                                  Type to search or add new component
                                </div>
                              )}
                            </CommandEmpty>
                            <CommandGroup>
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
                          </CommandList>
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
                    <FormLabel className="text-base font-semibold">Internal Job Order</FormLabel>
                    <FormControl>
                      <Input className="h-12" {...field} />
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
                    <FormLabel className="text-base font-semibold">Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        maxLength={5}
                        className="h-12"
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
                    <FormLabel className="text-base font-semibold">DC Number</FormLabel>
                    <FormControl>
                      <Input className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-center gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#84c225] hover:bg-[#6fa01c] text-white font-bold px-12 py-3 text-lg"
                  size="lg"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {showUpdateBtn ? 'UPDATE' : 'SUBMIT'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}