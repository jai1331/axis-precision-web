'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ProductionRecord } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, X, Edit } from 'lucide-react';

const formSchema = z.object({
  componentName: z.string().min(2, 'Component name must be at least 2 characters'),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  machineName: z.string().min(2, 'Machine name must be at least 2 characters'),
  operatorName: z.string().min(2, 'Operator name must be at least 2 characters'),
  shift: z.enum(['First', 'Second', 'Third', '12hrMng', '12hrNight']),
  qty: z.coerce.number().int().nonnegative('Quantity must be positive'),
  additionalQty: z.coerce.number().int().nonnegative('Additional quantity must be positive'),
  opn: z.string().min(1, 'OPN is required'),
  progNo: z.string().min(1, 'Program number is required'),
  settingTime: z.string().min(1, 'Setting time is required'),
  cycleTime: z.string().min(1, 'Cycle time is required'),
  handlingTime: z.string().min(1, 'Handling time is required'),
  idleTime: z.string().min(1, 'Idle time is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  remarks: z.string().optional(),
  dateOfEntry: z.string().min(1, 'Date of entry is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductionRecordModalProps {
  record: ProductionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (record: ProductionRecord) => void;
}

export default function ProductionRecordModal({
  record,
  isOpen,
  onClose,
  onUpdate,
}: ProductionRecordModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      componentName: '',
      customerName: '',
      machineName: '',
      operatorName: '',
      shift: 'First',
      qty: 0,
      additionalQty: 0,
      opn: '',
      progNo: '',
      settingTime: '',
      cycleTime: '',
      handlingTime: '',
      idleTime: '',
      startTime: '',
      endTime: '',
      remarks: '',
      dateOfEntry: '',
    },
  });

  useEffect(() => {
    if (record) {
      const formatTimeForInput = (timeStr: any, entryDate: string) => {
        if (!timeStr) return '';
        
        // Handle time strings like "01:00:AM" or "01:00:PM"
        if (typeof timeStr === 'string' && (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm'))) {
          try {
            // Convert "08:00:pm" to 24-hour format
            const timeParts = timeStr.split(':');
            const hour = timeParts[0];
            const minute = timeParts[1];
            const period = timeParts[2]?.toLowerCase();
            
            let hour24 = parseInt(hour);
            if (period === 'pm' && hour24 !== 12) {
              hour24 += 12;
            } else if (period === 'am' && hour24 === 12) {
              hour24 = 0;
            }
            
            // Use entry date with the time
            return `${entryDate}T${hour24.toString().padStart(2, '0')}:${minute}`;
          } catch (error) {
            return '';
          }
        }
        
        // Handle Date objects
        if (timeStr instanceof Date) {
          try {
            if (isNaN(timeStr.getTime())) {
              return '';
            }
            // Use entry date instead of the date from the timeStr
            const timeOnly = timeStr.toTimeString().slice(0, 5);
            return `${entryDate}T${timeOnly}`;
          } catch (error) {
            return '';
          }
        }
        
        // Handle other date strings
        try {
          const dateObj = new Date(timeStr);
          if (isNaN(dateObj.getTime())) {
            return '';
          }
          // Use entry date instead of the date from timeStr
          const timeOnly = dateObj.toTimeString().slice(0, 5);
          return `${entryDate}T${timeOnly}`;
        } catch (error) {
          return '';
        }
      };

      const formatDurationForInput = (durationStr: any) => {
        if (!durationStr) return '';
        
        // Handle duration strings like "00:08:00" (HH:MM:SS)
        if (typeof durationStr === 'string' && durationStr.includes(':')) {
          const parts = durationStr.split(':');
          if (parts.length >= 3) {
            // Return full HH:MM:SS format
            return `${parts[0]}:${parts[1]}:${parts[2]}`;
          } else if (parts.length >= 2) {
            // If only HH:MM, add :00 for seconds
            return `${parts[0]}:${parts[1]}:00`;
          }
        }
        
        return durationStr || '';
      };

      const formatDate = (date: any) => {
        try {
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            return new Date().toISOString().slice(0, 10);
          }
          return dateObj.toISOString().slice(0, 10);
        } catch (error) {
          return new Date().toISOString().slice(0, 10);
        }
      };

      form.reset({
        componentName: record.componentName,
        customerName: record.customerName,
        machineName: record.machineName,
        operatorName: record.operatorName,
        shift: record.shift as 'First' | 'Second' | 'Third' | '12hrMng' | '12hrNight',
        qty: record.qty,
        additionalQty: record.additionalQty,
        opn: record.opn,
        progNo: record.progNo,
        settingTime: formatDurationForInput(record.settingTime),
        cycleTime: formatDurationForInput(record.cycleTime),
        handlingTime: formatDurationForInput(record.handlingTime),
        idleTime: formatDurationForInput(record.idleTime),
        startTime: formatTimeForInput(record.startTime, formatDate(record.dateOfEntry)),
        endTime: formatTimeForInput(record.endTime, formatDate(record.dateOfEntry)),
        remarks: record.remarks || '',
        dateOfEntry: formatDate(record.dateOfEntry),
      });
    }
  }, [record, form]);

  const onSubmit = async (values: FormValues) => {
    if (!record?._id) return;

    setIsSubmitting(true);
    try {
      // Use proxy API route to avoid CORS issues
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      
      console.log(values, record._id, 'j req');
      const raw = JSON.stringify({ ...values, 'id': record._id });

      const requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        body: raw,
        redirect: 'follow' as RequestRedirect
      };

      console.log('/api/updateEmployeeForm', 'call put', requestOptions);
      const response = await fetch('/api/updateEmployeeForm', requestOptions);
      const body = await response.json();
      
      if (response.status !== 200) throw Error(body.message);
      
      toast({
        title: 'Success',
        description: 'Production record updated successfully',
      });

      if (onUpdate) {
        onUpdate(body);
      }

      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update production record',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Production Record Details</DialogTitle>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="componentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="machineName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="First">First-8:00 AM TO 4:30 PM</SelectItem>
                          <SelectItem value="Second">Second-4.30 PM TO 1:00 AM</SelectItem>
                          <SelectItem value="Third">Third-1:00 AM TO 8:00 AM</SelectItem>
                          <SelectItem value="12hrMng">12hr Shift-8:00 AM TO 8:00 PM</SelectItem>
                          <SelectItem value="12hrNight">12hr Shift-8:00 PM TO 8:00 AM</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="settingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setting Time</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g., 00:08:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cycleTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycle Time</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g., 00:00:08" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="handlingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handling Time</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g., 00:06:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idleTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idle Time</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g., 00:00:04" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Record
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Component Name</label>
                <p className="text-sm font-semibold">{record.componentName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                <p className="text-sm font-semibold">{record.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Machine Name</label>
                <p className="text-sm font-semibold">{record.machineName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Operator Name</label>
                <p className="text-sm">{record.operatorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Shift</label>
                <p className="text-sm">{record.shift}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                <p className="text-sm">{record.qty}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Additional Quantity</label>
                <p className="text-sm">{record.additionalQty}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Quantity</label>
                <p className="text-sm font-semibold">{record.totalQty}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">OPN</label>
                <p className="text-sm">{record.opn}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Program Number</label>
                <p className="text-sm">{record.progNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Setting Time</label>
                <p className="text-sm">{record.settingTime}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cycle Time</label>
                <p className="text-sm">{record.cycleTime}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Handling Time</label>
                <p className="text-sm">{record.handlingTime}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Idle Time</label>
                <p className="text-sm">{record.idleTime}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                <p className="text-sm">{typeof record.startTime === 'string' ? record.startTime : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">End Time</label>
                <p className="text-sm">{typeof record.endTime === 'string' ? record.endTime : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Production Hours</label>
                <p className="text-sm font-semibold">{record.totalProductionHr || '0:00:00'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Working Hours</label>
                <p className="text-sm font-semibold">{record.totalWorkingHr || '0:00'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date of Entry</label>
                <p className="text-sm">{new Date(record.dateOfEntry).toLocaleDateString()}</p>
              </div>
            </div>
            
            {record.remarks && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{record.remarks}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}