"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getResources, createResource, updateResource, deleteResource, AVResource } from "@/app/actions/resourceActions";
import { GlassCard } from "@/components/ui/GlassCard";
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";
import { toast } from "sonner";

export default function ResourceManagementPage() {
    const [resources, setResources] = useState<AVResource[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { register, handleSubmit, reset, setValue } = useForm<AVResource>();

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        setIsLoading(true);
        try {
            const data = await getResources();
            setResources(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load resources");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: AVResource) => {
        try {
            // Split triggers string back into array if needed (simplified form handling)
            const triggersArray = typeof data.triggers === 'string'
                ? (data.triggers as string).split(',').map((t: string) => t.trim())
                : data.triggers;

            const payload = { ...data, triggers: triggersArray };

            if (editingId) {
                await updateResource(editingId, payload);
                toast.success("Resource updated");
            } else {
                await createResource(payload);
                toast.success("Resource created");
            }
            setEditingId(null);
            reset();
            loadResources();
        } catch (error) {
            console.error(error);
            toast.error("Operation failed");
        }
    };

    const handleEdit = (resource: AVResource) => {
        setEditingId(resource.id!);
        setValue("name", resource.name);
        setValue("address", resource.address);
        setValue("phone", resource.phone);
        setValue("notes", resource.notes);
        // Display triggers as comma-separated string
        setValue("triggers", (resource.triggers || []).join(", ") as any);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;
        try {
            await deleteResource(id);
            toast.success("Resource deleted");
            loadResources();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        reset();
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Clinical Resource Manager
                    </h1>
                    <p className="text-gray-500 mt-2">Manage the AI's internal knowledge base of local providers.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <GlassCard className="p-6 sticky top-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            {editingId ? <FiEdit2 /> : <FiPlus />}
                            {editingId ? "Edit Resource" : "Add New Resource"}
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input {...register("name", { required: true })} className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Paving the Way" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <input {...register("address", { required: true })} className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 123 Main St, Lancaster" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input {...register("phone")} className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(661) 555-0123" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea {...register("notes")} className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="Services provided, hours, etc." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Triggers (comma separated)</label>
                                <input {...register("triggers")} className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Unemployed, Probations, Housing" />
                                <p className="text-xs text-gray-500 mt-1">Keywords that trigger this referral.</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
                                    <FiSave /> {editingId ? "Update" : "Create"}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={handleCancel} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition">
                                        <FiX /> Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </GlassCard>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold mb-4">Existing Resources ({resources.length})</h2>
                    {isLoading ? (
                        <p className="text-gray-500 animate-pulse">Loading resources...</p>
                    ) : resources.length === 0 ? (
                        <p className="text-gray-500 italic">No resources found. Add one to get started.</p>
                    ) : (
                        resources.map((resource) => (
                            <GlassCard key={resource.id} className="p-4 flex justify-between items-start group hover:shadow-md transition">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{resource.name}</h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        📍 {resource.address}
                                        {resource.phone && <span className="text-gray-400">|</span>}
                                        {resource.phone && <span>📞 {resource.phone}</span>}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-2">{resource.notes}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {resource.triggers?.map((trigger, i) => (
                                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                                                {trigger}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(resource)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition">
                                        <FiEdit2 />
                                    </button>
                                    <button onClick={() => handleDelete(resource.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
