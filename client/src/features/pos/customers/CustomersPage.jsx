import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Users, Mail, Phone } from "lucide-react";
import { customersApi } from "../../../api/customers.api";
import { useDebounce } from "../../../hooks/useDebounce";
import { PosLayout } from "../../../components/layout/PosLayout";
import { Input } from "../../../components/common/Input";
import { Button } from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import { Card } from "../../../components/common/Card";
import { CardSkeleton } from "../../../components/common/Skeletons";
import { EmptyState } from "../../../components/common/EmptyState";
import { useAuth } from "../../../context/AuthContext";

export default function CustomersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const debouncedSearch = useDebounce(search);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch],
    queryFn: () => customersApi.list({ search: debouncedSearch || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () => customersApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
      setModalOpen(false);
      setForm({ name: "", email: "", phone: "" });
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  return (
    <PosLayout searchSlot={<Input placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="!min-h-9" />}>
      <div className="mx-auto max-w-5xl p-4 lg:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-brand-espresso">Customers</h1>
            <p className="text-sm text-text-muted">{customers?.length ?? 0} customers</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>Add customer</Button>
        </div>

        {isLoading ? (
          <CardSkeleton count={6} />
        ) : !customers?.length ? (
          <EmptyState icon={Users} title="No customers" description="Add a customer to attach to orders." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <Card key={c.id} className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                <p className="font-semibold text-brand-espresso">{c.name}</p>
                {c.email && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                    <Mail size={14} className="text-text-muted" /> {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                    <Phone size={14} className="text-text-muted" /> {c.phone}
                  </p>
                )}
                {isAdmin && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-4"
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(c.id)}
                  >
                    Delete
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New customer">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <Button className="mt-6 w-full" loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
          Save
        </Button>
      </Modal>
    </PosLayout>
  );
}
