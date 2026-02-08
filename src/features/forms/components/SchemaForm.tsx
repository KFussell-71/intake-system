"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

import { FormSchema, FormField, FormResponseData } from '../types';

interface SchemaFormProps {
    schema: FormSchema;
    onSubmit: (data: FormResponseData) => Promise<void>;
    onCancel?: () => void;
    initialData?: FormResponseData;
    submitLabel?: string;
}

export function SchemaForm({ schema, onSubmit, onCancel, initialData = {}, submitLabel = "Save" }: SchemaFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold">{schema.title}</h2>
                {schema.description && <p className="text-slate-500">{schema.description}</p>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {schema.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                        <Label>
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>

                        {['text', 'email', 'tel', 'date', 'password'].includes(field.type) && (
                            <Input
                                type={field.type}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                                placeholder={field.placeholder}
                            />
                        )}

                        {field.type === 'number' && (
                            <Input
                                type="number"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {field.type === 'textarea' && (
                            <Textarea
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {field.type === 'select' && (
                            <Select
                                value={formData[field.name]}
                                onValueChange={(v) => handleChange(field.name, v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options?.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {field.type === 'radio' && (
                            <RadioGroup
                                value={formData[field.name]}
                                onValueChange={(v) => handleChange(field.name, v)}
                                className="flex flex-col space-y-1"
                            >
                                {field.options?.map(opt => (
                                    <div key={opt.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
                                        <Label htmlFor={`${field.name}-${opt.value}`} className="font-normal">
                                            {opt.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}

                        {field.helperText && (
                            <p className="text-xs text-slate-500">{field.helperText}</p>
                        )}
                    </div>
                ))}

                <div className="flex justify-end gap-2 pt-4 border-t">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
