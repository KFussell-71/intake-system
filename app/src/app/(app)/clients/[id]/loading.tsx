import { ClientProfileSkeleton } from "@/features/clients/components/ClientProfileSkeleton";

export default function Loading() {
    return (
        <div className="container mx-auto p-4 md:py-8 max-w-7xl">
            <ClientProfileSkeleton />
        </div>
    );
}
