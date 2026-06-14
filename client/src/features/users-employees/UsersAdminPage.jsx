import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Trash2, Users } from "lucide-react";
import { usersApi } from "../../api/config.api";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { ListRow } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { TableSkeleton } from "../../components/common/Skeletons";

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list({ includeArchived: true }),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setForm({ name: "", email: "", password: "" });
      toast.success("Employee added");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => usersApi.toggleArchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Updated");
    },
    onError: (err) => toast.error(err.userMessage),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Employee deleted");
    },
    onError: (err) => toast.error(err.userMessage || "Failed to delete employee"),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout title="Employees">
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-4">
          {!users?.length ? (
            <EmptyState icon={Users} title="No employees" description="Add team members who can access the POS." />
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <ListRow key={u.id}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${u.is_archived ? "line-through text-text-muted" : ""}`}>{u.name}</p>
                      {u.is_archived && <Badge variant="neutral">Archived</Badge>}
                    </div>
                    <p className="text-sm text-text-muted">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.is_archived ? "neutral" : "success"}>{u.role}</Badge>
                    <Button variant="secondary" size="sm" onClick={() => archiveMutation.mutate(u.id)}>
                      {u.is_archived ? "Unarchive" : "Archive"}
                    </Button>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(u.id, u.name)}>
                      Delete
                    </Button>
                  </div>
                </ListRow>
              ))}
            </div>
          )}
          <div className="flex justify-center pt-2">
            <Button icon={Plus} onClick={() => setOpen(true)}>Add employee</Button>
          </div>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New employee">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button className="mt-6 w-full" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>Save</Button>
      </Modal>
    </AdminLayout>
  );
}
