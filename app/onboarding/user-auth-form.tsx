"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, LogOut } from 'lucide-react';
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/types/UserTypes';

const departments = [
  { value: 'CSE', label: 'CSE' },
  { value: 'ECE', label: 'ECE' },
  { value: 'IT', label: 'IT' }
];

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  batch: string;
  admissionNumber: string;
  admissionYear: string;
  candidateCode: string;
  department: string;
  dateOfBirth: string;
  designation: string;
  dateOfJoining: string;
};

  const FormField = ({ id, label, type = 'text', placeholder, value, error, disabled, onChange }: { id: keyof FormData; label: string; type?: string; placeholder?: string; value: string; error?: string; disabled?: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} value={value}
        onChange={onChange} name={id} disabled={disabled} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
  
  const SelectField = ({ id, label, value, error, options, placeholder, disabled, onValueChange }: { id: keyof FormData; label: string; value: string; error?: string; options: { value: string; label: string }[]; placeholder: string; disabled?: boolean; onValueChange: (value: string) => void; }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent position="popper" sideOffset={5}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>

export function SignUpUserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', phone: '', gender: '',
    batch: '',
    admissionNumber: '', admissionYear: '', candidateCode: '', department: '', dateOfBirth: '',
    designation: '', dateOfJoining: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const {user, incompleteProfile, isLoading : isPending, session, refetchUser} = useAuth();

  const ip = (incompleteProfile as any);
  const ipProfile = (ip?.profile ?? ip ?? {}) as any;
  const locked = {
    name: Boolean(incompleteProfile?.first_name || incompleteProfile?.last_name || (incompleteProfile as any)?.name),
    batch: Boolean(ipProfile?.batch),
    admissionNumber: Boolean(ipProfile?.adm_number),
    admissionYear: Boolean(ipProfile?.adm_year),
    candidateCode: Boolean(ipProfile?.candidate_code),
    department: Boolean(ipProfile?.department),
    dateOfBirth: Boolean(ipProfile?.date_of_birth),
  };

  useEffect(() => {
    if (isPending || !user) return;
    if (!session) return router.push('/signin');
    if(!incompleteProfile && user.first_name) {
      const redirectUrl = searchParams.get('r') || '/dashboard';
      return router.push(redirectUrl);
    }
    
    // Check if user has a role
    if (!user.role || (user.role == 'parent')) {
      setError('Only students and teachers can complete registration.');
      return;
    }

    const toInputDate = (value?: string) => {
      if (!value) return '';
      return value.includes('T') ? value.split('T')[0] : value;
    };

    const profile = (incompleteProfile ?? user) as User;
    const role = incompleteProfile?.role || user.role;
    const p = ((profile as any).profile ?? profile) as any;

    const fullName = profile.name || user.name || '';
    const inferredFirstName = fullName.split(' ')[0] || '';
    const inferredLastName = fullName.split(' ').slice(1).join(' ') || '';

    const batchValue = p.batch ?? (profile as any).batch;
    const batchId = typeof batchValue === 'string' ? batchValue : batchValue?._id;

    setFormData({
      firstName: profile.first_name || user.first_name || inferredFirstName,
      lastName: profile.last_name || user.last_name || inferredLastName,
      phone: String(profile.phone ?? user.phone ?? ''),
      gender: (profile.gender || user.gender || '') as string,
      batch: batchId || '',
      admissionNumber: p.adm_number || '',
      admissionYear: p.adm_year ? String(p.adm_year) : '',
      candidateCode: p.candidate_code || '',
      department: (p.department || '') as string,
      dateOfBirth: toInputDate(p.date_of_birth),
      designation: role === 'teacher' ? (p.designation || '') : '',
      dateOfJoining: toInputDate(role === 'teacher' ? p.date_of_joining : undefined),
    });

    setIsLoading(false);
  }, [incompleteProfile, isPending, router, searchParams, session, user]);
  
    const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleInputEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleInputChange(name as keyof FormData, value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim() || formData.firstName.length < 1) 
      newErrors.firstName = 'First name must be at least 1 characters';
    if (!formData.lastName.trim() || formData.lastName.length < 1) 
      newErrors.lastName = 'Last name must be at least 1 characters';
    if (!formData.phone.trim() || formData.phone.length < 10) 
      newErrors.phone = 'Phone number must be at least 10 digits';
    if (!formData.gender) newErrors.gender = 'Please select a gender';

    if (user?.role === 'student') {
      if (!formData.batch) newErrors.batch = 'Batch is required';
      if (!formData.admissionNumber.trim()) newErrors.admissionNumber = 'Required';
      if (!formData.admissionYear.trim()) newErrors.admissionYear = 'Required';
      if (!formData.candidateCode.trim()) newErrors.candidateCode = 'Required';
      if (!formData.department) newErrors.department = 'Required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';
    } else if (user?.role === 'teacher') {
      if (!formData.designation.trim()) newErrors.designation = 'Required';
      if (!formData.department) newErrors.department = 'Required';
      if (!formData.dateOfJoining) newErrors.dateOfJoining = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Submit the completion data to backend
      const phoneNumber = Number(formData.phone.replace(/\D/g, ''));
      const admissionYear = formData.admissionYear ? Number(formData.admissionYear) : undefined;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: phoneNumber,
          gender: formData.gender,
          profile: user?.role === 'student' ? {
            batch: formData.batch,
            adm_number: formData.admissionNumber,
            adm_year: admissionYear,
            candidate_code: formData.candidateCode,
            department: formData.department,
            date_of_birth: formData.dateOfBirth,
          } : {
            designation: formData.designation,
            department: formData.department,
            date_of_joining: formData.dateOfJoining,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete registration');
      }

      await refetchUser();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/signin');
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-3xl font-bold">Hi, {user?.name?.split(' ')[0] || user?.email.split('@')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm">
          Fill in your details to continue.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

    
      <form onSubmit={handleSubmit} className="space-y-4 px-4 sm:px-0">
        {/* Email Card with Sign Out */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-medium mt-1">{user?.email}</p>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon-sm"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-3">
          <FormField id="firstName" label="First Name" placeholder="John" value={formData.firstName} error={errors.firstName} disabled={locked.name} onChange={handleInputEvent} />
          <FormField id="lastName" label="Last Name" placeholder="Doe" value={formData.lastName} error={errors.lastName} disabled={locked.name} onChange={handleInputEvent} />
        </div>
        <FormField id="phone" label="Phone Number" type="tel" placeholder="+91 98765 43210" value={formData.phone} error={errors.phone} onChange={handleInputEvent} />
        <SelectField id="gender" label="Gender" value={formData.gender} error={errors.gender} placeholder="Select gender"
          options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} onValueChange={(value) => handleInputChange('gender', value)} />

        {/* Role-Specific Fields */}
        {user?.role === 'student' ? (
          <>
            {/* Only show batch field if it wasn't pre-filled during bulk import */}
            {!locked.batch && (
              <FormField 
                id="batch" 
                label="Batch" 
                placeholder="e.g., 2026-2030 or IT" 
                value={formData.batch} 
                error={errors.batch} 
                disabled={locked.batch} 
                onChange={handleInputEvent} 
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField id="admissionNumber" label="Admission No." placeholder="29CSE555" value={formData.admissionNumber} error={errors.admissionNumber} disabled={locked.admissionNumber} onChange={handleInputEvent} />
              <FormField id="admissionYear" label="Admission Year" type="number" placeholder="2026" value={formData.admissionYear} error={errors.admissionYear} disabled={locked.admissionYear} onChange={handleInputEvent} />
            </div>
            <FormField id="candidateCode" label="Candidate Code" placeholder="41529505078" value={formData.candidateCode} error={errors.candidateCode} disabled={locked.candidateCode} onChange={handleInputEvent} />
            <SelectField id="department" label="Department" value={formData.department} error={errors.department} placeholder="Select department" disabled={locked.department} options={departments} onValueChange={(value) => handleInputChange('department', value)} />
            <FormField id="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} error={errors.dateOfBirth} disabled={locked.dateOfBirth} onChange={handleInputEvent} />
          </>
        ): (
          <>
            <FormField id="designation" label="Designation" placeholder="Assistant Professor" value={formData.designation} error={errors.designation} onChange={handleInputEvent} />
            <SelectField id="department" label="Department" value={formData.department} error={errors.department} placeholder="Select department"
              options={[{ value: 'CSE', label: 'Computer Science and Engineering' }, { value: 'ECE', label: 'Electronics and Communication Engineering' }, { value: 'IT', label: 'Information Technology' }]} onValueChange={(value) => handleInputChange('department', value)} />
            <FormField id="dateOfJoining" label="Date of Joining" type="date" value={formData.dateOfJoining} error={errors.dateOfJoining} onChange={handleInputEvent} />
          </>
        )}

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!isLoading && "Complete Registration"}
        </Button>
      </form>

      <p className="px-6 text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}
